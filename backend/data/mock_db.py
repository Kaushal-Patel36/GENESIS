from typing import Dict, List
from ..models import HPOPhenotype, Gene, Disease, Variant

# --- Mock Data Sources (Trusted Subsets) ---

# 1. HPO Phenotypes
HPO_DB: Dict[str, HPOPhenotype] = {
    "HP:0000098": HPOPhenotype(id="HP:0000098", label="Tall stature"),
    "HP:0001166": HPOPhenotype(id="HP:0001166", label="Arachnodactyly", description="Long, slender fingers"),
    "HP:0001083": HPOPhenotype(id="HP:0001083", label="Ectopia lentis", description="Dislocation of the lens"),
    "HP:0002650": HPOPhenotype(id="HP:0002650", label="Scoliosis"),
    "HP:0001270": HPOPhenotype(id="HP:0001270", label="Motor delay"),
    "HP:0032909": HPOPhenotype(id="HP:0032909", label="Intellectual disability, severe"),
    "HP:0001263": HPOPhenotype(id="HP:0001263", label="Global developmental delay"),
    "HP:0001252": HPOPhenotype(id="HP:0001252", label="Hypotonia"),
    "HP:0001511": HPOPhenotype(id="HP:0001511", label="Intrauterine growth retardation"),
}

# 2. Genes
GENE_DB: Dict[str, Gene] = {
    "FBN1": Gene(symbol="FBN1", name="Fibrillin 1", chromosome="15", description="Encodes fibrillin-1, a major structural component of microfibrils."),
    "FGFR3": Gene(symbol="FGFR3", name="Fibroblast Growth Factor Receptor 3", chromosome="4", description="Plays a role in bone development and maintenance."),
    "CFTR": Gene(symbol="CFTR", name="Cystic Fibrosis Transmembrane Conductance Regulator", chromosome="7", description="Function as a chloride channel."),
    "MECP2": Gene(symbol="MECP2", name="Methyl-CpG Binding Protein 2", chromosome="X", description="Essential for nerve cell function."),
}

# 3. Diseases (OMIM / Orphanet Stubs)
DISEASE_DB: Dict[str, Disease] = {
    "OMIM:154700": Disease(id="OMIM:154700", name="Marfan Syndrome", associated_genes=["FBN1"]),
    "OMIM:100100": Disease(id="OMIM:100100", name="Achondroplasia", associated_genes=["FGFR3"]),
    "OMIM:219700": Disease(id="OMIM:219700", name="Cystic Fibrosis", associated_genes=["CFTR"]),
    "OMIM:312750": Disease(id="OMIM:312750", name="Rett Syndrome", associated_genes=["MECP2"]),
}

# 4. Gene-Phenotype Associations (Knowledge Graph Edges)
# Format: Gene -> [HPO Term IDs] (Simplified: usually Disease->Phenotype, but mapping Gene->Phenotype for reasoning shortcut)
GENE_PHENOTYPE_MAP: Dict[str, List[str]] = {
    "FBN1": ["HP:0000098", "HP:0001166", "HP:0001083", "HP:0002650"], # Marfan
    "MECP2": ["HP:0001270", "HP:0032909", "HP:0001263", "HP:0001252"], # Rett
}

# 5. ClinVar Variant Annotations (Mock)
CLINVAR_MOCK_DB: Dict[str, str] = {
    "chr15:g.48712345C>T": "Pathogenic",  # Mock FBN1 variant
    "chr15:g.48712346G>A": "Benign",
    "chr4:g.1802345A>C": "Pathogenic",    # Mock FGFR3
}

# 6. Reactome Pathways (Mock)
PATHWAY_DB: Dict[str, List[str]] = {
    "FBN1": ["R-HSA-123456: ECM Organization", "R-HSA-789012: Elastic fibre formation"],
    "FGFR3": ["R-HSA-345678: Signaling by FGFR3", "R-HSA-901234: MAPK signaling"],
    "MECP2": ["R-HSA-567890: Neuronal System", "R-HSA-123789: Chromatin organization"],
}
