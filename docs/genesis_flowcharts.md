# Genesis Intelligence – 6 Core Module Flowcharts

This document provides 6 individual, highly detailed architectural flowcharts for each independent exploration module within the Genesis platform. Each chart specifically delineates the Input, Processing Layers, and Output for that specific feature.

---

## 1. MIRA (Morphological Image Recognition & Analysis)
**Function:** Extracts and matches subtle facial dysmorphology against established clinical syndrome archetypes using Siamese network topology.

```mermaid
graph TD
    %% MIRA Inputs
    subgraph INPUTS ["Input Layer"]
        IMG(["Raw 2D Patient Face Image <br> JPEG/PNG Upload"])
    end

    %% MIRA Layers
    subgraph LAYERS ["Siamese Latent Mapping Layers"]
        IMG -->|"MediaPipe Engine"| LMK["Facial Landmark Extraction <br> 468 [x,y,z] Coordinate Tensors"]
        
        LMK --> GEO["Geometric Calculation Layer <br> 8 Craniofacial Ratios e.g. fWHR <br> 12 Behavioral Action Units e.g. AU6"]
        
        GEO --> VEC["Feature Assembly <br> Phenotype Tensor: R^20"]
        
        VEC --> NORM["L2 Normalization Layer <br> X.norm = X / |X|_2"]
        
        NORM --> FAISS{"FAISS Similarity Search <br> IndexFlatIP (Inner Product)"}
        DB[("Syndrome Prototype DB <br> 400+ Normalized Vectors")] --> FAISS
    end

    %% MIRA Outputs
    subgraph OUTPUTS ["Output Layer"]
        FAISS -->|"Cosine Similarity Matrix"| RANKED{{"Top K Ranked Syndrome Probabilities <br> Gestalt Confidence Percentage"}}
    end

    classDef in fill:#2d3f4e,stroke:#7aa2f7,color:#fff;
    classDef lay fill:#3d2f4a,stroke:#bb9af7,color:#fff;
    classDef out fill:#4f2f35,stroke:#f7768e,color:#fff;

    class IMG in;
    class LMK,GEO,VEC,NORM,FAISS,DB lay;
    class RANKED out;
```

---

## 2. EpistaLink (Genomic Interaction Detection)
**Function:** Decomposes non-linear, epistatic variant-variant interactions combining structural proximity and bidirectional attention to flag synergistic loss or gain of function.

```mermaid
graph TD
    %% EpistaLink Inputs
    subgraph INPUTS ["Input Layer"]
        V1(["Variant 1 <br> e.g. FBN1 Cys1361Tyr"])
        V2(["Variant 2 <br> e.g. FBN1 Ile1770Thr"])
        STR(["AlphaFold 3D Euclidean Proximity <br> & Domain SASA Index"])
    end

    %% EpistaLink Layers
    subgraph LAYERS ["Tensor Algebra Layers"]
        V1 -->|"Domain Gating"| E1["Token Embedding Layer <br> R^64 Vector"]
        V2 -->|"Domain Gating"| E2["Token Embedding Layer <br> R^64 Vector"]
        
        E1 -->|"Wq, Wk, Wv Projections"| ATT["Bidirectional Cross-Attention Layer <br> QK^T / sqrt(d_k)"]
        E2 -->|"Wq, Wk, Wv Projections"| ATT
        
        ATT -->|"Spatial Interaction Bias"| SPARSE["Sparse Autoencoder Projection <br> ReLu Mapping to Biological Functions"]
        STR --> SPARSE
        
        SPARSE --> HYP["Hyperbolic Transformation Layer <br> Metric: 10 * tanh(F/a)"]
    end

    %% EpistaLink Outputs
    subgraph OUTPUTS ["Output Layer"]
        HYP --> E_SCORE{{"Epistatic Interaction Output <br> Bounded [-10 to +10] Score"}}
    end

    classDef in fill:#2d3f4e,stroke:#7aa2f7,color:#fff;
    classDef lay fill:#3d2f4a,stroke:#bb9af7,color:#fff;
    classDef out fill:#4f2f35,stroke:#f7768e,color:#fff;

    class V1,V2,STR in;
    class E1,E2,ATT,SPARSE,HYP lay;
    class E_SCORE out;
```

---

## 3. HeteroNet (Temporal Disease Trajectory)
**Function:** Codifies longitudinal clinical text into tracked severity matrices, using robust statistics (IQR) to flag immediate outlier deterioration in complex rare diseases like Cardiac Heterotaxy.

```mermaid
graph TD
    %% HeteroNet Inputs
    subgraph INPUTS ["Temporal Data Ingestion"]
        N1(["Initial Consult Note <br> Time: T-0"])
        N2(["Follow-up Consult <br> Time: T+1"])
        N3(["Current Visit <br> Time: T+2"])
    end

    %% HeteroNet Layers
    subgraph LAYERS ["Trajectory Math Layers"]
        N1 --> NLP["NLP Ontological Parser <br> Maps Text to HPO Terms + Severity Scores"]
        N2 --> NLP
        N3 --> NLP
        
        NLP --> BASE["Historical Baseline Engine <br> Calculates 25th Q1 and 75th Q3 percentiles"]
        BASE --> IQR["Trajectory Variance calculation <br> IQR = Q3 - Q1"]
        
        IQR --> THRESH{"Divergence Check <br> Is Current Severity > Q3 + 1.5 * IQR?"}
    end

    %% HeteroNet Outputs
    subgraph OUTPUTS ["UI Flagging"]
        THRESH -->|No| SAFE{{"Symptom Stasis <br> Normal Phenotypic Fluctuation"}}
        THRESH -->|Yes| ALERT{{"Critical Escalation <br> Deterioration Outlier Flag"}}
    end

    classDef in fill:#2d3f4e,stroke:#7aa2f7,color:#fff;
    classDef lay fill:#3d2f4a,stroke:#bb9af7,color:#fff;
    classDef s fill:#1a4d33,stroke:#26e07f,color:#fff;
    classDef a fill:#4f2f35,stroke:#f7768e,color:#fff;

    class N1,N2,N3 in;
    class NLP,BASE,IQR,THRESH lay;
    class SAFE s;
    class ALERT a;
```

