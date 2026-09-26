"""
Dynamic Pathway Perturbation Engine
======================================
Models how patient-specific variants destabilize biological networks over time
using network diffusion and graph-based message passing.

Key innovation: Dynamic network destabilization modeling rather than static
association scoring. Computes pathway disruption scores, temporal cascade
progression, and auto-generates clinician-ready interpretations.

Architecture:
    1. Build gene interaction graph from PATHWAY_DB + GENE_INTERACTION_DB
    2. Compute graph Laplacian L
    3. Apply heat diffusion kernel H = exp(-βL) from variant source nodes
    4. Score per-pathway disruption via centrality shifts + heat accumulation
    5. Model temporal cascade via iterative diffusion with increasing β
    6. Generate clinical interpretation from top disrupted pathways

Requires: numpy, scipy (already installed)
"""

import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from collections import defaultdict
import math

try:
    from scipy.linalg import expm
    from scipy.sparse import csr_matrix
    from scipy.sparse.linalg import eigsh
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

from data.enhanced_mock_db import (
    GENE_DB, DISEASE_DB, PATHWAY_DB, GENE_PHENOTYPE_MAP,
    DRUG_DB, CLINVAR_MOCK_DB
)

# ---------------------------------------------------------------------------
# Gene-gene interaction network (biologically grounded)
# ---------------------------------------------------------------------------
GENE_INTERACTION_DB: Dict[Tuple[str, str], Dict[str, Any]] = {
    # Connective tissue / ECM cluster
    ("FBN1", "TGFBR1"):  {"weight": 0.90, "mechanism": "TGF-β sequestration via fibrillin-1 microfibrils"},
    ("FBN1", "TGFBR2"):  {"weight": 0.85, "mechanism": "TGF-β pathway regulation through ECM binding"},
    ("TGFBR1", "TGFBR2"): {"weight": 0.95, "mechanism": "Receptor heterodimerization for TGF-β signaling"},
    ("FBN1", "COL3A1"):  {"weight": 0.70, "mechanism": "ECM structural co-dependency"},
    ("COL3A1", "TGFBR1"): {"weight": 0.55, "mechanism": "Collagen-TGF-β feedback loop"},
    ("COL3A1", "TGFBR2"): {"weight": 0.50, "mechanism": "ECM-mediated TGF-β availability"},

    # Skeletal / growth factor cluster
    ("FGFR3", "TGFBR1"): {"weight": 0.45, "mechanism": "Cross-talk between FGF and TGF-β signaling"},
    ("FGFR3", "TGFBR2"): {"weight": 0.40, "mechanism": "MAPK/SMAD pathway convergence"},

    # Cardiac cluster
    ("MYH7", "MYBPC3"):  {"weight": 0.90, "mechanism": "Sarcomere thick filament co-assembly"},
    ("MYH7", "TNNT2"):   {"weight": 0.85, "mechanism": "Sarcomere contractile coupling"},
    ("MYBPC3", "TNNT2"):  {"weight": 0.80, "mechanism": "Myofilament regulatory interaction"},
    ("MYH7", "LMNA"):    {"weight": 0.45, "mechanism": "Cardiomyopathy shared pathophysiology"},
    ("LMNA", "DMD"):     {"weight": 0.35, "mechanism": "Nuclear envelope–dystrophin axis in striated muscle"},

    # Neurological cluster
    ("MECP2", "SCN1A"):  {"weight": 0.40, "mechanism": "Epigenetic regulation of sodium channel expression"},
    ("MECP2", "CDKL5"):  {"weight": 0.65, "mechanism": "Shared MECP2 chromatin pathway — X-linked"},
    ("SCN1A", "CDKL5"):  {"weight": 0.35, "mechanism": "Seizure network — ion channel × kinase"},
    ("SCN1A", "TSC1"):   {"weight": 0.30, "mechanism": "Epilepsy network co-morbidity"},
    ("TSC1", "TSC2"):    {"weight": 0.95, "mechanism": "Direct protein complex (hamartin-tuberin)"},

    # Metabolic/lysosomal cluster
    ("GBA", "GAA"):      {"weight": 0.55, "mechanism": "Lysosomal enzyme co-regulation"},
    ("IDUA", "GAA"):     {"weight": 0.50, "mechanism": "Lysosomal storage pathway overlap"},
    ("IDUA", "GBA"):     {"weight": 0.45, "mechanism": "MPS/Gaucher lysosomal cross-talk"},

    # Neuromuscular cluster
    ("DMD", "SMN1"):     {"weight": 0.40, "mechanism": "Motor neuron–muscle fiber axis"},
    ("DMD", "MYH7"):     {"weight": 0.50, "mechanism": "Striated muscle structural proteins"},

    # mTOR–cardiac
    ("TSC1", "LMNA"):    {"weight": 0.30, "mechanism": "mTOR–nuclear lamina signaling"},
    ("TSC2", "FGFR3"):   {"weight": 0.25, "mechanism": "mTOR–MAPK growth factor cross-talk"},

    # CFTR cross-link
    ("CFTR", "GAA"):     {"weight": 0.20, "mechanism": "Epithelial ion channel–lysosomal axis"},

    # Repeat expansion cluster
    ("HTT", "DMPK"):     {"weight": 0.35, "mechanism": "Trinucleotide repeat expansion pathophysiology"},
    ("HTT", "MECP2"):    {"weight": 0.25, "mechanism": "Neurodegeneration–epigenetic interface"},
}


