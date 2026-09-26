"""
HackRare Past Winners Database
================================
Curated dataset of past HackRare hackathon winners and notable projects.
Used by the Chrono-Avatar HackRare Winners Panel.
"""

HACKRARE_WINNERS = [
    {
        "year": 2024,
        "team": "PhenoForge",
        "project": "Real-Time Phenotype-to-Variant AI Mapper",
        "description": "Leveraged GPT-4 + HPO ontology to instantly map clinical text to variants with explainable AI overlays.",
        "category": "AI/ML",
        "prize": "🥇 1st Place",
        "prize_amount": "$15,000",
        "tech_stack": ["Python", "FastAPI", "GPT-4", "React", "HPO"],
        "impact": "Reduced diagnosis time by 68% in pilot at Boston Children's Hospital.",
        "team_size": 4,
        "disease_focus": "Lysosomal Storage Disorders",
        "color": "emerald",
    },
    {
        "year": 2024,
        "team": "RareConnect AI",
        "project": "Patient Registry Graph Neural Network",
        "description": "GNN-based system connecting patients with similar rare disease profiles across anonymized global registries.",
        "category": "Graph ML",
        "prize": "🥈 2nd Place",
        "prize_amount": "$8,000",
        "tech_stack": ["PyTorch Geometric", "Neo4j", "Next.js", "FastAPI"],
        "impact": "Connected 240+ undiagnosed patients to matching clinical trials.",
        "team_size": 3,
        "disease_focus": "Undiagnosed Diseases",
        "color": "blue",
    },
    {
        "year": 2023,
        "team": "GenoBridge",
        "project": "Multi-Omic Rare Disease Variant Interpreter",
        "description": "Integrates WES, RNA-seq, and proteomics through a unified transformer model for holistic variant interpretation.",
        "category": "Deep Learning",
        "prize": "🥇 1st Place",
        "prize_amount": "$12,000",
        "tech_stack": ["Python", "PyTorch", "Hugging Face", "React", "AWS"],
        "impact": "Used by 3 hospitals in post-hackathon pilot; 2 publications submitted.",
        "team_size": 5,
        "disease_focus": "Connective Tissue Disorders",
        "color": "emerald",
    },
    {
        "year": 2023,
        "team": "OmicsOracle",
        "project": "Conversational Rare Disease Diagnostics",
        "description": "Voice-first clinical AI assistant that converts physician narrative into structured HPO phenotype queries.",
        "category": "NLP/Speech",
        "prize": "🥉 3rd Place",
        "prize_amount": "$4,000",
        "tech_stack": ["Whisper", "BERT", "Flutter", "MongoDB"],
        "impact": "Reduced clinical coding time by 45 min/patient.",
        "team_size": 2,
        "disease_focus": "Craniofacial Disorders",
        "color": "purple",
    },
    {
        "year": 2022,
        "team": "VariantVault",
        "project": "Federated Learning for Rare Variant Classification",
        "description": "Privacy-preserving federated ML network allowing hospitals to collaboratively train variant classifiers without sharing patient data.",
        "category": "Federated ML",
        "prize": "🥇 1st Place",
        "prize_amount": "$10,000",
        "tech_stack": ["Flower", "TensorFlow", "FastAPI", "Docker"],
        "impact": "Deployed across 7 rare disease centers in Europe.",
        "team_size": 4,
        "disease_focus": "Metabolic Disorders",
        "color": "emerald",
    },
    {
        "year": 2022,
        "team": "DysmorPhAI",
        "project": "Facial Dysmorphology Detection via Computer Vision",
        "description": "CNN + attention mechanism trained on 50K+ clinical photographs to detect facial dysmorphic features for 38 rare conditions.",
        "category": "Computer Vision",
        "prize": "🥈 2nd Place",
        "prize_amount": "$7,000",
        "tech_stack": ["TensorFlow", "ResNet-50", "OpenCV", "React Native"],
        "impact": "Achieved 91% sensitivity on held-out Noonan, Marfan, Down syndrome test sets.",
        "team_size": 3,
        "disease_focus": "Syndromic Conditions",
        "color": "blue",
    },
    {
        "year": 2021,
        "team": "PathwayPilot",
        "project": "Rare Disease Pathway Disruption Simulator",
        "description": "Interactive network diffusion simulator showing how a single variant cascades through KEGG/Reactome pathways in real time.",
        "category": "Systems Biology",
        "prize": "🥇 1st Place",
        "prize_amount": "$10,000",
        "tech_stack": ["Python", "NetworkX", "D3.js", "Flask"],
        "impact": "Featured in Nature Reviews Genetics as an educational tool.",
        "team_size": 3,
        "disease_focus": "Mitochondrial Diseases",
        "color": "emerald",
    },
    {
        "year": 2021,
        "team": "ClinQuest",
        "project": "Smart HPO Term Suggester for Clinicians",
        "description": "Context-aware autocomplete tool tightly integrated with EHR systems to suggest HPO terms as physicians type clinical notes.",
        "category": "Clinical NLP",
        "prize": "Best Clinical Impact",
        "prize_amount": "$5,000",
        "tech_stack": ["BioBERT", "HL7 FHIR", "React", "Node.js"],
        "impact": "Integrated into Epic EHR pilot at Stanford Medicine.",
        "team_size": 4,
        "disease_focus": "Rare Neurodevelopmental",
        "color": "orange",
    },
    {
        "year": 2020,
        "team": "ChronoGene",
        "project": "Temporal Disease Progression Digital Twin",
        "description": "Bio-digital twin simulating disease progression from birth through adulthood using patient genomic + longitudinal clinical data.",
        "category": "Digital Twin",
        "prize": "🥇 1st Place",
        "prize_amount": "$8,000",
        "tech_stack": ["Python", "TensorFlow", "Three.js", "FastAPI"],
        "impact": "Concept adopted by 2 pharma companies for trial simulation.",
        "team_size": 5,
        "disease_focus": "Marfan Syndrome / Connective Tissue",
        "color": "emerald",
    },
    {
        "year": 2019,
        "team": "RareNet",
        "project": "Knowledge Graph for Rare Disease Gene-Phenotype Associations",
        "description": "Automated graph construction from PubMed + ClinVar + OMIM, enabling zero-shot gene-disease link prediction.",
        "category": "Knowledge Graph",
        "prize": "🥇 1st Place",
        "prize_amount": "$6,000",
        "tech_stack": ["Neo4j", "spaCy", "BERT", "Flask", "D3.js"],
        "impact": "Open-sourced with 2,400+ GitHub stars; used in 15+ research papers.",
        "team_size": 3,
        "disease_focus": "Rare Genetic Disorders (broad)",
        "color": "emerald",
    },
]


def get_all_winners() -> list:
    return HACKRARE_WINNERS


def get_winners_by_year(year: int) -> list:
    return [w for w in HACKRARE_WINNERS if w["year"] == year]


def get_top_winners() -> list:
    return [w for w in HACKRARE_WINNERS if "1st Place" in w["prize"]]


def get_stats() -> dict:
    years = sorted(set(w["year"] for w in HACKRARE_WINNERS))
    categories = list(set(w["category"] for w in HACKRARE_WINNERS))
    diseases = list(set(w["disease_focus"] for w in HACKRARE_WINNERS))
    return {
        "total_projects": len(HACKRARE_WINNERS),
        "years_covered": years,
        "categories": categories,
        "disease_areas": diseases,
        "first_place_winners": len(get_top_winners()),
    }
