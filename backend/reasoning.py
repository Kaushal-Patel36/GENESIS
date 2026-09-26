from typing import List, Optional
from .models import (
    PatientInput, DiagnosisResult, Evidence, 
    WEIGHT_PATHOGENIC, WEIGHT_LIKELY_PATHOGENIC, WEIGHT_VUS, WEIGHT_BENIGN
)
from .data.knowledge_graph import KG
from .data.mock_db import CLINVAR_MOCK_DB

import os
from openai import OpenAI

class ReasoningEngine:
    def __init__(self):
        self.client = None
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and not api_key.startswith("sk-placeholder"):
            self.client = OpenAI(api_key=api_key)
            print("INFO: OpenAI Client Initialized")
        else:
            print("WARNING: No valid OPENAI_API_KEY found. Using deterministic fallback.")

    def analyze(self, patient_data: PatientInput) -> List[DiagnosisResult]:
        results = []
        
        # 1. Identify Candidate Genes
        # Candidates come from:
        # a) Variants in VCF (if provided)
        # b) Phenotype overlap with all known genes (broad search)
        
        # For this demo, we will scan ALL genes in our mock DB to ensure we show results
        candidate_genes_symbols = KG.get_all_genes()
        
        for gene_symbol in candidate_genes_symbols:
            
            gene = KG.get_gene(gene_symbol)
            disease = KG.get_disease_for_gene(gene_symbol)
            if not disease:
                continue

            # --- Scoring Components ---
            
            # A. Phenotype Similarity
            # Simple overlap coefficient for now
            gene_phenotypes = KG.get_associated_phenotypes(gene_symbol)
            gene_hpo_ids = {p.id for p in gene_phenotypes}
            patient_hpo_ids = set(patient_data.hpo_ids)
            
            # Intersection
            matching_hpos = []
            for p in gene_phenotypes:
                if p.id in patient_hpo_ids:
                    matching_hpos.append(p)
            
            overlap_score = 0.0
            if gene_hpo_ids:
                overlap_score = len(matching_hpos) / len(gene_hpo_ids) * 5.0 # Weight 5.0 max
            
            # B. Variant Pathogenicity
            # Check if any patient variant matches this gene
            variant_score = 0.0
            variants_found = []
            
            # Mocking variant lookup logic: 
            # In a real app, we parse VCF. Here we assume specific inputs or look for mock variants.
            # Let's say if the VCF content string contains a mock variant ID, we count it.
            if patient_data.vcf_content:
                for var_id, classification in CLINVAR_MOCK_DB.items():
                    # Very simple mock check: path string contains variant ID?
                    # Or just hardcode for demo purposes if specific gene
                    # Let's verify against our mock DB
                    if var_id in patient_data.vcf_content: 
                         # This variant is present
                         # Does it belong to this gene? (Mock logic)
                         if gene_symbol in var_id: # Actually mock IDs don't always have gene.
                             pass
                         
                         # Check hardcoded map:
                         is_match = False
                         if gene_symbol == "FBN1" and "chr15:g.48712345" in var_id: is_match = True
                         if gene_symbol == "FGFR3" and "chr4:g.1802345" in var_id: is_match = True
                         
                         if is_match:
                             weight = WEIGHT_BENIGN
                             if classification == "Pathogenic": weight = WEIGHT_PATHOGENIC
                             elif classification == "Likely pathogenic": weight = WEIGHT_LIKELY_PATHOGENIC
                             elif classification == "VUS": weight = WEIGHT_VUS
                             
                             variant_score += (weight * 10.0) # Weight 10.0 max
                             
                             # Create Variant Object
                             variants_found.append({
                                 "id": var_id,
                                 "gene_symbol": gene_symbol,
                                 "clinvar_classification": classification,
                                 "weight": weight
                             })
            
            # C. Pathway / Functional Relevance
            pathways = KG.get_pathways(gene_symbol)
            pathway_score = 0.5 * len(pathways) # Small bonus for known pathways
            
            # --- Final Score ---
            total_score = overlap_score + variant_score + pathway_score
            
            # Generate Evidence
            evidence_list = []
            if matching_hpos:
                evidence_list.append(Evidence(
                    source="HPO & OMIM",
                    description=f"Patient matches {len(matching_hpos)} phenotypes for {disease.name}",
                    score_contribution=overlap_score
                ))
            if variant_score > 0:
                evidence_list.append(Evidence(
                    source="ClinVar",
                    description="Pathogenic variant identified in VCF",
                    score_contribution=variant_score
                ))
            
            confidence = "Low"
            if total_score > 8: confidence = "High"
            elif total_score > 4: confidence = "Medium"

            # LLM or Rule-based Explanation
            explanation = self._generate_explanation(gene, disease, matching_hpos, variants_found)

            results.append(DiagnosisResult(
                rank=0, # set later
                gene=gene,
                disease=disease,
                score=round(total_score, 2),
                confidence=confidence,
                matching_phenotypes=matching_hpos,
                variants=variants_found,
                pathways=pathways,
                evidence=evidence_list,
                explanation=explanation
            ))
            
        # Sort by score
        results.sort(key=lambda x: x.score, reverse=True)
        
        # Assign ranks
        for i, res in enumerate(results):
            res.rank = i + 1
            
        return results[:5] # Top 5

    def _generate_explanation(self, gene, disease, phenotypes, variants):
        # 1. Try LLM first
        if self.client:
            try:
                prompt = f"""
                Act as a clinical geneticist. Generate a concise, 2-sentence explanation for a diagnosis of {disease.name} (Gene: {gene.symbol}) for a patient.
                Key findings:
                - Variants: {[v['id'] + ' (' + v['clinvar_classification'] + ')' for v in variants] if variants else 'None'}
                - Matching Phenotypes: {[p.label for p in phenotypes]}
                
                Focus on WHY this is a strong or weak match based on the evidence.
                """
                response = self.client.chat.completions.create(
                    model="gpt-4",
                    messages=[{"role": "system", "content": "You are a helpful expert medical assistant."}, {"role": "user", "content": prompt}],
                    max_tokens=100,
                    temperature=0.3
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"LLM Error: {e}")
                # Fall through to deterministic

        # 2. Deterministic fallback
        reasons = []
        if variants:
            reasons.append(f"a {variants[0]['clinvar_classification'].lower()} variant in {gene.symbol}")
        
        if phenotypes:
            reasons.append(f"clinical features consistent with {disease.name} ({', '.join([p.label for p in phenotypes[:3]])})")
            
        if not reasons:
            return f"{gene.symbol} is associated with {disease.name}, but evidence is weak."
            
        return f"Diagnosis of {disease.name} is supported by {' and '.join(reasons)}."

engine = ReasoningEngine()
