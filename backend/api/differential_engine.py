"""
Orphanet-style Differential Diagnosis Engine
=============================================
Ranks disease candidates by phenotype frequency scoring and computes
expected information gain per diagnostic action.

Architecture:
  - OrphanetDifferentialEngine: scores diseases against observed HPO profile
  - InformationGainCalculator: ranks which unasked phenotypes would best
    distinguish the top candidates
"""

from typing import List, Dict, Tuple, Optional
import math

from data.enhanced_mock_db import (
    GENE_PHENOTYPE_MAP, DISEASE_DB, HPO_DB, GENE_DB
)


# ---------------------------------------------------------------------------
# Phenotype-frequency map (Orphanet-style mock)
# For each (disease_id, hpo_id): estimated frequency of HPO in that disease
# Frequencies: 1.0=obligate, 0.8=very frequent, 0.5=frequent, 0.2=occasional
# ---------------------------------------------------------------------------
PHENOTYPE_FREQ_MAP: Dict[str, Dict[str, float]] = {
    "OMIM:154700": {  # Marfan Syndrome
        "HP:0000098": 0.95,  # Tall stature
        "HP:0001166": 0.90,  # Arachnodactyly
        "HP:0002650": 0.75,  # Scoliosis
        "HP:0001083": 0.70,  # Ectopia lentis
        "HP:0002616": 0.85,  # Aortic root dilation
        "HP:0001659": 0.55,  # Aortic regurgitation
        "HP:0000977": 0.60,  # Soft skin
        "HP:0002093": 0.15,  # Respiratory insufficiency (occasional)
    },
    "OMIM:300377": {  # Duchenne MD
        "HP:0003560": 0.98,  # Muscular dystrophy
        "HP:0003701": 0.90,  # Proximal muscle weakness
        "HP:0001252": 0.70,  # Hypotonia
        "HP:0001644": 0.60,  # Dilated cardiomyopathy
        "HP:0002093": 0.40,  # Respiratory insufficiency
        "HP:0001508": 0.35,  # Failure to thrive
        "HP:0000252": 0.10,  # Microcephaly (rare)
    },
    "OMIM:312750": {  # Rett Syndrome
        "HP:0002376": 0.99,  # Developmental regression
        "HP:0001250": 0.80,  # Seizures
        "HP:0001252": 0.65,  # Hypotonia
        "HP:0000717": 0.55,  # Autism features
        "HP:0000252": 0.50,  # Microcephaly
        "HP:0001263": 0.90,  # Global dev delay
        "HP:0002066": 0.45,  # Gait ataxia
    },
    "OMIM:219700": {  # Cystic Fibrosis
        "HP:0002093": 0.90,  # Respiratory insufficiency
        "HP:0001508": 0.50,  # Failure to thrive
    },
    "OMIM:101400": {  # Achondroplasia
        "HP:0004322": 0.99,  # Short stature
        "HP:0003701": 0.60,  # Proximal muscle weakness
    },
    "OMIM:610186": {  # Dravet Syndrome
        "HP:0001250": 0.99,  # Seizures
        "HP:0001263": 0.75,  # Global dev delay
        "HP:0000717": 0.45,  # Autism features
        "HP:0002376": 0.40,  # Developmental regression
    },
    "OMIM:192600": {  # Loeys-Dietz Syndrome
        "HP:0002616": 0.90,  # Aortic root dilation
        "HP:0002650": 0.65,  # Scoliosis
        "HP:0000098": 0.55,  # Tall stature
        "HP:0001166": 0.40,  # Arachnodactyly
    },
    "OMIM:130050": {  # Ehlers-Danlos
        "HP:0000977": 0.95,  # Soft skin
        "HP:0000978": 0.85,  # Bruising
        "HP:0002650": 0.40,  # Scoliosis
        "HP:0001166": 0.30,  # Arachnodactyly
    },
}

# Default base rates for diseases not in PHENOTYPE_FREQ_MAP
_DEFAULT_FREQ = 0.15


class DiseaseScore:
    def __init__(self, disease_id: str, disease_name: str):
        self.disease_id = disease_id
        self.disease_name = disease_name
        self.score: float = 0.0
        self.supporting: List[Dict] = []   # HPOs that match
        self.contradicting: List[Dict] = []  # HPOs that are absent but expected
        self.missing: List[Dict] = []        # HPOs expected but not observed
        self.log_likelihood: float = 0.0

    def to_dict(self) -> Dict:
        return {
            "disease_id": self.disease_id,
            "disease_name": self.disease_name,
            "score": round(self.score, 4),
            "log_likelihood": round(self.log_likelihood, 4),
            "supporting_features": self.supporting,
            "contradicting_features": self.contradicting,
            "missing_features": self.missing,
        }


