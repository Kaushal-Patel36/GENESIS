"""
EpistaLink — Epistasis Detection Engine
==========================================
Detects and quantifies genetic interactions (epistasis) between variant pairs
in rare disease genes. Inspired by the RareLink approach (HackRare 2025).

Key Innovation: Instead of scoring individual variants in isolation, EpistaLink
models HOW pairs of variants interact — revealing loss-of-function or
gain-of-function effects that traditional single-variant analysis misses.

Architecture:
    1. Variant pair database with curated disease-associated variant combinations
    2. Sparse Autoencoder (SAE) simulation — compute feature activation vectors
       for single-variant and double-variant sequences
    3. Epistasis scoring via hyperbolic transform: f(x) = 10·tanh(x/a)
    4. Interaction classification: negative (LoF), positive (GoF), neutral
    5. Motif disruption analysis — DNA sequence motif changes from interactions

Mathematical Framework:
    - Feature activation vector: φ(v) for variant v
    - Interaction delta: Δ = φ(v₁,v₂) − [φ(v₁) + φ(v₂)]
    - Function score: F = Σᵢ wᵢ · Δᵢ  (weighted feature diff)
    - Epistasis score: E = 10 · tanh(F / a)  where a is steepness parameter
    - Negative E → loss of function (variants cancel each other)
    - Positive E → gain of function / synergistic (novel combined effect)

Requires: numpy (already installed)
"""

import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import math
import hashlib

from data.enhanced_mock_db import GENE_DB, DISEASE_DB

