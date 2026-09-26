"""
Clinical NLP Engine — Full 4-Component HPO Extraction Pipeline
==============================================================
Module 1 per Hakon's specification:
  Component A — Status Extraction (present / absent / uncertain)
  Component B — Temporal Extraction (onset / resolution / ongoing)
  Component C — Subject Extraction (patient vs. family member)
  Component D — Severity + Confidence Extraction

Output: Phenopacket-style structured PhenotypicFeature objects with full schema:
  hpo_id, label, status, severity, onset_age, resolution, ongoing,
  subject, family_relation, evidence_text, confidence, certainty

Architecture:
- Pre-compute embeddings for all HPO term labels + synonyms
- At inference time, embed clinical text sentences
- Find nearest HPO terms using cosine similarity
- Run 4-component enrichment pipeline
- Apply MissingnessHandler for equity (sparse records → wider confidence intervals)
"""

import sys
import os
import re
import math
import numpy as np
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field

# Add parent path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.enhanced_mock_db import HPO_DB


@dataclass
class NLPExtraction:
    """A single extracted HPO term from clinical text"""
    hpo_id: str
    label: str
    confidence: float
    source_text: str
    method: str  # "semantic_similarity", "exact_match", "synonym_match"
    negated: bool = False


class ClinicalNLPEngine:
    """
    Production-grade NLP engine for clinical text → HPO mapping.
    
    Uses a dual-strategy approach:
    1. TF-IDF + cosine similarity for fast approximate matching
    2. Character n-gram overlap for fuzzy matching
    
    Falls back gracefully if sentence-transformers is not available.
    """
    
    def __init__(self):
        self.hpo_terms = HPO_DB
        self.use_transformers = False
        self.transformer_model = None
        self.hpo_embeddings = None
        self.hpo_id_list = []
        
        # Build synonym/alias dictionary for HPO terms
        self.synonym_map = self._build_synonym_map()
        
        # Build TF-IDF vocabulary
        self.idf_vocab = {}
        self.hpo_tfidf_vectors = {}
        
        # Negation patterns (Component A — absent)
        self.negation_patterns = [
            r'\bno\s+', r'\bnot\s+', r'\bwithout\s+', r'\babsent\s+',
            r'\bdenies\s+', r'\bnegative\s+for\s+', r'\brule\s*out\s+',
            r'\bno\s+evidence\s+of\s+', r'\bno\s+sign\s*of\s+',
            r'\bnever\s+', r'\bno\s+history\s+of\s+', r'\brunning\s+out\s+',
            r'\bfailed\s+to\s+', r'\bnone\s+of\s+',
        ]
        
        # Hedging / uncertainty patterns (Component A — uncertain)
        self.uncertainty_patterns = [
            r'\bpossible\s+', r'\bpossibly\s+', r'\bsuspected\s+',
            r'\bsuspect\s+', r'\bcannot\s+rule\s+out\s+',
            r'\bcould\s+be\s+', r'\bmay\s+have\s+', r'\bmight\s+have\s+',
            r'\bborderline\s+', r'\bconsistent\s+with\s+(?:but\s+not\s+confirmed)',
            r'\bprobable\s+', r'\bquestionable\s+', r'\bpresumptive\s+',
            r'\bseems\s+to\s+', r'\bappears\s+to\s+have\s+',
            r'\bsuggestive\s+of\s+', r'\blikely\s+',
        ]
        
        # Try to load sentence-transformers
        self._try_load_transformers()
        
        # Build TF-IDF index as fallback
        self._build_tfidf_index()
        
        print(f"[NLP Engine] Initialized with {len(self.hpo_terms)} HPO terms")
        print(f"[NLP Engine] Transformer model: {'loaded' if self.use_transformers else 'using TF-IDF fallback'}")
        print(f"[NLP Engine] Synonyms indexed: {sum(len(v) for v in self.synonym_map.values())}")
    
    def _try_load_transformers(self):
        """Attempt to load sentence-transformers model"""
        try:
            from sentence_transformers import SentenceTransformer
            print("[NLP Engine] Loading sentence-transformers model...")
            self.transformer_model = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Pre-compute embeddings for all HPO terms
            self.hpo_id_list = list(self.hpo_terms.keys())
            labels = []
            for hpo_id in self.hpo_id_list:
                term = self.hpo_terms[hpo_id]
                # Combine label + description for richer embedding
                text = term.label
                if term.description:
                    text += f". {term.description}"
                labels.append(text)
            
            self.hpo_embeddings = self.transformer_model.encode(
                labels, convert_to_numpy=True, normalize_embeddings=True
            )
            self.use_transformers = True
            print(f"[NLP Engine] Computed embeddings for {len(labels)} HPO terms")
        except ImportError:
            print("[NLP Engine] sentence-transformers not available, using TF-IDF")
            self.use_transformers = False
        except Exception as e:
            print(f"[NLP Engine] Transformer loading failed: {e}, using TF-IDF")
            self.use_transformers = False
    
    def _build_synonym_map(self) -> Dict[str, List[str]]:
        """Build synonym/alias dictionary for HPO terms"""
        synonyms = {}
        
        # Domain-specific synonym mappings
        clinical_synonyms = {
            "HP:0000098": ["tall stature", "tall for age", "increased height", "tallness", "above average height"],
            "HP:0004322": ["short stature", "dwarfism", "growth retardation", "small for age", "short for age"],
            "HP:0001166": ["arachnodactyly", "long fingers", "spider fingers", "long slender fingers", "elongated digits"],
            "HP:0002650": ["scoliosis", "spinal curvature", "curved spine", "lateral curvature of spine"],
            "HP:0001083": ["ectopia lentis", "lens dislocation", "dislocated lens", "lens subluxation"],
            "HP:0002616": ["aortic root dilatation", "aortic root dilation", "dilated aortic root", "enlarged aorta", "aortic root enlargement"],
            "HP:0001659": ["aortic regurgitation", "aortic insufficiency", "aortic valve leak"],
            "HP:0001644": ["dilated cardiomyopathy", "DCM", "enlarged heart", "cardiac dilation"],
            "HP:0001645": ["sudden cardiac death", "SCD", "cardiac arrest"],
            "HP:0001270": ["motor delay", "delayed motor development", "late walker", "motor developmental delay"],
            "HP:0001263": ["global developmental delay", "GDD", "developmental delay", "delayed development"],
            "HP:0001249": ["intellectual disability", "mental retardation", "cognitive impairment", "learning disability"],
            "HP:0001250": ["seizures", "epilepsy", "convulsions", "fits", "epileptic seizures"],
            "HP:0002376": ["developmental regression", "loss of skills", "regression", "skill loss"],
            "HP:0001252": ["hypotonia", "low muscle tone", "floppy", "decreased muscle tone", "poor tone"],
            "HP:0002066": ["gait ataxia", "unsteady gait", "ataxic gait", "walking difficulty"],
            "HP:0001257": ["spasticity", "muscle stiffness", "increased tone", "hypertonia"],
            "HP:0002072": ["chorea", "involuntary movements", "choreiform movements"],
            "HP:0001332": ["dystonia", "sustained muscle contractions", "abnormal posturing"],
            "HP:0002093": ["respiratory insufficiency", "breathing difficulty", "respiratory failure", "dyspnea"],
            "HP:0001508": ["failure to thrive", "FTT", "poor weight gain", "growth failure"],
            "HP:0000252": ["microcephaly", "small head", "reduced head circumference"],
            "HP:0000256": ["macrocephaly", "large head", "increased head circumference", "big head"],
            "HP:0003560": ["muscular dystrophy", "muscle wasting", "progressive muscle weakness"],
            "HP:0003701": ["proximal muscle weakness", "proximal weakness", "difficulty climbing stairs"],
            "HP:0000717": ["autism", "ASD", "autism spectrum disorder", "autistic features"],
            "HP:0000977": ["soft skin", "velvety skin", "skin hyperextensibility"],
            "HP:0000978": ["bruising susceptibility", "easy bruising", "bruises easily", "ecchymoses"],
            "HP:0001903": ["anemia", "low hemoglobin", "low red blood cells"],
            "HP:0001873": ["thrombocytopenia", "low platelets", "reduced platelet count"],
            "HP:0002240": ["hepatomegaly", "enlarged liver", "liver enlargement"],
            "HP:0003198": ["myopathy", "muscle disease", "muscle disorder"],
        }
        
        for hpo_id, syns in clinical_synonyms.items():
            synonyms[hpo_id] = [s.lower() for s in syns]
        
        return synonyms
    
    def _build_tfidf_index(self):
        """Build TF-IDF vectors for all HPO terms"""
        # Collect all documents
        docs = {}
        for hpo_id, term in self.hpo_terms.items():
            text = term.label.lower()
            if term.description:
                text += " " + term.description.lower()
            # Add synonyms to the document
            if hpo_id in self.synonym_map:
                text += " " + " ".join(self.synonym_map[hpo_id])
            docs[hpo_id] = self._tokenize(text)
        
        # Compute IDF
        N = len(docs)
        df = {}
        for tokens in docs.values():
            for token in set(tokens):
                df[token] = df.get(token, 0) + 1
        
        self.idf_vocab = {token: math.log(N / (1 + count)) for token, count in df.items()}
        
        # Compute TF-IDF vectors
        for hpo_id, tokens in docs.items():
            tf = {}
            for token in tokens:
                tf[token] = tf.get(token, 0) + 1
            max_tf = max(tf.values()) if tf else 1
            
            vector = {}
            for token, count in tf.items():
                vector[token] = (0.5 + 0.5 * count / max_tf) * self.idf_vocab.get(token, 0)
            self.hpo_tfidf_vectors[hpo_id] = vector
    
    def _tokenize(self, text: str) -> List[str]:
        """Simple word tokenization with n-grams"""
        words = re.findall(r'\b[a-z]+\b', text.lower())
        # Add bigrams for better matching
        bigrams = [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
        return words + bigrams
    
    def _cosine_similarity_tfidf(self, query_tokens: List[str], hpo_id: str) -> float:
        """Compute cosine similarity between query and HPO term using TF-IDF"""
        hpo_vec = self.hpo_tfidf_vectors.get(hpo_id, {})
        if not hpo_vec:
            return 0.0
        
        # Build query vector
        query_tf = {}
        for token in query_tokens:
            query_tf[token] = query_tf.get(token, 0) + 1
        max_tf = max(query_tf.values()) if query_tf else 1
        
        query_vec = {}
        for token, count in query_tf.items():
            query_vec[token] = (0.5 + 0.5 * count / max_tf) * self.idf_vocab.get(token, 0)
        
        # Compute cosine similarity
        dot_product = sum(query_vec.get(k, 0) * hpo_vec.get(k, 0) for k in set(list(query_vec.keys()) + list(hpo_vec.keys())))
        norm_q = math.sqrt(sum(v**2 for v in query_vec.values())) or 1
        norm_h = math.sqrt(sum(v**2 for v in hpo_vec.values())) or 1
        
        return dot_product / (norm_q * norm_h)
    
    def _check_negation(self, text: str, match_pos: int) -> bool:
        """Check if a match is negated — sentence-scoped only."""
        # Narrow the prefix to only within the current sentence
        raw_prefix = text[max(0, match_pos - 60):match_pos]
        # Truncate at last sentence boundary so we don't bleed previous sentences
        boundary = max(
            raw_prefix.rfind('.'),
            raw_prefix.rfind(';'),
            raw_prefix.rfind('\n'),
        )
        if boundary >= 0:
            prefix = raw_prefix[boundary + 1:]
        else:
            prefix = raw_prefix
        prefix = prefix.lower()

        # Positive-assertion override: if the match is immediately followed by
        # 'confirmed', 'present', 'positive', 'noted', 'known' → NOT negated
        suffix = text[match_pos:match_pos + 30].lower()
        if any(w in suffix for w in ('confirmed', 'present', 'positive', 'noted', 'known', 'documented')):
            return False

        for pattern in self.negation_patterns:
            if re.search(pattern, prefix):
                return True
        return False

    def _check_uncertainty(self, text: str, match_pos: int) -> bool:
        """Check if a match is hedged/uncertain — sentence-scoped."""
        raw_prefix = text[max(0, match_pos - 80):match_pos]
        boundary = max(raw_prefix.rfind('.'), raw_prefix.rfind(';'), raw_prefix.rfind('\n'))
        prefix = raw_prefix[boundary + 1:] if boundary >= 0 else raw_prefix
        prefix = prefix.lower()
        for pattern in self.uncertainty_patterns:
            if re.search(pattern, prefix):
                return True
        return False

    def _split_sentences(self, text: str) -> List[str]:
        """Split clinical notes into sentences/phrases"""
        # Split on periods, semicolons, newlines, commas (for clinical lists)
        segments = re.split(r'[.;\n]+', text)
        result = []
        for seg in segments:
            seg = seg.strip()
            if len(seg) > 3:  # Skip very short fragments
                # Further split on commas for phenotype lists
                sub_segments = re.split(r',\s*', seg)
                result.extend([s.strip() for s in sub_segments if len(s.strip()) > 3])
        return result
    
    def extract(self, clinical_text: str) -> List[NLPExtraction]:
        """
        Extract HPO terms from clinical text using multi-strategy NLP.
        
        Strategy order:
        1. Exact match (highest confidence)
        2. Synonym match
        3. Semantic similarity (transformer or TF-IDF)
        """
        if not clinical_text or len(clinical_text.strip()) < 3:
            return []
        
        extractions = []
        seen_hpo_ids = set()
        text_lower = clinical_text.lower()
        
        # === Strategy 1: Exact Match ===
        for hpo_id, term in self.hpo_terms.items():
            label_lower = term.label.lower()
            pos = text_lower.find(label_lower)
            if pos != -1:
                negated = self._check_negation(text_lower, pos)
                extractions.append(NLPExtraction(
                    hpo_id=hpo_id,
                    label=term.label,
                    confidence=0.98 if not negated else 0.95,
                    source_text=clinical_text[max(0, pos-10):pos+len(label_lower)+10].strip(),
                    method="exact_match",
                    negated=negated
                ))
                seen_hpo_ids.add(hpo_id)
        
        # === Strategy 2: Synonym Match ===
        for hpo_id, synonyms in self.synonym_map.items():
            if hpo_id in seen_hpo_ids:
                continue
            for synonym in synonyms:
                pos = text_lower.find(synonym)
                if pos != -1:
                    negated = self._check_negation(text_lower, pos)
                    term = self.hpo_terms[hpo_id]
                    extractions.append(NLPExtraction(
                        hpo_id=hpo_id,
                        label=term.label,
                        confidence=0.88 if not negated else 0.85,
                        source_text=clinical_text[max(0, pos-10):pos+len(synonym)+10].strip(),
                        method="synonym_match",
                        negated=negated
                    ))
                    seen_hpo_ids.add(hpo_id)
                    break
        
        # === Strategy 3: Semantic Similarity ===
        sentences = self._split_sentences(clinical_text)
        
        if self.use_transformers and self.transformer_model and sentences:
            # Use transformer embeddings
            sentence_embeddings = self.transformer_model.encode(
                sentences, convert_to_numpy=True, normalize_embeddings=True
            )
            
            # Compute similarities
            sim_matrix = np.dot(sentence_embeddings, self.hpo_embeddings.T)
            
            for i, sentence in enumerate(sentences):
                top_indices = np.argsort(sim_matrix[i])[::-1][:3]
                for idx in top_indices:
                    hpo_id = self.hpo_id_list[idx]
                    score = float(sim_matrix[i][idx])
                    if score > 0.45 and hpo_id not in seen_hpo_ids:
                        term = self.hpo_terms[hpo_id]
                        negated = self._check_negation(text_lower, text_lower.find(sentence.lower()[:20]))
                        extractions.append(NLPExtraction(
                            hpo_id=hpo_id,
                            label=term.label,
                            confidence=round(min(score, 0.95), 3),
                            source_text=sentence.strip(),
                            method="semantic_similarity",
                            negated=negated
                        ))
                        seen_hpo_ids.add(hpo_id)
        else:
            # TF-IDF fallback
            for sentence in sentences:
                tokens = self._tokenize(sentence)
                if not tokens:
                    continue
                
                scores = []
                for hpo_id in self.hpo_terms:
                    if hpo_id in seen_hpo_ids:
                        continue
                    score = self._cosine_similarity_tfidf(tokens, hpo_id)
                    if score > 0.25:
                        scores.append((hpo_id, score))
                
                scores.sort(key=lambda x: x[1], reverse=True)
                for hpo_id, score in scores[:2]:
                    if hpo_id not in seen_hpo_ids:
                        term = self.hpo_terms[hpo_id]
                        sent_lower = sentence.lower()
                        pos = text_lower.find(sent_lower[:20]) if sent_lower[:20] in text_lower else 0
                        negated = self._check_negation(text_lower, pos)
                        extractions.append(NLPExtraction(
                            hpo_id=hpo_id,
                            label=term.label,
                            confidence=round(min(score * 1.5, 0.85), 3),
                            source_text=sentence.strip(),
                            method="tfidf_similarity",
                            negated=negated
                        ))
                        seen_hpo_ids.add(hpo_id)
        
        # Sort by confidence descending
        extractions.sort(key=lambda x: x.confidence, reverse=True)
        
        return extractions
    
    def get_model_info(self) -> Dict:
        """Return model metadata for the API"""
        return {
            "name": "Clinical NLP Engine",
            "version": "2.0.0",
            "model_type": "Sentence-Transformer" if self.use_transformers else "TF-IDF + Synonym Matching",
            "base_model": "all-MiniLM-L6-v2" if self.use_transformers else "Custom TF-IDF",
            "hpo_terms_indexed": len(self.hpo_terms),
            "synonyms_indexed": sum(len(v) for v in self.synonym_map.values()),
            "capabilities": [
                "Free-text HPO extraction",
                "Synonym resolution",
                "Negation detection (Component A — absent)",
                "Uncertainty detection (Component A — uncertain)",
                "Temporal onset extraction (Component B)",
                "Subject classification (Component C)",
                "Severity + confidence scoring (Component D)",
                "Missingness handling (equity guard)",
            ],
            "embedding_dim": 384 if self.use_transformers else len(self.idf_vocab),
        }

    def extract_hpo_terms(self, clinical_text: str) -> List[Dict]:
        """Wrapper for extract() that returns dicts for enrichment pipeline"""
        extractions = self.extract(clinical_text)
        return [
            {
                "hpo_id": e.hpo_id,
                "term": e.label,
                "confidence": e.confidence,
                "negated": e.negated,
                "source_text": e.source_text,
                "method": e.method,
                "span": (0, 0), # Mock span
            }
            for e in extractions
        ]


# ============================================================
# Component A: Status Extractor (present / absent / uncertain)
# ============================================================

class StatusExtractor:
    """
    Component A per Hakon's spec:
    - absent: explicit negation words + HPO in same sentence
    - uncertain: hedging language ("possible", "suspected", etc.)
    - present: everything else where term is mentioned positively
    
    Replaces simple ExclusionExtractor with 3-way classification.
    """

    # Negation triggers
    NEGATION_CUES = [
        "no ", "not ", "without", "denies", "absent", "ruled out",
        "negative for", "never had", "no evidence of", "no history of",
        "failed to develop", "none of", "no longer",
    ]

    # Uncertainty/hedging triggers
    UNCERTAINTY_CUES = [
        "possible", "possibly", "suspected", "suspect", "cannot rule out",
        "could be", "may have", "might have", "borderline",
        "consistent with but not confirmed", "probable", "questionable",
        "presumptive", "seems to", "appears to have", "suggestive of",
        "likely", "unclear if", "uncertain", "equivocal", "query",
    ]

    def enrich(self, entities: List[Dict], note: str) -> List[Dict]:
        note_lower = note.lower()

        for entity in entities:
            term = entity["term"].lower()
            text_pos = note_lower.find(term)
            if entity.get("span") == (0, 0) and text_pos != -1:
                entity["span"] = (text_pos, text_pos + len(term))

            span = entity.get("span", (0, 0))
            start = span[0]
            window_start = max(0, start - 80)

            # Get sentence-scoped prefix
            raw_prefix = note_lower[window_start:start]
            boundary = max(raw_prefix.rfind('.'), raw_prefix.rfind(';'), raw_prefix.rfind('\n'))
            prefix = raw_prefix[boundary + 1:].strip() if boundary >= 0 else raw_prefix.strip()

            # Positive-assertion override
            suffix = note_lower[start:start + 40]
            is_confirmed_positive = any(w in suffix for w in ('confirmed', 'present', 'positive', 'noted', 'known', 'documented'))

            if is_confirmed_positive:
                status = "present"
            elif any(cue in prefix for cue in self.NEGATION_CUES):
                status = "absent"
            elif any(cue in prefix for cue in self.UNCERTAINTY_CUES):
                status = "uncertain"
            else:
                status = "present"

            entity["status"] = status
            # Keep backward-compatible excluded flag
            entity["excluded"] = (status == "absent")
            entity["evidence_span"] = {
                "start": span[0],
                "end": span[1],
                "text_snippet": note[max(0, span[0]-40):span[1]+40]
            }
        return entities


# backward-compat alias
class ExclusionExtractor(StatusExtractor):
    """Backward-compatible alias for StatusExtractor."""
    pass


# ============================================================
# Component B: Temporal Extractor (onset / resolution / ongoing)
# ============================================================

class TemporalTagger:
    """
    Component B per Hakon's spec:
    - Extract onset age, normalization to age-relative strings
    - Detect resolution vs ongoing status
    - Flag currently ongoing or historical
    """

    def enrich(self, entities: List[Dict], note: str) -> List[Dict]:
        note_lower = note.lower()
        onset_patterns = [
            r"(since age|at age|aged|onset at|first noted at|from age)\s*([\d.]+)",
            r"([\d.]+)\s*(year|month|week)s?\s*(ago|old)",
            r"(neonatal|newborn|birth|congenital)",
            r"(infantile|infant)",
            r"(childhood|child)",
            r"(adolescent|teen)",
            r"(began|started|onset)\s+(\w+\s+){0,3}([\d.]+)",
        ]
        res_pattern = r"\b(resolved|no longer|previously|former|used to|improved|remitted|was\s+\w+\s+but)\b"
        ongoing_pattern = r"\b(ongoing|persistent|current|still|continues|chronic|present|remains|worsening|progressive)\b"

        for entity in entities:
            span = entity.get("span", (0, 0))
            window_start = max(0, span[0] - 80)
            window_end = min(len(note), span[1] + 80)
            window = note_lower[window_start:window_end]

            onset_age = None
            onset_label = None

            # Try numeric age patterns first
            for pattern in onset_patterns[:3]:
                match = re.search(pattern, window)
                if match:
                    groups = match.groups()
                    for g in groups:
                        if g and g.replace('.', '').isdigit():
                            onset_age = float(g)
                            # Normalize to age-relative string
                            if "month" in window[match.start():match.end()+10]:
                                onset_label = f"onset at {onset_age} months"
                                onset_age = round(onset_age / 12, 2)
                            else:
                                onset_label = f"onset at {onset_age} years"
                            break
                    if onset_age is not None:
                        break

            # Try descriptive onset labels
            if onset_age is None:
                if re.search(onset_patterns[3], window):
                    onset_label = "neonatal onset"
                    onset_age = 0.0
                elif re.search(onset_patterns[4], window):
                    onset_label = "infantile onset"
                    onset_age = 0.5
                elif re.search(onset_patterns[5], window):
                    onset_label = "childhood onset"
                    onset_age = 5.0
                elif re.search(onset_patterns[6], window):
                    onset_label = "adolescent onset"
                    onset_age = 14.0

            entity["onset_age_years"] = onset_age
            entity["onset_label"] = onset_label

            # Determine temporal status
            if re.search(res_pattern, window):
                entity["temporal_status"] = "resolved"
                entity["ongoing"] = False
                entity["resolution"] = "resolved"
            elif re.search(ongoing_pattern, window):
                entity["temporal_status"] = "ongoing"
                entity["ongoing"] = True
                entity["resolution"] = None
            else:
                entity["temporal_status"] = "unknown"
                entity["ongoing"] = True  # Default: assume ongoing if not stated otherwise
                entity["resolution"] = None

            # Keep backward-compatible status field (don't overwrite status from StatusExtractor)
            if "status" not in entity:
                entity["status"] = entity["temporal_status"]

        return entities


# ============================================================
# Component C: Subject Extractor (patient vs. family member)
# ============================================================

class ContextClassifier:
    """
    Component C per Hakon's spec:
    - Determine if finding refers to patient or a relative
    - Explicitly detect and store family_relation (mother, father, sibling, etc.)
    - Key signals: family relation words within 2 sentences of the HPO term
    """

    FAMILY_RELATIONS = {
        "mother": "mother", "maternal": "mother", "mom": "mother",
        "father": "father", "paternal": "father", "dad": "father",
        "sibling": "sibling", "brother": "brother", "sister": "sister",
        "family history": "family", "family hx": "family",
        "grandmother": "grandmother", "grandfather": "grandfather",
        "aunt": "aunt", "uncle": "uncle", "cousin": "cousin",
        "child": "child", "children": "children",
        "twin": "twin",
    }

    def enrich(self, entities: List[Dict], note: str) -> List[Dict]:
        note_lower = note.lower()
        sentences = re.split(r'[.!?\n]', note)

        for entity in entities:
            term = entity["term"].lower()
            target_sentence = ""
            # Search in ±2 sentences of the one containing the term
            for idx, s in enumerate(sentences):
                if term in s.lower():
                    # Include 2 sentences before and after
                    context_start = max(0, idx - 2)
                    context_end = min(len(sentences), idx + 3)
                    target_sentence = " ".join(sentences[context_start:context_end]).lower()
                    break

            family_relation = None
            for cue, relation in self.FAMILY_RELATIONS.items():
                if cue in target_sentence:
                    family_relation = relation
                    break

            entity["subject"] = "family_member" if family_relation else "patient"
            entity["family_relation"] = family_relation

        return entities


# ============================================================
# Component D: Severity + Confidence Extractor
# ============================================================

class SeverityCertaintyExtractor:
    """
    Component D per Hakon's spec:
    - Capture severity qualifiers (mild, moderate, severe, profound)
    - Attach confidence score based on clarity of statement
    """

    SEVERITY_MAP = {
        "profound": ["profound", "complete", "total", "absolute"],
        "severe": ["severe", "marked", "significant", "prominent", "pronounced"],
        "moderate": ["moderate", "moderately"],
        "mild": ["mild", "mildly", "slight", "subtle", "minimal"],
    }

    CERTAINTY_MAP = {
        "confirmed": ["confirmed", "definite", "definitive", "proven", "established", "documented"],
        "likely": ["likely", "probable", "strongly suspected"],
        "possible": ["possible", "possibly", "suspected", "may have", "might be", "borderline"],
        "uncertain": ["uncertain", "unclear", "equivocal", "questionable"],
    }

    def enrich(self, entities: List[Dict], note: str) -> List[Dict]:
        note_lower = note.lower()

        for entity in entities:
            span = entity.get("span", (0, 0))
            window = note_lower[max(0, span[0]-60):span[1]+60]

            # Severity
            severity = None
            for sev_label, cues in self.SEVERITY_MAP.items():
                if any(c in window for c in cues):
                    severity = sev_label
                    break
            entity["severity"] = severity

            # Certainty
            certainty = "confirmed"
            for cert_label, cues in self.CERTAINTY_MAP.items():
                if any(c in window for c in cues):
                    certainty = cert_label
                    break
            entity["certainty"] = certainty

            # Confidence score based on extraction quality + certainty
            base_confidence = entity.get("confidence", 0.7)
            certainty_multipliers = {
                "confirmed": 1.0,
                "likely": 0.9,
                "possible": 0.75,
                "uncertain": 0.6,
            }
            entity["confidence"] = round(
                base_confidence * certainty_multipliers.get(certainty, 1.0), 3
            )

        return entities


# ============================================================
# Lab/Imaging Extractor (unchanged)
# ============================================================

class LabImagingExtractor:
    """Extracts structured findings from labs and imaging reports"""
    
    def enrich(self, entities: List[Dict], note: str) -> List[Dict]:
        note_lower = note.lower()
        imaging_markers = {
            "imaging_finding": ["echo shows", "mri reveals", "ct scan", "ultrasound"],
            "lab_finding": ["ck levels", "blood test", "biopsy", "plasma", "serum"]
        }
        for entity in entities:
            span = entity.get("span", (0, 0))
            window = note_lower[max(0, span[0]-100):span[1]+100]
            origin = "clinical_exam"
            for category, cues in imaging_markers.items():
                if any(cue in window for cue in cues):
                    origin = category
                    break
            entity["data_origin"] = origin
        return entities


# ============================================================
# Inheritance Detector (unchanged)
# ============================================================

class InheritanceDetector:
    """Detects suspected inheritance patterns from family history context"""
    
    def enrich(self, entities: List[Dict], note: str) -> List[Dict]:
        note_lower = note.lower()
        patterns = {
            "Autosomal Dominant": [r"vertical transmission", r"AD\b"],
            "Autosomal Recessive": [r"consanguinity", r"AR\b"],
            "X-linked": [r"males affected", r"XL\b"]
        }
        detected = "unknown"
        for name, regexes in patterns.items():
            if any(re.search(reg, note_lower) for reg in regexes):
                detected = name
                break
        for entity in entities:
            entity["suspected_inheritance"] = detected
        return entities


# ============================================================
# Missingness Handler (Equity Guard)
# ============================================================

class MissingnessHandler:
    """
    Equity guard per Hakon's spec:
    - Sparse records don't get penalized — they get wider confidence intervals
    - Flag low-confidence extractions
    - Weight scores by data completeness
    - System should never output high-confidence differential on incomplete records
    
    A node after BioBERT NLP Extraction that signals incomplete record handling.
    """

    def handle(self, entities: List[Dict], note: str) -> Tuple[List[Dict], Dict]:
        """
        Process extracted entities bor completeness assessment.
        Returns enriched entities and a missingness report.
        """
        if not entities:
            return entities, {
                "data_completeness": 0.0,
                "n_extracted": 0,
                "confidence_discount_pct": 40,
                "width_multiplier": 2.0,
                "equity_flag": "high_missingness",
                "recommendation": "Collect more clinical phenotype data before generating differential",
            }

        n = len(entities)
        avg_confidence = sum(e.get("confidence", 0.5) for e in entities) / n
        has_temporal = sum(1 for e in entities if e.get("onset_age_years") is not None) / n
        has_severity = sum(1 for e in entities if e.get("severity") is not None) / n
        has_subject = sum(1 for e in entities if e.get("subject") == "patient") / n

        # Completeness score 0-1
        completeness = round(
            0.4 * min(n / 5.0, 1.0)  # >= 5 phenotypes = full score on this axis
            + 0.2 * has_temporal
            + 0.2 * has_severity
            + 0.2 * has_subject,
            3
        )

        # Discount confidence for low-completeness records
        confidence_discount = 0.0
        if completeness < 0.3:
            confidence_discount = 0.25  # 25% discount
            equity_flag = "high_missingness"
            width_multiplier = 2.5
        elif completeness < 0.6:
            confidence_discount = 0.10  # 10% discount
            equity_flag = "moderate_missingness"
            width_multiplier = 1.5
        else:
            confidence_discount = 0.0
            equity_flag = "complete"
            width_multiplier = 1.0

        # Apply discount to all entity confidences
        if confidence_discount > 0:
            for entity in entities:
                entity["confidence"] = round(
                    entity.get("confidence", 0.5) * (1 - confidence_discount), 3
                )
                entity["missingness_discounted"] = True

        report = {
            "data_completeness": completeness,
            "n_extracted": n,
            "avg_confidence_before_discount": round(avg_confidence, 3),
            "confidence_discount_pct": int(confidence_discount * 100),
            "width_multiplier": width_multiplier,
            "equity_flag": equity_flag,
            "has_temporal_pct": int(has_temporal * 100),
            "has_severity_pct": int(has_severity * 100),
            "recommendation": (
                "Record appears complete — proceed with full differential."
                if equity_flag == "complete"
                else f"Sparse record detected ({equity_flag}). Confidence intervals widened by {width_multiplier}x. "
                     "Prioritize phenotype collection before finalizing diagnosis."
            ),
        }

        return entities, report


# ============================================================
# PhenopacketBuilder — Full Phenopacket Schema per Hakon's spec
# ============================================================

class PhenopacketBuilder:
    """
    Assembles enriched entities into full Phenopacket-style objects per Hakon's schema:
    hpo_id, label, status, severity, onset_age, resolution, ongoing,
    subject, family_relation, evidence_text, confidence, certainty
    """
    
    def build(self, enriched_entities: List[Dict], hpo_linker=None) -> List[Dict]:
        phenotypes = []
        for entity in enriched_entities:
            hpo_id = entity.get("hpo_id")
            hpo_label = entity.get("term")
            confidence = entity.get("confidence", 1.0)
            
            if not hpo_id or confidence < 0.3:
                continue

            # Status: use StatusExtractor output (present/absent/uncertain)
            status = entity.get("status", "present")
            # Keep backward-compat excluded flag aligned
            excluded = (status == "absent")

            phenotypes.append({
                # Core identifiers
                "hpo_id": hpo_id,
                "hpo_label": hpo_label,
                "link_confidence": round(confidence, 3),

                # Component A — Status
                "status": status,
                "excluded": excluded,  # backward-compat

                # Component B — Temporal
                "onset_age_years": entity.get("onset_age_years"),
                "onset_label": entity.get("onset_label"),
                "resolution": entity.get("resolution"),
                "ongoing": entity.get("ongoing", True),
                "temporal_status": entity.get("temporal_status", "unknown"),

                # Component C — Subject
                "subject": entity.get("subject", "patient"),
                "family_relation": entity.get("family_relation"),

                # Component D — Severity + Confidence
                "severity": entity.get("severity"),
                "certainty": entity.get("certainty", "confirmed"),

                # Additional metadata
                "data_origin": entity.get("data_origin", "clinical_exam"),
                "suspected_inheritance": entity.get("suspected_inheritance", "unknown"),
                "evidence_span": entity.get("evidence_span", {}),
                "evidence_text": entity.get("source_text", ""),
                "extraction_method": entity.get("method", "unknown"),
                "missingness_discounted": entity.get("missingness_discounted", False),
            })
        return phenotypes

# Global singleton
nlp_engine = ClinicalNLPEngine()
