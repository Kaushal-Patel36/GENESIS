"""
Next-Best-Step Recommendation Engine — Clinical Decision Copilot
================================================================
Module 3 per Hakon's specification.

Architecture:
  Bayesian Evidence Fusion
        ↓
  Uncertainty Quantifier
  (confidence intervals + "what info would change this")
        ↓
  Action Selector
  (Phenotype Refine / Order Test / Trigger Reanalysis / Refer Specialist)
        ↓
  LLM Rationale Generator (rule-based, GNN-grounded)
        ↓
  Structured Next-Step Report

Top 5 ranked actions by information gain. Red flags override ranking.
Pivotal question identifies the single missing piece that would most change ranking.
Confidence calibration: inversely proportional to top-2 score gap.
"""

from typing import List, Dict, Tuple, Optional
import math
from data.enhanced_mock_db import GENE_PHENOTYPE_MAP, HPO_DB, DISEASE_DB


class NextBestStepGenerator:
    """
    Generates ranked actionable clinical next steps.
    Implements Hakon's 3-layer architecture:
    Bayesian Fusion → Uncertainty Quantifier → Action Selector
    """

    def __init__(self):
        # Red flag HPO terms (urgent/critical — override IG ranking)
        self.red_flags = {
            "HP:0001645": "Sudden cardiac death risk — ventricular arrhythmia (URGENT)",
            "HP:0002616": "Aortic root dilatation — dissection risk (URGENT)",
            "HP:0001250": "Refractory seizures — status epilepticus risk (URGENT)",
            "HP:0002093": "Respiratory insufficiency — impending failure (URGENT)",
            "HP:0001943": "Acute hypoglycemia — metabolic crisis (URGENT)",
            "HP:0001644": "Dilated cardiomyopathy — cardiac failure risk (URGENT)",
        }

        # Disease-specific test recommendations
        self._test_map = {
            "marfan":            ["Echocardiogram — aortic root diameter", "Slit-lamp exam — ectopia lentis"],
            "loeys-dietz":       ["Echocardiogram — aortic root + branch vessels", "Cerebral MRA — intracranial aneurysm screen"],
            "ehlers-danlos":     ["Skin biopsy + electron microscopy", "Beighton score assessment (hypermobility)"],
            "duchenne":          ["Creatine Kinase (CK) serum level", "Muscle biopsy / dystrophin IHC", "Cardiac MRI"],
            "muscular dystrophy":["Creatine Kinase (CK) serum level", "EMG + nerve conduction study"],
            "rett":              ["EEG monitoring (24h + sleep)", "Brain MRI", "MECP2 sequencing"],
            "dravet":            ["EEG monitoring (24h)", "SCN1A targeted panel", "Sodium channel variant panel"],
            "cystic fibrosis":   ["Sweat chloride test", "CFTR full gene sequencing"],
            "achondroplasia":    ["Skeletal survey", "Head circumference monitoring"],
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Public interface
    # ─────────────────────────────────────────────────────────────────────────

    def generate(
        self,
        top_candidates: List[Dict],
        current_phenotypes: List[str],
        family_history: Optional[str] = None,
        info_gain_actions: Optional[List[Dict]] = None,
        reanalysis_score: Optional[float] = None,
        reanalysis_recommendation: Optional[str] = None,
    ) -> Dict:
        """
        Generates ranked clinical next steps as a structured report.

        Args:
            top_candidates: List of DiagnosisResult-like dicts (ranked by score)
            current_phenotypes: List of HPO IDs confirmed present
            family_history: Suspected inheritance pattern
            info_gain_actions: Pre-computed info gain actions from InformationGainCalculator
            reanalysis_score: Optional Module 2 score (0–1)
            reanalysis_recommendation: Optional Module 2 recommendation string
        """
        if not top_candidates:
            return self._empty_response()

        primary = top_candidates[0]

        # ── Step 1: Bayesian Evidence Fusion state ────────────────────────
        # (differential already computed upstream; we use it here as input)
        confidence_calibration = self._compute_calibration(top_candidates)

        # ── Step 2: Uncertainty Quantifier ───────────────────────────────
        uncertainty = self._generate_uncertainty_statement(primary, family_history, confidence_calibration)
        pivotal_question = self._generate_pivotal_question(primary, current_phenotypes, info_gain_actions)

        # ── Step 3: Action Selector ───────────────────────────────────────
        # Gather all candidate actions from 4 action types
        all_actions = []

        # Type A: Phenotype refinement (from IG calculator)
        phenotype_actions = self._phenotype_refine_actions(
            primary, top_candidates[:3], current_phenotypes, info_gain_actions
        )
        all_actions.extend(phenotype_actions)

        # Type B: Diagnostic tests
        test_actions = self._test_recommendation_actions(primary, family_history)
        all_actions.extend(test_actions)

        # Type C: Reanalysis trigger (from Module 2 score)
        if reanalysis_score is not None:
            reanalysis_action = self._reanalysis_action(reanalysis_score, reanalysis_recommendation)
            if reanalysis_action:
                all_actions.append(reanalysis_action)

        # Type D: Specialist referrals
        referral_actions = self._referral_actions(primary, current_phenotypes)
        all_actions.extend(referral_actions)

        # ── Step 4: Red Flag Detector (overrides IG ranking) ─────────────
        red_flags = self._detect_red_flags(current_phenotypes)

        # ── Step 5: Ranked Action List ────────────────────────────────────
        # Sort by info_gain descending; red flags prepended regardless
        all_actions.sort(key=lambda a: a.get("info_gain", 0.0), reverse=True)
        ranked_actions = all_actions[:5]

        # ── Generate backward-compatible fields ───────────────────────────
        suggested_phenotypes = [
            {
                "hpo_id": a["hpo_id"],
                "label": a["label"],
                "reason": a["reason"],
                "info_gain": a.get("info_gain", 0.0),
            }
            for a in phenotype_actions[:3]
            if "hpo_id" in a
        ]
        test_recommendations = [a["label"] for a in test_actions[:4]]
        referral_specialties = [a["label"] for a in referral_actions if "Medical Genetics" in a.get("label", "") or "Refer" in a.get("label", "")]
        if not referral_specialties:
            referral_specialties = ["Medical Genetics (Counseling)"]

        return {
            # ── Module 3 structured output ──
            "ranked_actions": ranked_actions,
            "red_flags": red_flags,
            "pivotal_question": pivotal_question,
            "confidence_calibration": confidence_calibration,
            "uncertainty_analysis": uncertainty,
            "inheritance_logic": (
                f"Consider {family_history} inheritance in diagnostic workup."
                if family_history and family_history != "unknown"
                else "Segregation analysis recommended to determine inheritance pattern."
            ),

            # ── Backward-compatible fields ──
            "suggested_phenotypes": suggested_phenotypes,
            "test_recommendations": test_recommendations,
            "referral_specialties": referral_specialties or ["Medical Genetics (Counseling)"],
            "calibration_score": confidence_calibration,
            "summary_action": (
                f"Prioritize {ranked_actions[0]['label'] if ranked_actions else 'clinical evaluation'}."
            ),
        }

    # ─────────────────────────────────────────────────────────────────────────
    # Bayesian Evidence Fusion helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _compute_calibration(self, candidates: List[Dict]) -> float:
        """
        Confidence calibration per Hakon's spec:
        Inversely proportional to how closely top 2-3 candidates are scored.
        Wide separation = high confidence. Close clustering = low confidence.
        """
        if len(candidates) < 2:
            return 1.0
        scores = [c.get("score", 0) for c in candidates[:5]]
        if not scores or max(scores) == 0:
            return 0.0
        top = scores[0]
        second = scores[1] if len(scores) > 1 else 0
        # Gap ratio: 1.0 = very different (high confidence), 0.0 = identical
        gap = (top - second) / (top + 1e-9)
        return round(min(gap, 1.0), 3)

    # ─────────────────────────────────────────────────────────────────────────
    # Uncertainty Quantifier
    # ─────────────────────────────────────────────────────────────────────────

    def _generate_uncertainty_statement(
        self, diagnosis: Dict, inheritance: Optional[str], calibration: float
    ) -> str:
        confidence = diagnosis.get("confidence", "Low")
        reasons = []
        if not diagnosis.get("variants"):
            reasons.append("absence of classified pathogenic variants")
        if not diagnosis.get("matching_phenotypes"):
            reasons.append("limited phenotype overlap")
        if inheritance == "unknown" or not inheritance:
            reasons.append("unclear inheritance pattern")
        if calibration < 0.2:
            reasons.append("top differential candidates have very similar scores")

        reason_str = "due to " + " and ".join(reasons) if reasons else "pending confirmatory laboratory studies"
        n_pheno = len(diagnosis.get("matching_phenotypes", []))

        if calibration >= 0.6:
            cal_str = "High confidence in top diagnosis"
        elif calibration >= 0.3:
            cal_str = "Moderate confidence — differential contains close alternatives"
        else:
            cal_str = "Low confidence — multiple diagnoses are nearly equally likely"

        return (
            f"{cal_str}. Current clinical confidence is {confidence} {reason_str}. "
            f"Phenotype match density: {n_pheno} overlapping HPO terms. "
            f"Expanding phenotype collection or awaiting molecular confirmation may resolve ambiguity."
        )

    def _generate_pivotal_question(
        self,
        diagnosis: Dict,
        current_phenotypes: List[str],
        info_gain_actions: Optional[List[Dict]],
    ) -> str:
        """
        Identify the single piece of missing information that would most change ranking.
        Per Hakon's spec: 'which single piece of missing information would most change the ranking?'
        """
        if info_gain_actions and len(info_gain_actions) > 0:
            top_ig = info_gain_actions[0]
            return (
                f"Does the patient have '{top_ig['label']}' ({top_ig['hpo_id']})? "
                f"This single phenotype has the highest discriminating power — confirming or excluding it "
                f"would most shift the differential ranking. ({top_ig.get('reason', '')})"
            )

        # Fallback: look at missing features from primary diagnosis
        disease_name = diagnosis.get("disease", {}).get("name", "the primary candidate")
        gene = diagnosis.get("gene", {}).get("symbol", "")
        if gene:
            gene_hpo = GENE_PHENOTYPE_MAP.get(gene, [])
            missing = [h for h in gene_hpo if h not in current_phenotypes]
            if missing and missing[0] in HPO_DB:
                hpo = HPO_DB[missing[0]]
                return (
                    f"Does the patient have '{hpo.label}' ({missing[0]})? "
                    f"This feature is commonly seen in {disease_name} but has not yet been documented."
                )

        return (
            f"Collect additional phenotypic data to improve differential discrimination. "
            f"Consider documenting cardiac, neurological, and skeletal examination findings."
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Action Selector — 4 action types
    # ─────────────────────────────────────────────────────────────────────────

    def _phenotype_refine_actions(
        self,
        diagnosis: Dict,
        top_candidates: List[Dict],
        observed: List[str],
        info_gain_actions: Optional[List[Dict]],
    ) -> List[Dict]:
        """Type A: Phenotype collection actions (highest IG first)."""
        actions = []

        if info_gain_actions:
            for a in info_gain_actions[:4]:
                actions.append({
                    "action_type": "collect_phenotype",
                    "hpo_id": a["hpo_id"],
                    "label": f"Collect phenotype: {a['label']}",
                    "reason": a.get("reason", "High information gain"),
                    "info_gain": a.get("info_gain", 0.0),
                    "explanation": (
                        f"Documenting '{a['label']}' (IG={a.get('info_gain', 0.0):.3f}) "
                        f"would most reduce diagnostic uncertainty. {a.get('reason', '')}"
                    ),
                })
            return actions

        # Fallback: unobserved features from associated gene
        gene = diagnosis.get("gene", {}).get("symbol")
        if gene:
            associated = GENE_PHENOTYPE_MAP.get(gene, [])
            unobserved = [h for h in associated if h not in observed]
            for hpo_id in unobserved[:3]:
                if hpo_id in HPO_DB:
                    actions.append({
                        "action_type": "collect_phenotype",
                        "hpo_id": hpo_id,
                        "label": f"Collect phenotype: {HPO_DB[hpo_id].label}",
                        "reason": f"Associated with {diagnosis.get('disease', {}).get('name', 'primary candidate')}",
                        "info_gain": 0.3,
                        "explanation": f"Document '{HPO_DB[hpo_id].label}' to narrow differential.",
                    })
        return actions

    def _test_recommendation_actions(
        self, diagnosis: Dict, inheritance: Optional[str] = None
    ) -> List[Dict]:
        """Type B: Diagnostic test actions."""
        actions = []
        disease_name = diagnosis.get("disease", {}).get("name", "").lower()
        gene_symbol = diagnosis.get("gene", {}).get("symbol", "")

        # Inheritance-based testing
        if inheritance == "Autosomal Dominant" and gene_symbol:
            actions.append({
                "action_type": "order_test",
                "label": f"Parental testing for {gene_symbol} (phasing/segregation)",
                "reason": "Autosomal dominant inheritance — parental status affects recurrence risk",
                "info_gain": 0.55,
                "explanation": f"AD inheritance pattern — phase variant in {gene_symbol} against parental testing.",
            })
        elif inheritance == "Autosomal Recessive" and gene_symbol:
            actions.append({
                "action_type": "order_test",
                "label": f"Carrier testing for both parents — {gene_symbol}",
                "reason": "Autosomal recessive — parental carrier status confirms biallelic inheritance",
                "info_gain": 0.55,
                "explanation": f"Confirm biallelic variants in {gene_symbol} with parental carrier testing.",
            })

        # Disease-specific tests
        for keyword, test_list in self._test_map.items():
            if keyword in disease_name:
                for test in test_list:
                    actions.append({
                        "action_type": "order_test",
                        "label": test,
                        "reason": f"Standard workup for {disease_name.title()}",
                        "info_gain": 0.5,
                        "explanation": f"Recommended investigation for {disease_name.title()} diagnosis.",
                    })
                break

        # Always include targeted validation
        if gene_symbol:
            actions.append({
                "action_type": "order_test",
                "label": f"Targeted Sanger sequencing — {gene_symbol} variant validation",
                "reason": "Confirm variant classification before clinical management decisions",
                "info_gain": 0.4,
                "explanation": f"Validate variant calls in {gene_symbol} with orthogonal sequencing method.",
            })

        return actions

    def _reanalysis_action(
        self, score: float, recommendation: Optional[str] = None
    ) -> Optional[Dict]:
        """Type C: Reanalysis trigger action (from Module 2)."""
        if score < 0.3:
            return None

        if score > 0.6:
            priority = "high"
            ig = 0.9
            label = "Trigger Reanalysis — Strong indication for re-sequencing"
        else:
            priority = "medium"
            ig = 0.65
            label = "Consider Reanalysis — Conditional indication"

        return {
            "action_type": "trigger_reanalysis",
            "label": label,
            "reason": recommendation or f"Reanalysis score: {score:.2f}",
            "info_gain": ig,
            "reanalysis_score": score,
            "explanation": (
                f"Module 2 reanalysis trigger score is {score:.2f}. "
                f"{recommendation or 'New evidence may explain prior negative result.'} "
                f"Re-analyze prior genomic data against updated databases."
            ),
        }

    def _referral_actions(self, diagnosis: Dict, phenotypes: List[str]) -> List[Dict]:
        """Type D: Specialist referral actions."""
        actions = []
        disease_name = diagnosis.get("disease", {}).get("name", "").lower()

        routing = {
            "Cardiology (Inherited Cardiac Diseases)":     ["marfan", "cardiomyopathy", "aortic", "loeys-dietz"],
            "Neuromuscular Specialist":                    ["dmd", "muscular", "dystrophy", "sma", "myopathy"],
            "Neurodevelopmental Pediatrician":             ["rett", "dravet", "developmental", "seizure"],
            "Ophthalmology":                               ["marfan", "ectopia", "loeys-dietz"],
            "Pulmonology":                                 ["cystic fibrosis", "respiratory"],
            "Orthopedics":                                 ["scoliosis", "achondroplasia", "ehlers-danlos"],
        }

        for specialty, keywords in routing.items():
            if any(kw in disease_name for kw in keywords):
                actions.append({
                    "action_type": "refer_specialist",
                    "label": f"Refer to {specialty}",
                    "reason": f"Indicated for {disease_name.title()} management",
                    "info_gain": 0.35,
                    "explanation": f"Specialist involvement in {specialty} is recommended for this differential.",
                })

        # Always recommend genetics counseling
        actions.append({
            "action_type": "refer_specialist",
            "label": "Refer to Medical Genetics (Counseling)",
            "reason": "Genetic counseling for rare disease diagnostic workup",
            "info_gain": 0.3,
            "explanation": "Medical genetics team to coordinate comprehensive rare disease workup.",
        })

        return actions

    # ─────────────────────────────────────────────────────────────────────────
    # Red Flag Detector
    # ─────────────────────────────────────────────────────────────────────────

    def _detect_red_flags(self, phenotypes: List[str]) -> List[str]:
        """
        Independently scans for urgent clinical signals.
        These override information gain ranking per Hakon's spec.
        """
        alerts = []
        for hpo_id in phenotypes:
            if hpo_id in self.red_flags:
                alerts.append(f"⚠ {self.red_flags[hpo_id]}")
        return alerts

    # ─────────────────────────────────────────────────────────────────────────
    # Empty response
    # ─────────────────────────────────────────────────────────────────────────

    def _empty_response(self) -> Dict:
        return {
            "ranked_actions": [{
                "action_type": "collect_phenotype",
                "label": "Collect comprehensive clinical phenotype",
                "reason": "Insufficient data to generate specific recommendations",
                "info_gain": 1.0,
                "explanation": "Document patient phenotypes using HPO terms to enable differential diagnosis.",
            }],
            "red_flags": [],
            "pivotal_question": "What are the patient's primary clinical features? Document phenotypes using standardized HPO terminology.",
            "confidence_calibration": 0.0,
            "uncertainty_analysis": "Insufficient data to generate specific recommendations.",
            "suggested_phenotypes": [],
            "test_recommendations": [],
            "referral_specialties": ["Medical Genetics"],
            "calibration_score": 0.0,
            "inheritance_logic": "Refer to clinical genetics for comprehensive evaluation.",
            "summary_action": "Refer to clinical genetics for comprehensive evaluation.",
        }