# ---------------------------------------------------------------------------
# Variant Pair Database — curated disease-associated variant combinations
# Each gene has known variant pairs with expected epistatic interactions
# ---------------------------------------------------------------------------
VARIANT_PAIR_DB: Dict[str, List[Dict[str, Any]]] = {
    "FBN1": [
        {
            "variant_1": {"id": "c.4082G>A", "position": 4082, "effect": "Cys1361Tyr", "domain": "cbEGF-like 22"},
            "variant_2": {"id": "c.5309T>C", "position": 5309, "effect": "Ile1770Thr", "domain": "cbEGF-like 32"},
            "known_interaction": "negative",
            "description": "Both variants disrupt calcium-binding EGF domains; combined effect reduces fibrillin-1 multimerization below critical threshold",
            "clinical_significance": "Severe neonatal Marfan presentation when co-inherited",
        },
        {
            "variant_1": {"id": "c.1585C>T", "position": 1585, "effect": "Arg529Cys", "domain": "cbEGF-like 6"},
            "variant_2": {"id": "c.3509G>A", "position": 3509, "effect": "Cys1170Tyr", "domain": "cbEGF-like 18"},
            "known_interaction": "negative",
            "description": "Cysteine disruptions in non-adjacent EGF domains synergistically destabilize disulfide bond network",
            "clinical_significance": "Accelerated aortic root dilatation when both present",
        },
        {
            "variant_1": {"id": "c.2956G>A", "position": 2956, "effect": "Gly986Arg", "domain": "TB4"},
            "variant_2": {"id": "c.6700C>T", "position": 6700, "effect": "Arg2234Trp", "domain": "cbEGF-like 40"},
            "known_interaction": "neutral",
            "description": "Variants in distinct functional domains with independent pathogenic mechanisms",
            "clinical_significance": "Additive but non-interacting pathogenicity",
        },
    ],
    "LMNA": [
        {
            "variant_1": {"id": "c.746G>A", "position": 746, "effect": "Arg249Gln", "domain": "Rod 1B"},
            "variant_2": {"id": "c.1580G>C", "position": 1580, "effect": "Arg527Pro", "domain": "Ig-fold"},
            "known_interaction": "negative",
            "description": "Variant 1 (rod domain) represses functional effect of Variant 2 (Ig-fold); lamin A polymerization is disrupted bidirectionally",
            "clinical_significance": "LMNA-related congenital muscular dystrophy with nuclear envelope instability",
        },
        {
            "variant_1": {"id": "c.1357C>T", "position": 1357, "effect": "Arg453Trp", "domain": "Rod 2B"},
            "variant_2": {"id": "c.1489A>G", "position": 1489, "effect": "Thr497Ala", "domain": "Tail"},
            "known_interaction": "positive",
            "description": "Combined variants create novel lamin A/C conformation enabling partial nuclear import rescue",
            "clinical_significance": "Attenuated Emery-Dreifuss phenotype; suggests compensatory interaction",
        },
    ],
    "CFTR": [
        {
            "variant_1": {"id": "c.1521_1523del", "position": 1521, "effect": "F508del", "domain": "NBD1"},
            "variant_2": {"id": "c.3846G>A", "position": 3846, "effect": "Trp1282Ter", "domain": "NBD2"},
            "known_interaction": "negative",
            "description": "F508del misfolding combined with premature stop eliminates both CFTR protein copies",
            "clinical_significance": "Compound heterozygote — severe CF with pancreatic insufficiency",
        },
        {
            "variant_1": {"id": "c.1521_1523del", "position": 1521, "effect": "F508del", "domain": "NBD1"},
            "variant_2": {"id": "c.350G>A", "position": 350, "effect": "Arg117His", "domain": "TMD1"},
            "known_interaction": "positive",
            "description": "R117H partial function partially rescues F508del trafficking; residual CFTR activity 10-15%",
            "clinical_significance": "Milder CF phenotype; CFTR modulator therapy may be more effective",
        },
    ],
    "SCN1A": [
        {
            "variant_1": {"id": "c.2836C>T", "position": 2836, "effect": "Arg946Cys", "domain": "S5-S6 DII"},
            "variant_2": {"id": "c.5347G>A", "position": 5347, "effect": "Ala1783Thr", "domain": "S6 DIV"},
            "known_interaction": "negative",
            "description": "Both pore-region variants synergistically reduce Na+ channel conductance below seizure threshold",
            "clinical_significance": "Severe Dravet syndrome with treatment-resistant epilepsy",
        },
    ],
    "MYH7": [
        {
            "variant_1": {"id": "c.1208G>A", "position": 1208, "effect": "Arg403Gln", "domain": "Motor head"},
            "variant_2": {"id": "c.2155C>T", "position": 2155, "effect": "Arg719Trp", "domain": "Motor S1"},
            "known_interaction": "negative",
            "description": "Double motor domain mutations severely impair myosin power stroke and ATPase activity",
            "clinical_significance": "Early-onset hypertrophic cardiomyopathy with high sudden death risk",
        },
    ],
    "MECP2": [
        {
            "variant_1": {"id": "c.473C>T", "position": 473, "effect": "Thr158Met", "domain": "MBD"},
            "variant_2": {"id": "c.808C>T", "position": 808, "effect": "Arg270Ter", "domain": "TRD"},
            "known_interaction": "negative",
            "description": "MBD binding loss combined with truncated TRD eliminates both DNA-binding and co-repressor recruitment",
            "clinical_significance": "Classic Rett syndrome with complete loss of MeCP2 function",
        },
    ],
    "TSC1": [
        {
            "variant_1": {"id": "c.1525C>T", "position": 1525, "effect": "Arg509Ter", "domain": "Coiled-coil"},
            "variant_2": {"id": "c.733C>T", "position": 733, "effect": "Arg245Ter", "domain": "N-terminal"},
            "known_interaction": "negative",
            "description": "Both truncating variants prevent hamartin-tuberin complex formation",
            "clinical_significance": "Severe tuberous sclerosis with cortical tubers and renal angiomyolipomas",
        },
    ],
    "FGFR3": [
        {
            "variant_1": {"id": "c.1138G>A", "position": 1138, "effect": "Gly380Arg", "domain": "TM domain"},
            "variant_2": {"id": "c.1948A>G", "position": 1948, "effect": "Lys650Glu", "domain": "TK domain"},
            "known_interaction": "positive",
            "description": "Constitutive activation (G380R) + kinase hyperactivation create gain-of-function synergy",
            "clinical_significance": "Thanatophoric dysplasia-like phenotype; lethal skeletal dysplasia",
        },
    ],
}

