from typing import List, Tuple
from .mock_db import GENE_DB, DISEASE_DB, HPO_DB, GENE_PHENOTYPE_MAP, PATHWAY_DB
from ..models import Gene, Disease, HPOPhenotype, Pathway

class KnowledgeGraph:
    def get_gene(self, symbol: str) -> Gene:
        return GENE_DB.get(symbol)

    def get_disease_for_gene(self, gene_symbol: str) -> Disease:
        # Simplified: find first disease with this gene
        for disease in DISEASE_DB.values():
            if gene_symbol in disease.associated_genes:
                return disease
        return None

    def get_associated_phenotypes(self, gene_symbol: str) -> List[HPOPhenotype]:
        hpo_ids = GENE_PHENOTYPE_MAP.get(gene_symbol, [])
        return [HPO_DB[pid] for pid in hpo_ids if pid in HPO_DB]

    def get_pathways(self, gene_symbol: str) -> List[Pathway]:
        raw_pathways = PATHWAY_DB.get(gene_symbol, [])
        # raw format "ID: Name"
        pathways = []
        for p in raw_pathways:
            parts = p.split(": ")
            if len(parts) == 2:
                pathways.append(Pathway(id=parts[0], name=parts[1].strip()))
        return pathways

    def get_all_genes(self) -> List[str]:
        return list(GENE_DB.keys())
    
    def search_phenotypes_by_name(self, query: str) -> List[HPOPhenotype]:
        matches = []
        q = query.lower()
        for p in HPO_DB.values():
            if q in p.label.lower():
                matches.append(p)
        return matches

KG = KnowledgeGraph()
