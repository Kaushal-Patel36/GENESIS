from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# --- Enums & Literals ---
# Pathogenicity weights
WEIGHT_PATHOGENIC = 1.0
WEIGHT_LIKELY_PATHOGENIC = 0.8
WEIGHT_VUS = 0.4
WEIGHT_BENIGN = 0.1

class HPOPhenotype(BaseModel):
    id: str
    label: str
    description: Optional[str] = None

class PatientInput(BaseModel):
    vcf_content: Optional[str] = None # Base64 or raw string of VCF
    clinical_notes: Optional[str] = None
    hpo_ids: List[str] = []

class Variant(BaseModel):
    id: str # e.g. "chr4:g.55593655C>T"
    gene_symbol: str
    clinvar_classification: str # "Pathogenic", "Likely pathogenic", "VUS", "Benign"
    weight: float

class Gene(BaseModel):
    symbol: str
    name: str
    description: Optional[str] = None
    chromosome: Optional[str] = None

class Pathway(BaseModel):
    id: str
    name: str

class Disease(BaseModel):
    id: str # e.g. OMIM:154700
    name: str
    description: Optional[str] = None
    associated_genes: List[str] = [] # List of gene symbols

class Evidence(BaseModel):
    source: str # "ClinVar", "OMIM", "HPO", "Reactome"
    description: str
    score_contribution: float

# --- ML-specific response models ---
class NLPExtractionResult(BaseModel):
    hpo_id: str
    label: str
    confidence: float
    source_text: str
    method: str
    negated: bool = False

class VariantPredictionResult(BaseModel):
    variant_id: str
    pathogenicity_score: float
    classification: str
    confidence: float
    feature_importances: Dict[str, float] = {}

class MLScores(BaseModel):
    nlp_extractions: List[NLPExtractionResult] = []
    variant_predictions: List[VariantPredictionResult] = []
    phenotype_similarity: Dict[str, float] = {}  # disease_id → similarity
    gnn_scores: Dict[str, float] = {}  # disease_id → GNN link prediction score
    gnn_similar_genes: List[Dict[str, Any]] = []
    pathway_perturbation_score: float = 0.0  # Network instability metric

class DiagnosisResult(BaseModel):
    rank: int
    gene: Gene
    disease: Disease
    score: float
    confidence: str # "High", "Medium", "Low"
    matching_phenotypes: List[HPOPhenotype]
    variants: List[Variant]
    pathways: List[Pathway]
    evidence: List[Evidence]
    explanation: str
    ml_scores: Optional[MLScores] = None

class AnalysisResponse(BaseModel):
    results: List[DiagnosisResult]
    suggested_next_steps: List[str]

# --- Pathway Perturbation Engine models ---
class PathwayDisruption(BaseModel):
    pathway_id: str
    pathway_name: str
    disruption_score: float
    affected_genes: List[str]
    centrality_shift: float
    heat_accumulation: float

class TemporalStage(BaseModel):
    stage: str
    time_label: str
    active_pathways: List[str]
    cascade_genes: List[str]
    network_instability: float

class CascadeNode(BaseModel):
    gene: str
    heat_score: float
    is_variant_source: bool
    pathways: List[str]
    influence_score: float

class CascadeEdge(BaseModel):
    source: str
    target: str
    weight: float
    pathway: str
    mechanism: str = ""

class PerturbationResponse(BaseModel):
    gene: str
    disrupted_pathways: List[PathwayDisruption]
    temporal_stages: List[TemporalStage]
    cascade_nodes: List[CascadeNode]
    cascade_edges: List[CascadeEdge]
    overall_instability: float
    clinical_summary: str
    treatment_hints: List[str]

# --- EpistaLink Epistasis Engine models ---
class EpistaVariant(BaseModel):
    id: str
    position: int
    effect: str
    domain: str

class EpistaFeatureChange(BaseModel):
    feature_index: int
    feature_name: str
    single_activation: float
    pair_activation: float
    delta: float
    direction: str  # "repressed" or "enhanced"

class EpistaMotifImpact(BaseModel):
    motif_sequence: str
    motif_name: str
    function: str
    conservation_score: float
    interaction_status: str  # "disrupted", "activated", "maintained"
    impact_score: float

class EpistaHeatmapEntry(BaseModel):
    feature: str
    variant_1_activation: float
    variant_2_activation: float
    pair_activation: float
    interaction_delta: float