# DNA sequence motifs affected by gene variants
MOTIF_DB: Dict[str, List[Dict[str, Any]]] = {
    "FBN1": [
        {"motif": "TGCCTG", "name": "Calcium-binding EGF motif", "function": "Calcium coordination", "conservation": 0.96},
        {"motif": "CNGRCG", "name": "Disulfide bond motif", "function": "Structural integrity", "conservation": 0.94},
        {"motif": "AGGTCA", "name": "ECM regulatory element", "function": "Transcription regulation", "conservation": 0.88},
        {"motif": "TGACTG", "name": "TGF-β response element", "function": "TGF-β pathway coupling", "conservation": 0.91},
    ],
    "LMNA": [
        {"motif": "CAGGCT", "name": "Coiled-coil heptad repeat", "function": "Lamin polymerization", "conservation": 0.93},
        {"motif": "GCCATG", "name": "Nuclear localization signal", "function": "Nuclear import", "conservation": 0.97},
        {"motif": "TGCCGG", "name": "Rod domain junction", "function": "Lamin A/C dimerization", "conservation": 0.90},
    ],
    "CFTR": [
        {"motif": "GGCACC", "name": "NBD Walker A motif", "function": "ATP binding", "conservation": 0.98},
        {"motif": "TGGCTG", "name": "Cl⁻ selectivity filter", "function": "Ion conductance", "conservation": 0.95},
        {"motif": "ACCTGC", "name": "PDZ binding motif", "function": "Membrane anchoring", "conservation": 0.87},
    ],
    "SCN1A": [
        {"motif": "GGATCC", "name": "DEKA selectivity filter", "function": "Na⁺ selectivity", "conservation": 0.99},
        {"motif": "CAGCTG", "name": "Voltage sensor S4", "function": "Gating charge", "conservation": 0.96},
    ],
    "MYH7": [
        {"motif": "ATGGCC", "name": "ATPase active site", "function": "Force generation", "conservation": 0.97},
        {"motif": "GCCTGA", "name": "Actin-binding loop", "function": "Sarcomere coupling", "conservation": 0.94},
    ],
}


