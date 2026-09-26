"""
Reanalysis Trigger Module — 4-Signal Urgency Scoring (0–1 scale)
================================================================
Module 2 per Hakon's specification.

Determines the clinical utility of re-analyzing a prior negative genetic
test based on 4 weighted signals:

Signal 1 — New Phenotypes Since Last Test (weight: 30%)
Signal 2 — New Gene-Disease Associations (weight: 35%)
Signal 3 — VUS Reclassification Potential (weight: 25%)
Signal 4 — Technology Gap (weight: 10%)

Threshold logic:
  score > 0.6  = strong reanalysis recommendation
  0.3–0.6      = conditional recommendation
  < 0.3        = not yet indicated
"""

import datetime
from typing import List, Dict, Optional
from data.enhanced_mock_db import GENE_PHENOTYPE_MAP, DISEASE_DB, HPO_DB


# ─── Mock knowledge bases (would be live API calls in production) ────────────

# Gene-disease associations with discovery dates (post-test = new signal)
_GENE_DISCOVERY_DATES: Dict[str, datetime.date] = {
    "GBA":    datetime.date(2023, 5, 15),
    "SCN1A":  datetime.date(2024, 1, 10),
    "CDKL5":  datetime.date(2024, 11, 20),
    "FBN1":   datetime.date(2020, 3, 1),   # Pre-2022 (standard knowledge)
    "MECP2":  datetime.date(2019, 6, 1),
    "DMD":    datetime.date(2021, 9, 1),
    "CFTR":   datetime.date(2020, 1, 1),
    "FGFR3":  datetime.date(2020, 1, 1),
    "TNNT2":  datetime.date(2024, 8, 5),   # New cardiac gene
    "PIEZO2": datetime.date(2025, 1, 15),  # Very recent
}

# VUS mock database — variants that have been reclassified
# In production: real-time ClinVar API lookup
_VUS_RECLASSIFICATION_DB: Dict[str, Dict] = {
    "FBN1:c.8156T>A": {
        "old_class": "VUS",
        "new_class": "Likely_Pathogenic",
        "reclassified_date": datetime.date(2024, 3, 1),
    },
    "SCN1A:c.4933G>A": {
        "old_class": "VUS",
        "new_class": "Pathogenic",
        "reclassified_date": datetime.date(2024, 6, 15),
    },
    "MECP2:c.916C>T": {
        "old_class": "VUS",
        "new_class": "Likely_Pathogenic",
        "reclassified_date": datetime.date(2023, 11, 1),
    },
    "DMD:c.5981A>G": {
        "old_class": "VUS",
        "new_class": "VUS",  # Still VUS — no change
        "reclassified_date": None,
    },
}

# Technology capability ladder
_TECH_LADDER = [
    "targeted_panel",
    "targeted_exome",
    "whole_exome",
    "whole_genome",
]
_TECH_COVERAGE_GAPS = {
    "targeted_panel":  {"gap": "panel → exome", "score": 1.0},
    "targeted_exome":  {"gap": "exome → genome / add CNV-SV", "score": 0.8},
    "whole_exome":     {"gap": "add RNA-seq / CNV-SV / long-read", "score": 0.5},
    "whole_genome":    {"gap": "consider RNA-seq / methylation", "score": 0.2},
    "WES":             {"gap": "exome → genome / add CNV-SV", "score": 0.7},
    "WGS":             {"gap": "consider RNA-seq / methylation", "score": 0.2},
    "gene_panel":      {"gap": "panel → exome", "score": 1.0},
}