class EpistaVariantPair(BaseModel):
    variant_1: EpistaVariant
    variant_2: EpistaVariant
    epistasis_score: float
    classification: str  # "negative", "positive", "neutral"
    description: str
    clinical_significance: str
    feature_changes: List[EpistaFeatureChange]
    motif_impacts: List[EpistaMotifImpact]
    heatmap_data: List[EpistaHeatmapEntry]

class EpistaModelInfo(BaseModel):
    method: str
    steepness_parameter: float
    n_features: int
    scoring_range: str
    interpretation: Optional[Dict[str, str]] = None

class EpistasisResponse(BaseModel):
    gene: str
    variant_pairs: List[EpistaVariantPair]
    overall_epistasis_score: float
    dominant_interaction_type: str
    total_pairs_analyzed: int
    clinical_summary: str
    model_info: EpistaModelInfo
# --- EntropiX Engine models ---
class ManifoldNode(BaseModel):
    id: str
    label: str
    type: str
    x: float
    y: float
    z: float
    similarity: float
    glowing: bool = False

class DiffusionNode(BaseModel):
    gene: str
    heat: float
    is_source: bool

class OrganRisk(BaseModel):
    organ: str
    risk: float

class EntropiXResponse(BaseModel):
    gene: str
    entropy_weights: Dict[str, float]
    diffusion_nodes: List[DiffusionNode]
    manifold_projection: List[ManifoldNode]
    uncertainty_eigenvalue: float
    differential_summary: str
    organ_risks: List[OrganRisk]
    spectral_log: List[str] = []

# --- AntropiX Cross-Modal Latent Attractor models ---
class AttractorPoint(BaseModel):
    disease_id: str
    disease_name: str
    x: float
    y: float
    z: float
    gravity: float
    confidence: float
    poincare_distance: float
    radius: float

class FlowVector(BaseModel):
    x: float
    y: float
    z: float
    vx: float
    vy: float
    vz: float
    magnitude: float

class PatientPosition(BaseModel):
    x: float
    y: float
    z: float

class AttractorFieldData(BaseModel):
    attractors: List[AttractorPoint]
    flow_vectors: List[FlowVector]
    patient_position: PatientPosition

class SpectralAnalysis(BaseModel):
    fiedler_value: float
    eigenvalue_std: float
    instability_score: float
    critical_path_alert: bool
    gene_fiedler_component: float
    top_eigenvalues: List[float] = []

class KnockoutResult(BaseModel):
    impacted_genes: List[Dict[str, Any]] = []
    fiedler_value: float
    stability_change: float
    network_disruption: float

class DrugStabilization(BaseModel):
    reinforced_interactions: List[str] = []
    fiedler_value: float
    stability_improvement: float
    network_resilience: float

class DigitalTwinResult(BaseModel):
    gene: str
    knockout: KnockoutResult
    drug_stabilization: DrugStabilization
    baseline_fiedler: float

class ShadowPhenotype(BaseModel):
    hpo_id: str
    label: str
    probability: float
    source_disease: str
    source_disease_id: str
    time_horizon_months: int
    latent_distance: float

class EvidenceReliability(BaseModel):
    axis: str
    certainty: float
    source: str
    effect: str
    pulse_speed: float
    intensity: float

class CascadeWavefrontNode(BaseModel):
    id: str
    label: str
    stage: int
    signal_strength: float
    is_bottleneck: bool
    effect: str
    color: str
    delay_ms: int

class MechanisticNarrative(BaseModel):
    primary_analysis: str
    shadow_prediction: str
    recommendation: str
    bifurcation_detected: bool
    confidence: float
    pathway_focus: str

class AntropiXResponse(BaseModel):
    gene: str
    spectral_analysis: SpectralAnalysis
    attractor_field: AttractorFieldData
    digital_twin: DigitalTwinResult
    shadow_phenotypes: List[ShadowPhenotype]
    evidence_reliability: List[EvidenceReliability]
    cascade_wavefront: List[CascadeWavefrontNode]
    mechanistic_narrative: MechanisticNarrative
    spectral_log: List[str] = []


# ── Cohort Intelligence Models ──────────────────────────────────

