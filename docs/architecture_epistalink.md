# EpistaLink — Genomic Variant Interaction Engine

This document details the scientific context, mathematical formulas, and layered cross-attention architecture of EpistaLink.

## 1. Scientific Context & Biological Realism

Standard bioinformatics tools (like REVEL, CADD, or PolyPhen) evaluate variants in an isolated, additive manner. While effective for monogenic traits, this fails for complex conditions where multiple variants interact (Epistasis). 

**EpistaLink** explicitly models **HOW** pairs of genetic variants structurally and functionally influence each other—whether a second mutation destabilizes an already fragile protein, or whether it compensates and rescues the phenotype.
*   **Negative Epistasis (Loss of Function)**: The combined functional damage is worse than the sum of its parts. Mutations "cancel" the protein's utility entirely.
*   **Positive Epistasis (Gain of Function)**: The interaction creates a novel structural effect or unexpectedly rescues function.

## 2. Layered Architecture: Cross-Attention Pair Encoding

EpistaLink diverges from simple variant concatenation, employing a bidirectional cross-attention mechanism on independent embeddings to model complex context-dependent interactions.

### Layer 1: Independent Latent Embedding (Tokenization)
Each variant ($v_1, v_2$) is converted into an independent, dense feature activation vector.
*   **Input**: Variant ID, Genomic Position, Functional Domain.
*   **Base Activation**: Guided by the domain (e.g., motor domains receive $1.5\times$ activation multipliers; rod domains receive $0.8\times$).
*   **Output**: Vectors $V_1, V_2 \in \mathbb{R}^{64}$.

### Layer 2: Bidirectional Cross-Attention (Interaction Inference)
Rather than naive vector summation, EpistaLink learns the interaction via attention, using shared Q/K/V projections:
*   We initialize single-head shared projection matrices: $W_Q, W_K, W_V \in \mathbb{R}^{64 \times 64}$.
*   **Queries, Keys, and Values**:
    *   $q_1 = V_1 \cdot W_Q \quad k_2 = V_2 \cdot W_K \quad v_2 = V_2 \cdot W_V$
    *   $q_2 = V_2 \cdot W_Q \quad k_1 = V_1 \cdot W_K \quad v_1 = V_1 \cdot W_V$
*   **Cross-Attention Scores**:
    *   $Score_{1 \rightarrow 2} = (q_1 \cdot k_2) / \sqrt{d_k}$
    *   $Score_{2 \rightarrow 1} = (q_2 \cdot k_1) / \sqrt{d_k}$
    *   (where $d_k = \sqrt{64} = 8$)
*   **Sigmoid Gating**: $Attention_{1 \rightarrow 2} = \sigma(Score_{1 \rightarrow 2})$
*   **Attended Context Vectors**:
    *   $Attended_1 = V_1 + (Attention_{1 \rightarrow 2} \times v_2)$
    *   $Attended_2 = V_2 + (Attention_{2 \rightarrow 1} \times v_1)$

### Layer 3: Sparse Latent Projection (Feature Mapping)
The bidirectionally attended representations are merged and projected back into the interpretable 64-dimensional Sparse Autoencoder (SAE) latent space.
*   $Interaction\_Raw = (Attended_1 + Attended_2) \cdot W_{out}$
*   **Spatial Bias**: The Euclidean genetic sequence distance modulates the interaction scalar. $Proximity = e^{-\Delta_{position}/5000}$. Closer variants interact strongly.
*   **Final Pair Vector**: $P = \mathrm{ReLU}(Attended_1 + Attended_2 + (Interaction\_Raw \times (0.5 + Proximity)))$

## 3. Mathematical Epistasis Scoring Function

To output a clinically useful and bounded interaction score, the system calculates the exact feature deviation from a purely additive assumption and applies a hyperbolic transform.

1.  **Interaction Deviation ($\Delta$)**: What did the attention mechanism alter?
    $ \Delta = P - (V_1 + V_2) $
2.  **Weighted Function Score ($F$)**: Not all features matter equally. We weight the baseline activation:
    $ \mathrm{Weights} = |V_1 + V_2| + 0.1 $
    $ F = \sum (\mathrm{Weights}_i \times \Delta_i) $
3.  **Hyperbolic Transform ($E$)**: Raw function scores are collapsed into a deterministic range $[-10, +10]$ using steepness factor $a=7.0$:
    $ E = 10 \cdot \tanh( F / a ) $

## 4. Scalability & Extensibility

*   **AlphaFold Integration Ready**: EpistaLink is structurally prepared to ingest actual 3D Euclidean distances and Solvent-Accessible Surface Area (SASA) directly into the $Proximity$ scalar and basic token embeddings.
*   **Computation Check**: Matrix multiplications for $N=2$ (pairwise variants) are strictly $O(1)$ relative to genome sequence length, resulting in nanosecond execution times per pair. This allows whole-exome combinatorial screening in parallel without heavy GPU reliance.