class ReanalysisTrigger:
    """
    Implements Hakon's 4-signal reanalysis scoring on a 0–1 scale.
    """

    # Signal weights (must sum to 1.0)
    W_NEW_PHENOTYPES = 0.30
    W_NEW_ASSOCIATIONS = 0.35
    W_VUS_RECLASSIFICATION = 0.25
    W_TECHNOLOGY_GAP = 0.10

    def score_urgency(
        self,
        prior_test: Dict,
        current_phenotypes: List[str],
        vus_list: Optional[List[str]] = None,
    ) -> Dict:
        """
        Calculates reanalysis urgency score (0–1).

        Args:
            prior_test: {
                "type": "WES",           # test type
                "date": "2022-03-15",    # ISO date of last test
                "result": "negative",    # "negative" | "VUS" | "incomplete"
                "genes_tested": [...]    # optional list of genes on prior panel
            }
            current_phenotypes: List of current HPO IDs
            vus_list: Optional list of VUS variant strings (e.g. "FBN1:c.8156T>A")
        """
        test_date_str = prior_test.get("date", "2020-01-01")
        try:
            test_date = datetime.date.fromisoformat(test_date_str)
        except ValueError:
            test_date = datetime.date(2020, 1, 1)

        test_type = prior_test.get("type", "WES")
        vus_list = vus_list or []

        # ── Signal 1: New Phenotypes Since Last Test (30%) ────────────────
        s1_score, s1_detail = self._signal_new_phenotypes(current_phenotypes, test_date)

        # ── Signal 2: New Gene-Disease Associations (35%) ─────────────────
        s2_score, s2_detail = self._signal_new_associations(current_phenotypes, test_date)

        # ── Signal 3: VUS Reclassification Potential (25%) ───────────────
        s3_score, s3_detail = self._signal_vus_reclassification(
            vus_list, prior_test.get("result", "negative"), test_date
        )

        # ── Signal 4: Technology Gap (10%) ────────────────────────────────
        s4_score, s4_detail = self._signal_technology_gap(test_type, test_date)

        # ── Weighted composite score ───────────────────────────────────────
        total = (
            self.W_NEW_PHENOTYPES   * s1_score
            + self.W_NEW_ASSOCIATIONS * s2_score
            + self.W_VUS_RECLASSIFICATION * s3_score
            + self.W_TECHNOLOGY_GAP * s4_score
        )
        total = round(min(total, 1.0), 4)

        # ── Threshold classification ───────────────────────────────────────
        if total > 0.6:
            recommendation = "Strong — Reanalysis Recommended"
            urgency_level = "strong"
        elif total >= 0.3:
            recommendation = "Conditional — Reanalysis May Be Indicated"
            urgency_level = "conditional"
        else:
            recommendation = "Not Yet Indicated — Continue Monitoring"
            urgency_level = "low"

        # ── Top reasons ───────────────────────────────────────────────────
        top_reasons = self._compile_top_reasons(s1_detail, s2_detail, s3_detail, s4_detail)

        # ── Action checklist ──────────────────────────────────────────────
        action_checklist = self._generate_checklist(
            total, urgency_level, s2_detail, s3_detail, s4_detail, test_type
        )

        return {
            "score": total,
            "recommendation": recommendation,
            "urgency_level": urgency_level,
            "signal_breakdown": {
                "new_phenotypes": round(s1_score * self.W_NEW_PHENOTYPES, 4),
                "new_gene_associations": round(s2_score * self.W_NEW_ASSOCIATIONS, 4),
                "vus_reclassification": round(s3_score * self.W_VUS_RECLASSIFICATION, 4),
                "technology_gap": round(s4_score * self.W_TECHNOLOGY_GAP, 4),
            },
            "raw_signal_scores": {
                "new_phenotypes": round(s1_score, 4),
                "new_gene_associations": round(s2_score, 4),
                "vus_reclassification": round(s3_score, 4),
                "technology_gap": round(s4_score, 4),
            },
            "top_reasons": top_reasons,
            "action_checklist": action_checklist,
            "detail": {
                "signal_1": s1_detail,
                "signal_2": s2_detail,
                "signal_3": s3_detail,
                "signal_4": s4_detail,
            },
            # Backward-compatible fields
            "breakdown": {
                "new_phenotypes": int(s1_score * 30),
                "new_associations": int(s2_score * 35),
                "vus_reclassification": int(s3_score * 25),
                "technology_gap": int(s4_score * 10),
            },
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Signal computation methods
    # ─────────────────────────────────────────────────────────────────────────

    def _signal_new_phenotypes(
        self, current_phenotypes: List[str], test_date: datetime.date
    ) -> tuple:
        """
        Signal 1: New phenotypes since the date of the last test.
        Heuristic: assume phenotypes added within last 2 years are "new"
        (in production: compare against EMR snapshot at test time).
        """
        if not current_phenotypes:
            return 0.0, {"n_phenotypes": 0, "n_new": 0}

        # Days since last test
        days_since = (datetime.date.today() - test_date).days

        # Each phenotype has a probability of being "new" based on when test was done
        # A recent test (< 6 months) → few new phenotypes
        # Old test (> 3 years) → many new phenotypes
        if days_since < 180:
            new_fraction = 0.05
        elif days_since < 365:
            new_fraction = 0.15
        elif days_since < 730:
            new_fraction = 0.35
        elif days_since < 1095:
            new_fraction = 0.55
        else:
            new_fraction = 0.75

        n_new = round(len(current_phenotypes) * new_fraction)
        score = min(n_new / 5.0, 1.0)  # 5 new phenotypes = max score

        return score, {
            "n_phenotypes": len(current_phenotypes),
            "estimated_new": n_new,
            "days_since_test": days_since,
            "new_fraction": new_fraction,
        }

    def _signal_new_associations(
        self, current_phenotypes: List[str], test_date: datetime.date
    ) -> tuple:
        """
        Signal 2: New gene-disease associations discovered after test_date.
        Queries the mock gene-disease association database.
        In production: live OMIM/Orphanet API.
        """
        newly_linked_genes = []
        matched_phenotypes = []

        for gene, discovery_date in _GENE_DISCOVERY_DATES.items():
            if discovery_date > test_date:
                # Check if this gene is relevant to the patient's phenotypes
                hpo_ids = GENE_PHENOTYPE_MAP.get(gene, [])
                matching = [h for h in current_phenotypes if h in hpo_ids]
                if matching:
                    newly_linked_genes.append({
                        "gene": gene,
                        "discovery_date": str(discovery_date),
                        "matching_phenotypes": matching,
                    })
                    matched_phenotypes.extend(matching)

        # Score: 0 if no new genes, scales up to 1.0 with more new gene links
        if not newly_linked_genes:
            score = 0.0
        elif len(newly_linked_genes) >= 3:
            score = 1.0
        elif len(newly_linked_genes) == 2:
            score = 0.75
        else:
            score = 0.55

        return score, {
            "newly_linked_genes": newly_linked_genes,
            "n_new_genes": len(newly_linked_genes),
        }

    def _signal_vus_reclassification(
        self, vus_list: List[str], test_result: str, test_date: datetime.date
    ) -> tuple:
        """
        Signal 3: VUS reclassification potential.
        Checks ClinVar mock for variant reclassification after test_date.
        """
        reclassified = []
        still_vus = []

        # If prior test result was VUS (some VUS returned)
        is_vus_case = test_result.lower() in ("vus", "variant of uncertain significance")

        # Check provided VUS list
        for variant in vus_list:
            info = _VUS_RECLASSIFICATION_DB.get(variant)
            if info:
                if info.get("reclassified_date") and info["reclassified_date"] > test_date:
                    if info["new_class"] in ("Pathogenic", "Likely_Pathogenic"):
                        reclassified.append({
                            "variant": variant,
                            "old_class": info["old_class"],
                            "new_class": info["new_class"],
                            "reclassified_date": str(info["reclassified_date"]),
                        })
                    else:
                        still_vus.append(variant)
                else:
                    still_vus.append(variant)

        # Score computation
        if reclassified:
            # Any reclassified VUS to pathogenic/likely = immediate high signal
            score = min(0.8 + 0.2 * len(reclassified), 1.0)
        elif still_vus:
            # VUS present but not reclassified = moderate signal (could be reclassified later)
            score = 0.45
        elif is_vus_case and not vus_list:
            # Test returned VUS but we don't have the VUS list → moderate uncertainty
            score = 0.5
        else:
            score = 0.0

        return score, {
            "reclassified_variants": reclassified,
            "still_vus": still_vus,
            "is_vus_case": is_vus_case,
        }

    def _signal_technology_gap(
        self, test_type: str, test_date: datetime.date
    ) -> tuple:
        """
        Signal 4: Technology gap assessment.
        Assesses whether newer testing technology would cover more ground.
        """
        gap_info = _TECH_COVERAGE_GAPS.get(test_type, _TECH_COVERAGE_GAPS.get("WES"))
        gap_score = gap_info["gap"] if gap_info else "unknown gap"
        base_score = gap_info["score"] if gap_info else 0.5

        # Older tests get additional score boost (databases have expanded since)
        years_since = (datetime.date.today() - test_date).days / 365.25
        time_bonus = min(years_since * 0.05, 0.2)  # Max 20% bonus
        score = min(base_score + time_bonus, 1.0)

        capabilities_missing = []
        if test_type.lower() in ("targeted_panel", "gene_panel"):
            capabilities_missing = ["Whole exome coverage", "CNV/SV detection", "Intronic variants"]
        elif test_type.upper() in ("WES", "TARGETED_EXOME", "WHOLE_EXOME"):
            capabilities_missing = ["Non-coding regulatory variants (WGS)", "CNV/SV analysis", "RNA-seq splicing"]
        elif test_type.upper() in ("WGS", "WHOLE_GENOME"):
            capabilities_missing = ["RNA-seq (splicing variants)", "Methylation analysis"]

        return score, {
            "test_type": test_type,
            "gap_description": gap_info["gap"] if gap_info else "Unknown",
            "score": round(score, 3),
            "capabilities_missing": capabilities_missing,
            "years_since_test": round(years_since, 1),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Output generation
    # ─────────────────────────────────────────────────────────────────────────

    def _compile_top_reasons(self, s1, s2, s3, s4) -> List[str]:
        reasons = []

        # Signal 2 (highest weight) first
        if s2["n_new_genes"] > 0:
            gene_names = [g["gene"] for g in s2["newly_linked_genes"]]
            reasons.append(
                f"New gene-disease associations published after last test: {', '.join(gene_names)}"
            )

        # Signal 3
        if s3.get("reclassified_variants"):
            var_names = [r["variant"] for r in s3["reclassified_variants"]]
            reasons.append(
                f"VUS reclassified to pathogenic/likely pathogenic: {', '.join(var_names)}"
            )
        elif s3.get("is_vus_case") and s3.get("still_vus"):
            reasons.append(
                f"VUS variants ({', '.join(s3['still_vus'])}) may benefit from updated ClinVar classification"
            )

        # Signal 1
        if s1.get("estimated_new", 0) > 0:
            reasons.append(
                f"~{s1['estimated_new']} new phenotype(s) documented since last test ({s1['days_since_test']} days ago)"
            )

        # Signal 4
        if s4.get("capabilities_missing"):
            reasons.append(
                f"Technology gap: {s4['gap_description']} — missing: {', '.join(s4['capabilities_missing'][:2])}"
            )

        return reasons[:4]  # Top 4 reasons

    def _generate_checklist(self, score, urgency, s2, s3, s4, test_type) -> List[str]:
        checklist = []

        if urgency == "strong":
            checklist.append("🔴 PRIORITY: Submit case for immediate reanalysis review")
        elif urgency == "conditional":
            checklist.append("🟡 Schedule reanalysis review at next clinical genetics appointment")
        else:
            checklist.append("🟢 Continue clinical monitoring; revisit in 6–12 months")

        if s2["n_new_genes"] > 0:
            genes = [g["gene"] for g in s2["newly_linked_genes"]]
            checklist.append(f"Re-analyze data against updated gene-disease links: {', '.join(genes)}")

        if s3.get("reclassified_variants"):
            for r in s3["reclassified_variants"]:
                checklist.append(
                    f"Reclassified variant {r['variant']}: {r['old_class']} → {r['new_class']} — update clinical record"
                )

        if s4.get("capabilities_missing"):
            if "WGS" in test_type.upper() or "GENOME" in test_type.upper():
                checklist.append("Consider RNA-seq to detect splicing variants not captured by DNA sequencing")
            elif "WES" in test_type.upper() or "EXOME" in test_type.upper():
                checklist.append("Expand to whole genome sequencing to capture non-coding regulatory variants")
                checklist.append("Add CNV/SV analysis if not already performed on existing data")
            else:
                checklist.append("Upgrade from gene panel to whole exome or whole genome sequencing")

        if score >= 0.3:
            checklist.append("Update phenotype documentation and share with genetic lab before reanalysis")

        return checklist
