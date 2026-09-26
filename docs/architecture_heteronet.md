# HeteroNet — Temporal Clinical Phenotype Trajectory Modeling

This document details the scientific modeling, mathematical outlier detection, and layered data architecture for the HeteroNet clinical trajectory tracker.

## 1. Scientific Context

Rare genetic diseases often feature dynamic, evolving phenotypes (e.g., progressive neurological decline, periodic metabolic crises). Merely listing phenotypes from a single snapshot is insufficient. HeteroNet constructs a structured temporal representation of clinical symptoms, mapping how Human Phenotype Ontology (HPO) terms fluctuate in severity over time, enabling early detection of divergent, damaging disease progression.

## 2. Layered Architecture: Trajectory & Outlier Analysis

HeteroNet transforms longitudinal, unstructured clinical check-ins into structured, mathematically bounded temporal graphs.

### Layer 1: NLP Phenotype Extraction (The Ingestion Phase)
Unstructured clinical notes are uploaded and parsed into discrete clinical data points.
*   **NLP/NER Application**: The backend extracts exact `HPO Terms` (e.g., "Hypotonia", "Developmental Delay").
*   **Severity Quantification**: Natural language severity descriptors (e.g., "severe", "mild") are heuristically mapped to continuous severity scores $[0, 10]$.
*   **Temporal Tagging**: Phenotypes are anchored to specific clinical `Visit Dates` to ensure chronological integrity.

### Layer 2: Graph Assembly (The Structuring Phase)
The isolated data points are strung together chronologically per patient.
*   **Nodes**: Specific clinical visits containing a vector of active HPO terms and their severities.
*   **Edges**: Time intervals $\Delta t$ between visits.
*   **Vectorization**: A patient's history becomes a time-series matrix where rows are phenotypes, columns are visits, and cells are numerical severity scores.

### Layer 3: Mathematical Outlier Detection (The Analytics Phase)
HeteroNet doesn't just display data; it actively monitors it for concerning divergence. 
We use robust non-parametric statistics (Interquartile Range) rather than mean/standard deviation, as clinical severity data is rarely normally distributed.

1.  **Baseline Extraction**: Over $T$ historic visits, compute the 25th percentile ($Q_1$) and 75th percentile ($Q_3$) severity scores for a given symptom.
2.  **IQR Calculation**: $\mathrm{IQR} = Q_3 - Q_1$
3.  **Upper Threshold Limit**: $T_{critical} = Q_3 + 1.5 \times \mathrm{IQR}$
4.  **Divergence Check**: If the severity score $S_{current}$ at visit time $T_{current} > T_{critical}$, the system explicitly flags the phenotype as a **Critical Outlier**.
    *   *Biological Meaning*: A symptom has drastically worsened far beyond the patient's normal chronic baseline, indicating potential disease progression or a new intercurrent illness.

### Layer 4: Clinical Presentation (The UI Layer)
The presentation layer is custom-built to ensure dense, low-latency rendering of temporal data for clinical utility.
*   **Dual-View Mode**: Data is rendered in both a Timeline (SVG line graphs for trajectory shape) and a Matrix (dense tabular HPO comparison for multi-symptom view).
*   **Strict Color Typology**: A clinical palette with only critical accents ensures visual clarity. Amber signals a rising trend; Deep Red visually screams "Outlier Detected" matching the mathematical flag from Layer 3.

## 3. Tech Stack & Scalability

*   **Extraction**: Light NLP heuristic pipelines for HPO mapping, extensible to advanced LLM extraction models if desired.
*   **Processing**: Strictly NumPy based time-series processing ensuring near-zero latency even for patients with dozens of longitudinal visits spanning years.
*   **Storage**: Time-series JSON mapping tied deterministically to the `patientId`, allowing constant time $O(1)$ lookups per patient profile.