class OrphanetDifferentialEngine:
    """
    Scores all known diseases against a patient's HPO profile.

    Scoring formula per disease D for observed HPO set O and excluded HPO set E:
      log P(O,E | D) = Σ_{h∈O} log P(h|D) + Σ_{h∈E} log(1 - P(h|D))
    Normalized by total number of features evaluated.
    """

    def __init__(self):
        self.freq_map = PHENOTYPE_FREQ_MAP
        self.disease_db = DISEASE_DB

    def score(
        self,
        observed_hpo: List[str],
        excluded_hpo: Optional[List[str]] = None,
        top_k: int = 10,
    ) -> List[DiseaseScore]:
        """
        Rank diseases by phenotypic fit.

        Args:
            observed_hpo: HPO IDs confirmed present
            excluded_hpo: HPO IDs confirmed absent (negated in clinical notes)
            top_k: number of top candidates to return

        Returns:
            Ranked list of DiseaseScore objects
        """
        excluded_hpo = excluded_hpo or []
        results: List[DiseaseScore] = []

        for disease_id, disease in self.disease_db.items():
            ds = DiseaseScore(disease_id, disease.name)
            freq_dict = self.freq_map.get(disease_id, {})

            log_ll = 0.0
            n_features = 0

            # Score observed phenotypes
            for hpo_id in observed_hpo:
                freq = freq_dict.get(hpo_id, _DEFAULT_FREQ)
                log_ll += math.log(freq + 1e-9)
                n_features += 1
                if hpo_id in HPO_DB:
                    ds.supporting.append({
                        "hpo_id": hpo_id,
                        "label": HPO_DB[hpo_id].label,
                        "frequency": freq,
                    })

            # Penalise excluded phenotypes if they're expected
            for hpo_id in excluded_hpo:
                freq = freq_dict.get(hpo_id, _DEFAULT_FREQ)
                if freq > 0.5:  # only penalise if it's a defining feature
                    log_ll += math.log(1.0 - freq + 1e-9)
                    n_features += 1
                    if hpo_id in HPO_DB:
                        ds.contradicting.append({
                            "hpo_id": hpo_id,
                            "label": HPO_DB[hpo_id].label,
                            "expected_frequency": freq,
                        })

            # Identify expected-but-unasked features
            for hpo_id, freq in freq_dict.items():
                if hpo_id not in observed_hpo and hpo_id not in excluded_hpo and freq >= 0.5:
                    if hpo_id in HPO_DB:
                        ds.missing.append({
                            "hpo_id": hpo_id,
                            "label": HPO_DB[hpo_id].label,
                            "frequency": freq,
                        })

            ds.log_likelihood = log_ll / max(n_features, 1)
            # Softmax-friendly score: shift to positive range
            ds.score = max(log_ll + 20.0, 0.0)
            results.append(ds)

        results.sort(key=lambda x: x.log_likelihood, reverse=True)
        return results[:top_k]

    def get_supporting_contradicting(
        self, disease_id: str, observed: List[str], excluded: List[str]
    ) -> Dict:
        """Get supporting/contradicting features for a specific disease."""
        freq_dict = self.freq_map.get(disease_id, {})
        supporting = []
        contradicting = []

        for hpo_id in observed:
            freq = freq_dict.get(hpo_id, _DEFAULT_FREQ)
            if hpo_id in HPO_DB:
                supporting.append({"hpo_id": hpo_id, "label": HPO_DB[hpo_id].label, "frequency": freq})

        for hpo_id in excluded:
            freq = freq_dict.get(hpo_id, _DEFAULT_FREQ)
            if freq > 0.4 and hpo_id in HPO_DB:
                contradicting.append({"hpo_id": hpo_id, "label": HPO_DB[hpo_id].label, "expected_frequency": freq})

        return {"supporting": supporting, "contradicting": contradicting}


class InformationGainCalculator:
    """
    For each unasked HPO term, estimates expected information gain:
    how much asking about it would reduce uncertainty in the differential.

    IG(h) = H(D) - E[H(D | result_h)]
    where H is Shannon entropy over the differential distribution.
    """

    def __init__(self, differential_engine: OrphanetDifferentialEngine):
        self.engine = differential_engine

    def _entropy(self, scores: List[float]) -> float:
        total = sum(scores) + 1e-12
        probs = [s / total for s in scores]
        return -sum(p * math.log(p + 1e-12) for p in probs)

    def compute(
        self,
        observed_hpo: List[str],
        excluded_hpo: List[str],
        candidate_hpo_ids: List[str],
        top_k_diseases: int = 5,
    ) -> List[Dict]:
        """
        Rank candidate HPO queries by expected information gain.

        Args:
            observed_hpo: currently confirmed HPO terms
            excluded_hpo: currently excluded HPO terms
            candidate_hpo_ids: HPO terms not yet asked
            top_k_diseases: number of top diseases to consider

        Returns:
            List of {hpo_id, label, info_gain, reason} dicts, sorted by info_gain desc
        """
        baseline = self.engine.score(observed_hpo, excluded_hpo, top_k_diseases)
        baseline_scores = [d.score for d in baseline]
        H_baseline = self._entropy(baseline_scores)

        results = []
        for hpo_id in candidate_hpo_ids:
            if hpo_id in observed_hpo or hpo_id in excluded_hpo:
                continue

            # Simulate positive result
            pos_differential = self.engine.score(observed_hpo + [hpo_id], excluded_hpo, top_k_diseases)
            H_pos = self._entropy([d.score for d in pos_differential])

            # Simulate negative result
            neg_differential = self.engine.score(observed_hpo, excluded_hpo + [hpo_id], top_k_diseases)
            H_neg = self._entropy([d.score for d in neg_differential])

            # Estimate expected IG (equal weight positive/negative for simplicity)
            expected_H = 0.5 * H_pos + 0.5 * H_neg
            ig = max(H_baseline - expected_H, 0.0)

            label = HPO_DB[hpo_id].label if hpo_id in HPO_DB else hpo_id

            # Build reason: which top-2 diseases does this separate?
            top2 = [d.disease_name for d in baseline[:2]]
            reason = (
                f"Distinguishes between {top2[0]} and {top2[1]}"
                if len(top2) >= 2
                else f"Narrows differential for {top2[0]}"
                if top2
                else "Reduces diagnostic uncertainty"
            )

            results.append({
                "hpo_id": hpo_id,
                "label": label,
                "info_gain": round(ig, 4),
                "reason": reason,
            })

        results.sort(key=lambda x: x["info_gain"], reverse=True)
        return results


# Singletons
differential_engine = OrphanetDifferentialEngine()
info_gain_calculator = InformationGainCalculator(differential_engine)
