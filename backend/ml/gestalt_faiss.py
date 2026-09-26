"""
GestaltFAISS — Adapter Layer (now delegates to SyndromeReferenceDB)
====================================================================
This module is kept for backward compatibility with existing imports in mira_engine.py.

The previous implementation seeded query vectors from `disorder_hint`, meaning the
answer was baked into the query. This has been replaced:

  OLD (buggy):  generate_query_vector(disorder_hint) → pre-cooked vector
  NEW (real):   syndrome_db.query(face_feature_vector) → real similarity ranking

All matching now happens in ml.syndrome_reference_db which holds the FAISS index
of clinically-grounded prototype vectors.
"""

from ml.syndrome_reference_db import syndrome_db, SYNDROME_LABELS, SyndromeReferenceDB

# Re-export for any code that imports directly from gestalt_faiss
__all__ = ["gestalt_faiss_engine", "syndrome_db", "SYNDROME_LABELS"]

# The old singleton reference now points to the real DB
gestalt_faiss_engine = syndrome_db


def match_image_to_syndromes(feature_vector, ancestry: str = "EUR", top_k: int = 20):
    """
    Public API: match a 20-dim feature vector against the syndrome reference DB.
    
    Args:
        feature_vector: 20-dim list/array from face_analysis.extract_feature_vector()
        ancestry: population ancestry string (used for prior calibration, optional)
        top_k: number of nearest neighbors to retrieve

    Returns:
        Ranked list of syndrome matches (same format as before for backward compat)
    """
    results = syndrome_db.query(feature_vector, top_k=top_k, ancestry=ancestry)
    
    # Add backward-compatible fields for any code that reads old FAISS output
    from ml.mira_engine import DISORDER_HPO_RULES
    for item in results:
        syn_key = item["syndrome"]
        rules = DISORDER_HPO_RULES.get(syn_key, {})
        top_hpos = [v[0] for _, v in list(rules.items())[:2]]
        item.setdefault("matched_features", top_hpos)
        item.setdefault("centroid_distance", round(1.0 - item["similarity"], 4))
        item.setdefault("neighbor_cluster", item.get("neighbor_count", 0))

    return results