---

## 4. AnthropicX (Unified Bayesian Inference Engine)
**Function:** The central "brain" of genesis. Fuses independent modality probabilities onto a geometric Stiefel manifold to calculate a mathematically cohesive diagnosis.

```mermaid
graph TD
    %% AnthropicX Inputs
    subgraph INPUTS ["Independent Modality Probabilities"]
        P_M(["P_Gestalt | Disease <br> From MIRA"])
        P_E(["P_Epistasis | Trait <br> From EpistaLink"])
        P_H(["P_Trajectory | Escalation <br> From HeteroNet"])
    end

    %% AnthropicX Layers
    subgraph LAYERS ["Spectral Fusion Layers"]
        P_M --> ADJ["Adjacency Matrix Construction <br> Bipartite Gene-Phenotype Graph"]
        P_E --> ADJ
        P_H --> ADJ
        
        ADJ --> LAP["Graph Laplacian Matrix Formulation <br> L = D - A"]
        
        LAP --> EIG["Eigen decomposition <br> Extraction of Fiedler Vector"]
        
        EIG --> BAYES["Bayesian Posterior Update <br> P(D | M, E, H)"]
    end

    %% AnthropicX Outputs
    subgraph OUTPUTS ["Output Layer"]
        BAYES --> RANKED{{"Final Diagnostic Attractor Space <br> Ranked Unified Diagnoses"}}
    end

    classDef in fill:#2d3f4e,stroke:#7aa2f7,color:#fff;
    classDef lay fill:#3d2f4a,stroke:#bb9af7,color:#fff;
    classDef out fill:#4f2f35,stroke:#f7768e,color:#fff;

    class P_M,P_E,P_H in;
    class ADJ,LAP,EIG,BAYES lay;
    class RANKED out;
```

---

## 5. Knowledge Explorer & Literature Mining
**Function:** Binds extracted symptoms and potential diagnoses to live PubMed and Reactome databases, establishing an interactive, verifiable chain of evidence.

```mermaid
graph TD
    %% Knowledge Inputs
    subgraph INPUTS ["Input Layer"]
        HPO(["Extracted Patient <br> HPO Phenotypes"])
        GENE(["Candidate Genes <br> from AnthropicX"])
    end

    %% Knowledge Layers
    subgraph LAYERS ["API & Mining Layers"]
        HPO --> ONT["Ontological Cross-reference <br> Orphanet & OMIM Mapping"]
        GENE --> ONT
        
        ONT --> PUBMED["PubMed Crawler API <br> BM25 Term Relevance Scoring"]
        ONT --> PATH["Reactome API <br> Biochemical Pathway Extraction"]
        
        PUBMED --> GRAPH["Force-Directed Graph Compilation <br> D3/Sigma.js Layout Engine"]
        PATH --> GRAPH
    end

    %% Knowledge Outputs
    subgraph OUTPUTS ["Output Layer"]
        GRAPH --> EXPLORE{{"Interactive 3D Evidence Network <br> with Verifiable Citation Links"}}
    end

    classDef in fill:#2d3f4e,stroke:#7aa2f7,color:#fff;
    classDef lay fill:#3d2f4a,stroke:#bb9af7,color:#fff;
    classDef out fill:#4f2f35,stroke:#f7768e,color:#fff;

    class HPO,GENE in;
    class ONT,PUBMED,PATH,GRAPH lay;
    class EXPLORE out;
```

---

## 6. Target-Pathway Drug Repurposing
**Function:** Matches the biochemically unraveled etiology (pathogenic pathways) against molecular affinities of FDA-approved compounds to suggest targeted clinical treatments.

```mermaid
graph TD
    %% Drug Inputs
    subgraph INPUTS ["Etiological Inputs"]
        ETIOLOGY(["Hyperactive/Suppressed Pathways <br> From EpistaLink & Reactome"])
        DIAG(["Top Candidate Disease <br> From AnthropicX"])
    end

    %% Drug Layers
    subgraph LAYERS ["Pharmacological Search Layers"]
        DIAG --> STOC["Standard of Care Retrieval <br> Approved Clinical Guidelines"]
        
        ETIOLOGY --> AFFIN["FDA Molecular Target Matrix <br> Inverse Affinity Matching"]
        
        AFFIN --> REPURP["Off-Label Repurposing Engine <br> Mechanism-of-Action Alignment"]
        
        REPURP --> TOX["Contraindication Filter <br> Safety vs. Patient Phenotypes"]
        STOC --> TOX
    end

    %% Drug Outputs
    subgraph OUTPUTS ["Output Layer"]
        TOX --> RX{{"Synthesized Treatment Strategy <br> Approved & Off-Label Candidates"}}
    end

    classDef in fill:#2d3f4e,stroke:#7aa2f7,color:#fff;
    classDef lay fill:#3d2f4a,stroke:#bb9af7,color:#fff;
    classDef out fill:#4f2f35,stroke:#f7768e,color:#fff;

    class ETIOLOGY,DIAG in;
    class STOC,AFFIN,REPURP,TOX lay;
    class RX out;
```