class PathwayPerturbationEngine:
    """
    Models how patient-specific variants propagate disruption through
    biological networks using heat diffusion on the gene interaction graph.
    """

    def __init__(self):
        self.genes: List[str] = []
        self.gene_to_idx: Dict[str, int] = {}
        self.adj_matrix: Optional[np.ndarray] = None
        self.laplacian: Optional[np.ndarray] = None
        self.pathway_genes: Dict[str, List[str]] = {}  # pathway_id → [genes]
        self.pathway_names: Dict[str, str] = {}         # pathway_id → name

        self._build_network()
        print(f"  ✓ Pathway Perturbation Engine: {len(self.genes)} nodes, "
              f"{len(GENE_INTERACTION_DB)} interactions, "
              f"{len(self.pathway_genes)} pathways")

    def _build_network(self):
        """Build gene interaction graph and compute Laplacian."""
        # Collect all genes
        gene_set = set()
        for g in GENE_DB:
            gene_set.add(g)
        for (g1, g2) in GENE_INTERACTION_DB:
            gene_set.add(g1)
            gene_set.add(g2)

        self.genes = sorted(gene_set)
        self.gene_to_idx = {g: i for i, g in enumerate(self.genes)}
        N = len(self.genes)

        # Adjacency matrix
        self.adj_matrix = np.zeros((N, N), dtype=np.float64)
        for (g1, g2), info in GENE_INTERACTION_DB.items():
            i, j = self.gene_to_idx.get(g1), self.gene_to_idx.get(g2)
            if i is not None and j is not None:
                w = info["weight"]
                self.adj_matrix[i, j] = w
                self.adj_matrix[j, i] = w

        # Also add weak edges from shared pathways (not in interaction DB)
        for gene, pathways in PATHWAY_DB.items():
            for other_gene, other_pathways in PATHWAY_DB.items():
                if gene != other_gene:
                    i = self.gene_to_idx.get(gene)
                    j = self.gene_to_idx.get(other_gene)
                    if i is not None and j is not None and self.adj_matrix[i, j] == 0:
                        shared = set()
                        gene_pids = {p.split(":")[0].strip().split(" ")[0] for p in pathways}
                        other_pids = {p.split(":")[0].strip().split(" ")[0] for p in other_pathways}
                        shared = gene_pids & other_pids
                        if shared:
                            w = min(len(shared) * 0.15, 0.4)
                            self.adj_matrix[i, j] = w
                            self.adj_matrix[j, i] = w

        # Degree matrix and Laplacian: L = D - A
        degree = np.diag(self.adj_matrix.sum(axis=1))
        self.laplacian = degree - self.adj_matrix

        # Build pathway → gene mapping
        for gene, pathways in PATHWAY_DB.items():
            for p_str in pathways:
                parts = p_str.split(": ", 1)
                if len(parts) == 2:
                    pid, pname = parts
                    self.pathway_names[pid] = pname
                    if pid not in self.pathway_genes:
                        self.pathway_genes[pid] = []
                    if gene not in self.pathway_genes[pid]:
                        self.pathway_genes[pid].append(gene)

    def _heat_diffusion(self, source_genes: List[str], beta: float = 1.0) -> np.ndarray:
        """
        Apply heat diffusion kernel: h = exp(-β * L) · s
        where s is the initial heat vector (1.0 at variant source nodes).
        """
        N = len(self.genes)
        s = np.zeros(N)
        for g in source_genes:
            idx = self.gene_to_idx.get(g)
            if idx is not None:
                s[idx] = 1.0

        if HAS_SCIPY and N <= 200:
            # Matrix exponential for exact diffusion
            H = expm(-beta * self.laplacian)
            heat = H @ s
        else:
            # Approximation via truncated eigendecomposition
            # h ≈ Σ exp(-β·λ_k) · (v_k^T · s) · v_k
            k = min(N - 1, 20)
            if k < 1:
                return s
            eigenvalues, eigenvectors = np.linalg.eigh(self.laplacian)
            heat = np.zeros(N)
            for i in range(min(k, len(eigenvalues))):
                coeff = np.dot(eigenvectors[:, i], s)
                heat += np.exp(-beta * eigenvalues[i]) * coeff * eigenvectors[:, i]

        # Normalize to [0, 1]
        max_heat = heat.max()
        if max_heat > 0:
            heat = heat / max_heat

        return np.clip(heat, 0, 1)

    def _compute_centrality(self, adj: np.ndarray) -> np.ndarray:
        """Compute degree centrality for each node."""
        return adj.sum(axis=1) / max(adj.sum(), 1e-8)

    def _compute_betweenness_approx(self, adj: np.ndarray) -> np.ndarray:
        """Approximate betweenness centrality using eigenvector centrality."""
        N = adj.shape[0]
        # Power iteration for dominant eigenvector
        x = np.ones(N) / N
        for _ in range(50):
            x_new = adj @ x
            norm = np.linalg.norm(x_new)
            if norm > 0:
                x_new = x_new / norm
            x = x_new
        return x

    def compute_perturbation(
        self, gene_symbol: str, patient_hpo_ids: List[str] = None
    ) -> Dict[str, Any]:
        """
        Compute full pathway perturbation analysis for a gene.

        Returns disrupted pathways, cascade graph, temporal stages,
        and clinical interpretation.
        """
        gene_symbol = gene_symbol.upper()

        # Find variant source genes (the mutated gene + directly connected)
        source_genes = [gene_symbol] if gene_symbol in self.gene_to_idx else []
        if not source_genes:
            return self._empty_result(gene_symbol)

        # ------------------------------------------------------------------
        # 1. HEAT DIFFUSION — propagate variant disruption
        # ------------------------------------------------------------------
        heat = self._heat_diffusion(source_genes, beta=1.5)

        # ------------------------------------------------------------------
        # 2. CENTRALITY ANALYSIS — before/after variant knockout
        # ------------------------------------------------------------------
        centrality_before = self._compute_betweenness_approx(self.adj_matrix)

        # Simulate knockout: zero out edges from variant gene
        adj_knockout = self.adj_matrix.copy()
        src_idx = self.gene_to_idx[gene_symbol]
        adj_knockout[src_idx, :] = 0
        adj_knockout[:, src_idx] = 0
        centrality_after = self._compute_betweenness_approx(adj_knockout)

        centrality_shift = np.abs(centrality_before - centrality_after)

        # ------------------------------------------------------------------
        # 3. PATHWAY DISRUPTION SCORES
        # ------------------------------------------------------------------
        disrupted_pathways = []
        for pid, pgenes in self.pathway_genes.items():
            gene_indices = [self.gene_to_idx[g] for g in pgenes if g in self.gene_to_idx]
            if not gene_indices:
                continue

            # Pathway disruption = weighted combination
            path_heat = np.mean([heat[i] for i in gene_indices])
            path_centrality = np.mean([centrality_shift[i] for i in gene_indices])
            connectivity_loss = 0
            for i in gene_indices:
                if i == src_idx:
                    connectivity_loss += 1.0
                    continue
                original_conn = self.adj_matrix[src_idx, i]
                connectivity_loss += original_conn

            connectivity_loss = min(connectivity_loss / max(len(gene_indices), 1), 1.0)

            disruption_score = (
                0.45 * path_heat +
                0.30 * path_centrality +
                0.25 * connectivity_loss
            )

            disrupted_pathways.append({
                "pathway_id": pid,
                "pathway_name": self.pathway_names.get(pid, pid),
                "disruption_score": round(float(disruption_score), 4),
                "affected_genes": [g for g in pgenes if heat[self.gene_to_idx.get(g, 0)] > 0.05],
                "centrality_shift": round(float(path_centrality), 4),
                "heat_accumulation": round(float(path_heat), 4),
            })

        disrupted_pathways.sort(key=lambda x: x["disruption_score"], reverse=True)

        # ------------------------------------------------------------------
        # 4. CASCADE GRAPH (nodes + edges for visualization)
        # ------------------------------------------------------------------
        cascade_nodes = []
        cascade_edges = []
        threshold = 0.03  # Include nodes with heat > 3%

        active_genes = set()
        for i, g in enumerate(self.genes):
            if heat[i] > threshold:
                active_genes.add(g)
                # Find which pathways this gene belongs to
                gene_pathways = []
                for pid, pgenes in self.pathway_genes.items():
                    if g in pgenes:
                        gene_pathways.append(pid)

                cascade_nodes.append({
                    "gene": g,
                    "heat_score": round(float(heat[i]), 4),
                    "is_variant_source": g == gene_symbol,
                    "pathways": gene_pathways[:3],
                    "influence_score": round(float(heat[i] * centrality_before[i]), 4),
                })

        # Edges between active genes
        for (g1, g2), info in GENE_INTERACTION_DB.items():
            if g1 in active_genes and g2 in active_genes:
                # Find shared pathway
                g1_pathways = set()
                g2_pathways = set()
                for pid, pgenes in self.pathway_genes.items():
                    if g1 in pgenes:
                        g1_pathways.add(pid)
                    if g2 in pgenes:
                        g2_pathways.add(pid)
                shared = g1_pathways & g2_pathways
                pathway_label = list(shared)[0] if shared else (
                    list(g1_pathways)[0] if g1_pathways else "interaction"
                )

                cascade_edges.append({
                    "source": g1,
                    "target": g2,
                    "weight": round(float(info["weight"]), 3),
                    "pathway": pathway_label,
                    "mechanism": info.get("mechanism", ""),
                })

        # ------------------------------------------------------------------
        # 5. TEMPORAL PROGRESSION (3 stages with increasing diffusion)
        # ------------------------------------------------------------------
        temporal_stages = []
        stage_configs = [
            {"stage": "early", "label": "0–6 months", "beta": 0.5},
            {"stage": "mid",   "label": "6–24 months", "beta": 1.5},
            {"stage": "late",  "label": "2–5+ years",  "beta": 3.0},
        ]

        for cfg in stage_configs:
            stage_heat = self._heat_diffusion(source_genes, beta=cfg["beta"])

            active_pathway_ids = []
            stage_genes = []
            for i, g in enumerate(self.genes):
                if stage_heat[i] > 0.1:
                    stage_genes.append(g)
                    for pid, pgenes in self.pathway_genes.items():
                        if g in pgenes and pid not in active_pathway_ids:
                            active_pathway_ids.append(pid)

            instability = float(np.mean(stage_heat[stage_heat > 0.05])) if np.any(stage_heat > 0.05) else 0.0

            temporal_stages.append({
                "stage": cfg["stage"],
                "time_label": cfg["label"],
                "active_pathways": active_pathway_ids[:6],
                "cascade_genes": stage_genes[:10],
                "network_instability": round(instability, 4),
            })

        # ------------------------------------------------------------------
        # 6. OVERALL INSTABILITY METRIC
        # ------------------------------------------------------------------
        overall_instability = float(np.mean(heat[heat > 0.05])) if np.any(heat > 0.05) else 0.0

        # ------------------------------------------------------------------
        # 7. CLINICAL INTERPRETATION
        # ------------------------------------------------------------------
        clinical_summary, treatment_hints = self._generate_clinical_interpretation(
            gene_symbol, disrupted_pathways, cascade_nodes, temporal_stages
        )

        return {
            "gene": gene_symbol,
            "disrupted_pathways": disrupted_pathways,
            "temporal_stages": temporal_stages,
            "cascade_nodes": cascade_nodes,
            "cascade_edges": cascade_edges,
            "overall_instability": round(overall_instability, 4),
            "clinical_summary": clinical_summary,
            "treatment_hints": treatment_hints,
        }

    def _generate_clinical_interpretation(
        self,
        gene_symbol: str,
        disrupted_pathways: List[Dict],
        cascade_nodes: List[Dict],
        temporal_stages: List[Dict],
    ) -> Tuple[str, List[str]]:
        """Auto-generate clinician-focused explanation."""

        if not disrupted_pathways:
            return (
                f"Variant in {gene_symbol}: Limited pathway connectivity detected. "
                "Further functional studies recommended.",
                ["Consider whole-genome sequencing for non-coding regulatory effects"]
            )

        top_pathway = disrupted_pathways[0]
        top_driver = max(cascade_nodes, key=lambda n: n["influence_score"]) if cascade_nodes else None

        # Downstream effect from temporal progression
        late_stage = temporal_stages[-1] if temporal_stages else None
        late_genes = late_stage["cascade_genes"] if late_stage else []
        downstream_count = len(late_genes) - 1  # exclude source

        summary_parts = [
            f"Variant in {gene_symbol} causes primary disruption to "
            f"{top_pathway['pathway_name']} (disruption score: {top_pathway['disruption_score']:.1%}).",
        ]

        if top_driver and top_driver["gene"] != gene_symbol:
            summary_parts.append(
                f"Central downstream gene driver: {top_driver['gene']} "
                f"(influence: {top_driver['influence_score']:.3f})."
            )

        if downstream_count > 0:
            summary_parts.append(
                f"Predicted to affect {downstream_count} additional genes by late stage, "
                f"with network instability reaching {temporal_stages[-1]['network_instability']:.1%}."
            )

        clinical_summary = " ".join(summary_parts)

        # Treatment hints
        treatment_hints = []

        # Check if any disrupted pathway has targetable drugs
        gene_data = GENE_DB.get(gene_symbol)
        if gene_data:
            for disease_id, drugs in DRUG_DB.items():
                disease = DISEASE_DB.get(disease_id)
                if disease and gene_symbol in disease.associated_genes:
                    for drug in drugs[:2]:
                        treatment_hints.append(
                            f"{drug['name']} ({drug['type']}): {drug['mechanism']}"
                        )

        # Pathway-targetable mechanisms
        for pw in disrupted_pathways[:2]:
            pname = pw["pathway_name"].lower()
            if "tgf" in pname:
                treatment_hints.append(
                    "TGF-β pathway inhibitors (e.g., losartan) may reduce downstream signaling disruption"
                )
            elif "mtor" in pname:
                treatment_hints.append(
                    "mTOR pathway inhibitors (e.g., everolimus/sirolimus) target this disrupted axis"
                )
            elif "mapk" in pname or "fgf" in pname:
                treatment_hints.append(
                    "MAPK/FGF pathway modulators may address growth factor signaling destabilization"
                )
            elif "muscle" in pname or "contraction" in pname:
                treatment_hints.append(
                    "Cardiac-protective agents (ACE inhibitors, beta-blockers) may mitigate sarcomere disruption"
                )
            elif "lysosom" in pname:
                treatment_hints.append(
                    "Enzyme replacement therapy (ERT) or substrate reduction therapy targets lysosomal pathway"
                )

        if not treatment_hints:
            treatment_hints.append(
                "No pathway-specific targeted therapies identified; consider functional genomics studies"
            )

        return clinical_summary, treatment_hints[:4]

    def _empty_result(self, gene_symbol: str) -> Dict[str, Any]:
        return {
            "gene": gene_symbol,
            "disrupted_pathways": [],
            "temporal_stages": [],
            "cascade_nodes": [],
            "cascade_edges": [],
            "overall_instability": 0.0,
            "clinical_summary": f"Gene {gene_symbol} not found in interaction network.",
            "treatment_hints": [],
        }

    def get_disruption_score(self, gene_symbol: str) -> float:
        """Quick disruption score for integration with main scoring engine."""
        gene_symbol = gene_symbol.upper()
        if gene_symbol not in self.gene_to_idx:
            return 0.0

        heat = self._heat_diffusion([gene_symbol], beta=1.5)
        return float(np.mean(heat[heat > 0.05])) if np.any(heat > 0.05) else 0.0

    def get_model_info(self) -> Dict[str, Any]:
        return {
            "name": "Pathway Perturbation Engine",
            "model_type": "Network Diffusion + Graph Laplacian",
            "capabilities": [
                "Pathway disruption scoring",
                "Temporal cascade modeling",
                "Clinical interpretation",
            ],
            "parameters": len(self.genes) * len(self.genes),  # Laplacian size
            "network_nodes": len(self.genes),
            "network_edges": len(GENE_INTERACTION_DB),
            "pathways_tracked": len(self.pathway_genes),
        }


# Global singleton
perturbation_engine = PathwayPerturbationEngine()
