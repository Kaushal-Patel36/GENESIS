# MIRA — Morphological Image Recognition & Analysis

This document details the scientific context, mathematical formulas, and layered Siamese-architecture of MIRA (Morphological Image Recognition & Analysis).

## 1. Scientific Context & Clinical Reasoning

Many rare genetic, chromosomal, and teratogenic syndromes manifest with consistent, distinct craniofacial dysmorphology ("facial gestalt"). MIRA is designed to digitize these subtle phenotypic signatures into a computational matrix to provide non-invasive differential diagnosis.

Instead of directly classifying an image (which performs poorly on ultra-rare disorders with $n<10$ global cases), MIRA maps the patient's face into a high-dimensional mathematical space and searches for established clinical prototype patterns nearby.

## 2. Layered Architecture: Feature Extraction & Siamese Matching

MIRA's core matching engine relies on a pipeline comprising two distinct machine learning stages: Feature Extraction (Mapping Phase) and Vector Similarity Search (Matching Phase).

### Layer 1: Phenotypic Feature Extraction (The Mapping Phase)
The uploaded 2D image is processed to extract strict, measurable geometric and behavioral attributes, minimizing racial or lighting bias inherent in raw pixel CNNs.

1.  **Landmark Mesh Generation**: 
    *   Using MediaPipe or a deterministic fallback, 468 precise 3D facial landmarks ($x,y,z$) are generated.
2.  **Geometric Ratios (Morphology)**:
    *   Absolute distances vary by camera distance, so MIRA computes **ratios** relative to stable facial anchors (e.g., bizygomatic width or interpupillary distance).
    *   Examples:
        *   $fWHR$ (Facial Width-to-Height Ratio)
        *   $IPD\_ratio$ (Inner Canthal vs Interpupillary Distance)
        *   $Nasal\_width\_ratio$ 
3.  **Action Units (Expression Proxies)**:
    *   Genetic behavioral phenotypes (e.g., Angelman's "happy puppet", ASD's reduced eye contact) modulate facial resting states. 
    *   MIRA computes 12 Facial Action Units (AUs) mapping to facial muscle contractions (e.g., AU6 for cheek raise, AU12 for lip corner pull).
4.  **Vector Assembly**:
    *   The 8 geometric ratios and 12 AU intensities are concatenated.
    *   Output: $\vec{X}_{pheno} \in \mathbb{R}^{20}$.

### Layer 2: Siamese Network Representation (Latent Space Projection)
In a Siamese Neural Network architecture, the input $\vec{X}_{pheno}$ isn't passed through a final categorical softmax layer. 
Instead, it exists in a normalized metric space populated by prototype vectors from our `SyndromeReferenceDB`.

*   **Clinical Prototypes ($P_i$)**: The DB contains $N$ established prototype vectors (e.g., $P_{DownSyndrome}, P_{FragileX}$).
*   These 20-dimensional prototype vectors are literally derived from average anthropometric measurements found in published medical literature (e.g., Farkas 1994, Ward 2000) and represent the "ideal" phenotypic presentation.
*   The DB stores $400+$ reference arrays (derived via Gaussian noise perturbation of the base prototypes, simulating population variance).

### Layer 3: FAISS Nearest-Neighbor Search (The Matching Phase)
To compare the patient's face against all known syndromes, we rapidly search the latent space for the most similar prototypes.

1.  **L2 Normalization**: Both $\vec{X}_{pheno}$ and all database prototypes $P_i$ are $L_2$-normalized to project them onto a hypersphere of radius 1:
    *   $\vec{u} = \frac{\vec{u}}{||\vec{u}||_2}$
2.  **Cosine Similarity Search**: The distance between vectors is computed as the dot product (Cosine Similarity):
    *   $S(X, P_i) = X \cdot P_i = \sum_{j=1}^{20} (x_j \cdot p_{i,j})$
3.  **FAISS Engine**: The search is accelerated using Facebook AI Similarity Search (FAISS) using an `IndexFlatIP` (Inner Product). 
    *   FAISS executes highly optimized BLAS matrix multiplications to find the top $k$ nearest neighbors in $O(\log N)$ or $O(N)$ with aggressive parallelization.
    *   *Note: MIRA currently uses a NumPy accelerated dot-product fallback which replicates FAISS mathematically for compatibility, performing identically well for $N < 100,000$.*

### Layer 4: Confidence Aggregation & Longitudinal Tracking
The resulting $k$-nearest neighbors are grouped by syndrome class.
1.  **Confidence Score Calculation**:
    *   The highest similarity score for a given generic class (e.g., PWS) is taken.
    *   Soft thresholding is applied so only extremely close matches achieve $>80\%$ confidence.
2.  **Patient Registry Engine**:
    *   If a `patientId` is active, the confidence scores are appended to a longitudinal chronological ledger.
    *   **IQR Outlier Detection**: The registry computes historic symptom baselines ($Q1, Q3$). Current visits breaching $Threshold = Q3 + 1.5 \times (Q3 - Q1)$ are explicitly flagged as degenerative outliers in the UI trajectory charts.

## 3. Scalability & Data Privacy

*   **Database Ingestion Endpoint**: Adding new, patient-derived diagnostic reference data dynamically is simply $O(1)$ memory allocation (`POST /mira/admin/add-reference`). No complex network retraining is required—the new vector is immediately searchable.
*   **Privacy-First Extraction**: No raw pixel data is ever transmitted to clinical storage. MIRA strips the patient's identity instantly upon bounding box detection, persisting only the 20-dimensional mathematical abstraction.