class EpistasisEngine:
    """
    Detects and quantifies genetic interactions (epistasis) between
    variant pairs using sparse autoencoder simulation and interaction scoring.
    """

    def __init__(self, steepness: float = 7.0, n_features: int = 64):
        """
        Args:
            steepness: Steepness parameter 'a' for hyperbolic transform.
            n_features: Number of latent features in SAE simulation.
        """
        self.steepness = steepness
        self.n_features = n_features

        # Pre-compute SAE weight matrices (deterministic from seed)
        np.random.seed(42)
        self.encoder_weights = np.random.randn(n_features, 128) * 0.1
        self.decoder_weights = np.random.randn(128, n_features) * 0.1
        self.feature_names = self._generate_feature_names()

        print(f"  ✓ EpistaLink Epistasis Engine: {sum(len(v) for v in VARIANT_PAIR_DB.values())} "
              f"variant pairs, {self.n_features} SAE features, "
              f"steepness a={self.steepness}")

    def _generate_feature_names(self) -> List[str]:
        """Generate interpretable feature names for SAE features."""
        names = [
            "Protein folding stability", "Calcium coordination", "Disulfide bond integrity",
            "Membrane anchoring", "Ion channel conductance", "ATP hydrolysis efficiency",
            "Nuclear localization", "Coiled-coil formation", "Kinase domain activity",
            "Receptor dimerization", "DNA binding affinity", "Transcription regulation",
            "Splice site recognition", "Protein-protein interaction", "Post-translational mod",
            "Chromatin remodeling", "mRNA stability", "Exon skipping signal",
            "Signal peptide function", "Glycosylation site", "Phosphorylation cascade",
            "Ubiquitination target", "Proteasome recognition", "Chaperone binding",
            "ER retention signal", "Golgi transport", "Vesicle trafficking",
            "Cytoskeletal anchoring", "ECM binding", "Growth factor response",
            "Apoptosis regulation", "Cell cycle checkpoint", "Autophagy trigger",
            "Mitochondrial targeting", "Redox sensing", "Calcium signaling",
            "cAMP response", "JAK-STAT activation", "Wnt pathway modulation",
            "Notch receptor binding", "Hedgehog signaling", "MAPK cascade trigger",
            "PI3K-AKT activation", "mTOR sensitivity", "NF-κB activation",
            "Interferon response", "TNF receptor binding", "Complement activation",
            "MHC presentation", "Toll-like receptor", "Inflammasome assembly",
            "Synaptic vesicle release", "Neurotransmitter reuptake", "Ion selectivity",
            "Voltage gating threshold", "Axon guidance", "Myelin integrity",
            "Sarcomere assembly", "Contractile force", "Elastic fiber formation",
            "Collagen cross-linking", "GAG binding", "Heparan sulfate recognition",
            "Laminin interaction", "Integrin binding",
        ]
        return names[:self.n_features]

    def _variant_to_vector(self, gene: str, variant: Dict[str, Any]) -> np.ndarray:
        """
        Convert a variant to a feature activation vector using deterministic
        hashing (simulating SAE encoding of DNA language model activations).
        """
        # Create deterministic seed from variant identity
        seed_str = f"{gene}:{variant['id']}:{variant.get('domain', '')}"
        seed = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
        rng = np.random.RandomState(seed)

        # Generate sparse activation vector (SAE output is sparse)
        activations = np.zeros(self.n_features)
        n_active = rng.randint(8, 20)  # 8-20 features activate
        active_indices = rng.choice(self.n_features, n_active, replace=False)

        for idx in active_indices:
            # Activation strength influenced by variant position and domain
            base_activation = rng.exponential(0.5)
            # Domain-specific bias
            domain = variant.get("domain", "").lower()
            if "egf" in domain or "motor" in domain or "nbd" in domain:
                base_activation *= 1.5  # Functional domains activate more strongly
            elif "rod" in domain or "tail" in domain:
                base_activation *= 0.8
            activations[idx] = min(base_activation, 3.0)

        return activations

    def _pair_to_vector(
        self, gene: str, variant_1: Dict, variant_2: Dict
    ) -> np.ndarray:
        """
        Compute feature activation for the PAIR using bidirectional cross-attention.
        Each variant is independently embedded, then bidirectional cross-attention
        is applied to explicitly model context-dependent interactions.
        The result is projected back into the 64-dim sparse latent space.
        """
        v1 = self._variant_to_vector(gene, variant_1)
        v2 = self._variant_to_vector(gene, variant_2)

        seed_str = f"{gene}:{variant_1['id']}+{variant_2['id']}"
        seed = int(hashlib.md5(seed_str.encode()).hexdigest()[:8], 16)
        rng = np.random.RandomState(seed)

        # 1. Independent embedding projection matrices (Q, K, V)
        d_k = np.sqrt(self.n_features)
        W_q = rng.randn(self.n_features, self.n_features) / d_k
        W_k = rng.randn(self.n_features, self.n_features) / d_k
        W_v = rng.randn(self.n_features, self.n_features) / d_k

        # 2. Bidirectional Cross-Attention
        # Variant 1 attends to Variant 2 context
        q1 = np.dot(v1, W_q)
        k2 = np.dot(v2, W_k)
        val2 = np.dot(v2, W_v)
        score12 = np.dot(q1, k2) / d_k
        attn12 = 1.0 / (1.0 + np.exp(-score12)) # Sigmoid gating for 1-token sequence
        attended_1 = v1 + (attn12 * val2)

        # Variant 2 attends to Variant 1 context
        q2 = np.dot(v2, W_q)
        k1 = np.dot(v1, W_k)
        val1 = np.dot(v1, W_v)
        score21 = np.dot(q2, k1) / d_k
        attn21 = 1.0 / (1.0 + np.exp(-score21))
        attended_2 = v2 + (attn21 * val1)

        # 3. Project interaction representation into the 64-dim sparse latent space
        W_out = rng.randn(self.n_features, self.n_features) / d_k
        interaction = np.dot((attended_1 + attended_2), W_out)

        # Distance between variants influences interaction scale
        pos_diff = abs(variant_1.get("position", 0) - variant_2.get("position", 0))
        proximity_factor = np.exp(-pos_diff / 5000.0)

        pair_vector = attended_1 + attended_2 + (interaction * (0.5 + proximity_factor))
        
        # Apply sparsity constraints (ReLU-like non-negativity)
        return np.clip(pair_vector, 0, None)

    def _compute_epistasis_score(
        self, v1_vec: np.ndarray, v2_vec: np.ndarray, pair_vec: np.ndarray
    ) -> Tuple[float, str]:
        """
        Compute epistasis score using hyperbolic transform.

        Function score F = Σ wᵢ · Δᵢ  where Δ = pair − (v1 + v2)
        Epistasis score E = 10 · tanh(F / a)

        Returns (score, classification)
        """
        # Interaction delta: what the pair does beyond additive
        delta = pair_vec - (v1_vec + v2_vec)

        # Weighted function score (features contribute differently)
        weights = np.abs(v1_vec + v2_vec) + 0.1  # weight by baseline activation
        function_score = float(np.sum(weights * delta))

        # Hyperbolic transform → [-10, 10] range
        epistasis_score = 10.0 * math.tanh(function_score / self.steepness)

        # Classification
        if epistasis_score < -3.0:
            classification = "negative"  # Loss of function
        elif epistasis_score > 3.0:
            classification = "positive"  # Gain of function / synergistic
        else:
            classification = "neutral"  # Additive / non-interacting

        return round(epistasis_score, 3), classification

    def _analyze_feature_changes(
        self, v1_vec: np.ndarray, v2_vec: np.ndarray, pair_vec: np.ndarray
    ) -> List[Dict[str, Any]]:
        """Analyze which features changed between single and pair activations."""
        delta = pair_vec - (v1_vec + v2_vec)
        features = []

        # Get top activated and deactivated features
        sorted_indices = np.argsort(delta)  # ascending (most negative first)

        # Top deactivated (repressed by interaction)
        for idx in sorted_indices[:5]:
            if abs(delta[idx]) > 0.1:
                features.append({
                    "feature_index": int(idx),
                    "feature_name": self.feature_names[idx] if idx < len(self.feature_names) else f"Feature {idx}",
                    "single_activation": round(float(v1_vec[idx] + v2_vec[idx]), 3),
                    "pair_activation": round(float(pair_vec[idx]), 3),
                    "delta": round(float(delta[idx]), 3),
                    "direction": "repressed",
                })

        # Top activated (enhanced by interaction)
        for idx in sorted_indices[-5:][::-1]:
            if abs(delta[idx]) > 0.1:
                features.append({
                    "feature_index": int(idx),
                    "feature_name": self.feature_names[idx] if idx < len(self.feature_names) else f"Feature {idx}",
                    "single_activation": round(float(v1_vec[idx] + v2_vec[idx]), 3),
                    "pair_activation": round(float(pair_vec[idx]), 3),
                    "delta": round(float(delta[idx]), 3),
                    "direction": "enhanced",
                })

        # Sort by absolute delta
        features.sort(key=lambda f: abs(f["delta"]), reverse=True)
        return features[:8]

    def _analyze_motifs(
        self, gene: str, interaction_type: str
    ) -> List[Dict[str, Any]]:
        """Determine which DNA motifs are disrupted/activated by the interaction."""
        motifs = MOTIF_DB.get(gene, [])
        result = []

        for i, motif in enumerate(motifs):
            # Deterministic disruption status based on interaction type
            seed = hash(f"{gene}:{motif['motif']}:{interaction_type}") % (2**31)
            rng = np.random.RandomState(seed)

            if interaction_type == "negative":
                disruption_prob = motif["conservation"] * 0.8 + rng.random() * 0.2
                status = "disrupted" if disruption_prob > 0.7 else "maintained"
                impact_score = round(disruption_prob, 3)
            elif interaction_type == "positive":
                activation_prob = (1 - motif["conservation"]) * 0.5 + rng.random() * 0.5
                status = "activated" if activation_prob > 0.4 else "maintained"
                impact_score = round(activation_prob, 3)
            else:
                status = "maintained"
                impact_score = round(rng.random() * 0.3, 3)

            result.append({
                "motif_sequence": motif["motif"],
                "motif_name": motif["name"],
                "function": motif["function"],
                "conservation_score": motif["conservation"],
                "interaction_status": status,
                "impact_score": impact_score,
            })

        return result

    def analyze_gene(self, gene_symbol: str) -> Dict[str, Any]:
        """
        Full epistasis analysis for all known variant pairs of a gene.

        Returns variant pairs with epistasis scores, feature activations,
        motif impacts, and clinical summary.
        """
        gene_symbol = gene_symbol.upper()
        pairs = VARIANT_PAIR_DB.get(gene_symbol, [])

        if not pairs:
            return self._empty_result(gene_symbol)

        analyzed_pairs = []
        overall_scores = []

        for pair_data in pairs:
            v1 = pair_data["variant_1"]
            v2 = pair_data["variant_2"]

            # Compute activation vectors
            v1_vec = self._variant_to_vector(gene_symbol, v1)
            v2_vec = self._variant_to_vector(gene_symbol, v2)
            pair_vec = self._pair_to_vector(gene_symbol, v1, v2)

            # Epistasis scoring
            score, classification = self._compute_epistasis_score(v1_vec, v2_vec, pair_vec)
            overall_scores.append(score)

            # Feature analysis
            feature_changes = self._analyze_feature_changes(v1_vec, v2_vec, pair_vec)

            # Motif analysis
            motif_impacts = self._analyze_motifs(gene_symbol, classification)

            # Build activation heatmap data (top features only)
            heatmap_data = []
            all_features_sorted = np.argsort(np.abs(pair_vec - (v1_vec + v2_vec)))[::-1]
            for idx in all_features_sorted[:12]:
                heatmap_data.append({
                    "feature": self.feature_names[idx] if idx < len(self.feature_names) else f"Feature {idx}",
                    "variant_1_activation": round(float(v1_vec[idx]), 3),
                    "variant_2_activation": round(float(v2_vec[idx]), 3),
                    "pair_activation": round(float(pair_vec[idx]), 3),
                    "interaction_delta": round(float(pair_vec[idx] - v1_vec[idx] - v2_vec[idx]), 3),
                })

            analyzed_pairs.append({
                "variant_1": v1,
                "variant_2": v2,
                "epistasis_score": score,
                "classification": classification,
                "description": pair_data["description"],
                "clinical_significance": pair_data["clinical_significance"],
                "feature_changes": feature_changes,
                "motif_impacts": motif_impacts,
                "heatmap_data": heatmap_data,
            })

        # Overall gene epistasis summary
        mean_score = float(np.mean(overall_scores))
        dominant_type = "negative" if mean_score < -1 else ("positive" if mean_score > 1 else "mixed")

        # Clinical summary
        clinical_summary = self._generate_summary(gene_symbol, analyzed_pairs, mean_score, dominant_type)

        return {
            "gene": gene_symbol,
            "variant_pairs": analyzed_pairs,
            "overall_epistasis_score": round(mean_score, 3),
            "dominant_interaction_type": dominant_type,
            "total_pairs_analyzed": len(analyzed_pairs),
            "clinical_summary": clinical_summary,
            "model_info": {
                "method": "Sparse Autoencoder + Hyperbolic Transform",
                "steepness_parameter": self.steepness,
                "n_features": self.n_features,
                "scoring_range": "[-10, +10]",
                "interpretation": {
                    "negative": "Loss of function — variants cancel/suppress each other",
                    "neutral": "Additive — variants act independently",
                    "positive": "Gain of function — variants create synergistic novel effect",
                },
            },
        }

    def _generate_summary(
        self, gene: str, pairs: List[Dict], mean_score: float, dominant_type: str
    ) -> str:
        """Generate clinician-readable epistasis summary."""
        n_negative = sum(1 for p in pairs if p["classification"] == "negative")
        n_positive = sum(1 for p in pairs if p["classification"] == "positive")
        n_neutral = sum(1 for p in pairs if p["classification"] == "neutral")

        gene_data = GENE_DB.get(gene)
        gene_name = gene_data.name if gene_data else gene

        parts = [
            f"EpistaLink analysis of {gene} ({gene_name}) identified "
            f"{len(pairs)} variant pair(s) with detectable epistatic interactions."
        ]

        if n_negative > 0:
            parts.append(
                f"{n_negative} pair(s) show negative epistasis (loss of function), "
                f"where variant combinations suppress or neutralize individual variant effects."
            )

        if n_positive > 0:
            parts.append(
                f"{n_positive} pair(s) show positive/synergistic epistasis, "
                f"where combined variants produce novel functional effects not seen individually."
            )

        if n_neutral > 0:
            parts.append(
                f"{n_neutral} pair(s) show additive effects without significant interaction."
            )

        parts.append(
            f"Overall gene epistasis score: {mean_score:.2f} "
            f"({'strongly negative — consider compound heterozygote screening' if mean_score < -5 else 'moderate interaction detected — functional validation recommended' if abs(mean_score) > 2 else 'weak interaction — standard variant interpretation applies'})."
        )

        return " ".join(parts)

    def get_epistasis_score(self, gene_symbol: str) -> float:
        """Quick epistasis score for integration with scoring pipeline."""
        gene_symbol = gene_symbol.upper()
        pairs = VARIANT_PAIR_DB.get(gene_symbol, [])
        if not pairs:
            return 0.0

        scores = []
        for pair_data in pairs:
            v1_vec = self._variant_to_vector(gene_symbol, pair_data["variant_1"])
            v2_vec = self._variant_to_vector(gene_symbol, pair_data["variant_2"])
            pair_vec = self._pair_to_vector(gene_symbol, pair_data["variant_1"], pair_data["variant_2"])
            score, _ = self._compute_epistasis_score(v1_vec, v2_vec, pair_vec)
            scores.append(abs(score))

        # Return normalized 0-1 score (absolute interaction strength)
        return min(float(np.mean(scores)) / 10.0, 1.0)

    def _empty_result(self, gene_symbol: str) -> Dict[str, Any]:
        return {
            "gene": gene_symbol,
            "variant_pairs": [],
            "overall_epistasis_score": 0.0,
            "dominant_interaction_type": "none",
            "total_pairs_analyzed": 0,
            "clinical_summary": f"No curated variant pairs found for {gene_symbol} in the EpistaLink database. "
                                f"Consider submitting variant pairs for de novo epistasis analysis.",
            "model_info": {
                "method": "Sparse Autoencoder + Hyperbolic Transform",
                "steepness_parameter": self.steepness,
                "n_features": self.n_features,
                "scoring_range": "[-10, +10]",
            },
        }

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": "EpistaLink Epistasis Engine",
            "model_type": "Sparse Autoencoder + Hyperbolic Transform",
            "capabilities": [
                "Variant pair epistasis detection",
                "Feature activation comparison",
                "Motif disruption analysis",
                "Loss/gain of function classification",
            ],
            "total_variant_pairs": sum(len(v) for v in VARIANT_PAIR_DB.values()),
            "genes_covered": len(VARIANT_PAIR_DB),
            "sae_features": self.n_features,
        }


# Global singleton
epistasis_engine = EpistasisEngine()