class CohortNode(BaseModel):
    id: str
    x: float
    y: float
    cluster: int
    spectral_cluster: int
    pagerank: float
    is_current: bool
    confidence: float
    has_genomic_data: bool
    disease: str
    age: int
    sex: str
    n_phenotypes: int

class SimilarityBeam(BaseModel):
    target_id: str
    similarity: float
    shared_phenotypes: List[str]
    target_disease: str
    target_treatment: str
    target_outcome: str
    confidence: float

class CohortIntelligenceResponse(BaseModel):
    gene: str
    n_patients: int
    n_clusters: int
    patient_cluster: int
    cluster_similarity: float
    representative_patient: Optional[str] = None
    best_treatment: str
    most_likely_outcome: str
    nodes: List[CohortNode]
    similarity_beams: List[SimilarityBeam]
    cluster_summary: str
    spectral_log: List[str] = []


# ── Unified GENESIS Intelligence Response ───────────────────────

class GenesisIntelligenceResponse(BaseModel):
    """Combined response from all three engines."""
    gene: str
    entropix: EntropiXResponse
    antropix: AntropiXResponse
    cohort: CohortIntelligenceResponse


# ── HeteroNet: Genotype–Phenotype Cascade Modeling ──────────────

class HeteroNetCase(BaseModel):
    patient_id: str
    icd_codes: List[str]
    likelihood_score: float
    is_confirmed_heterotaxy: bool
    laterality_score: float
    splenic_score: float
    cardiac_score: float

class HeteroNetGene(BaseModel):
    symbol: str
    mutation_type: str  # e.g. "loss_of_function", "missense"
    pathogenicity_score: float
    pathway: str

class HeteroNetNode(BaseModel):
    id: str
    label: str
    layer: int  # 0=gene, 1=pathway, 2=organ, 3=complication
    node_type: str
    risk_score: float
    color: str

class HeteroNetEdge(BaseModel):
    source: str
    target: str
    weight: float
    mechanism: str

class HeteroNetSubtype(BaseModel):
    id: str
    name: str
    description: str
    dominant_feature: str
    genotype_associations: List[str]
    patient_count: int
    risk_level: str
    color: str

class HeteroNetOrganRisk(BaseModel):
    organ: str
    risk_score: float
    top_contributor: str
    findings: List[str]

class HeteroNetCareStep(BaseModel):
    specialty: str
    priority: str
    action: str
    timeline: str
    icon: str

class HeteroNetValidation(BaseModel):
    detection_accuracy: float
    genotype_phenotype_r2: float
    ablation_delta: float
    n_cases_tested: int

class HeteroNetResponse(BaseModel):
    sample_cases: List[HeteroNetCase]
    confirmed_genes: List[HeteroNetGene]
    graph_nodes: List[HeteroNetNode]
    graph_edges: List[HeteroNetEdge]
    subtypes: List[HeteroNetSubtype]
    organ_risks: List[HeteroNetOrganRisk]
    care_roadmap: List[HeteroNetCareStep]
    validation: HeteroNetValidation
    heterotaxy_probability: float
    active_subtype: str
    infection_alert: bool
    cascade_log: List[str]


# ── Advanced Response Models ──────────────────────────────────

class PhenotypicFeature(BaseModel):
    hpo_id: str
    hpo_label: str
    link_confidence: float
    excluded: bool = False
    subject: str = "patient"
    status: str = "unknown"
    onset_age_years: Optional[float] = None
    severity: Optional[str] = None
    certainty: str = "confirmed"
    data_origin: str = "clinical_exam"
    suspected_inheritance: str = "unknown"
    evidence_span: Dict[str, Any] = {}

class ReanalysisResult(BaseModel):
    score: float
    recommendation: str
    breakdown: Dict[str, float]
    top_reasons: List[str]
    action_checklist: List[str]

class NextStepsResult(BaseModel):
    suggested_phenotypes: List[Dict[str, Any]]
    test_recommendations: List[str]
    referral_specialties: List[str]
    uncertainty_analysis: str
    red_flags: List[str]
    inheritance_logic: Optional[str] = None
    summary_action: str

class AdvancedAnalysisResponse(BaseModel):
    results: List[DiagnosisResult]
    phenopacket: List[PhenotypicFeature]
    reanalysis: Optional[ReanalysisResult] = None
    next_steps: Optional[NextStepsResult] = None
    processing_time_ms: float
    analysis_metadata: Dict[str, Any] = {}
