"""
Patient Registry — maps patient name → stable patient_id and stores
longitudinal MIRA analysis snapshots per visit.
"""
from __future__ import annotations
import json
import hashlib
import os
from datetime import datetime
from typing import List, Optional, Dict, Any


# In-memory store (persisted to a JSON file next to this module)
_STORE_PATH = os.path.join(os.path.dirname(__file__), "_patient_store.json")

_store: Dict[str, Any] = {"patients": {}, "history": {}}


def _load():
    global _store
    if os.path.exists(_STORE_PATH):
        try:
            with open(_STORE_PATH, "r") as f:
                _store = json.load(f)
        except Exception:
            _store = {"patients": {}, "history": {}}


def _save():
    try:
        with open(_STORE_PATH, "w") as f:
            json.dump(_store, f, indent=2)
    except Exception:
        pass


# Load on import
_load()


def name_to_id(name: str) -> str:
    """Deterministic patient ID from name (lowercase, stripped)."""
    key = name.strip().lower()
    return "PT-" + hashlib.sha1(key.encode()).hexdigest()[:8].upper()


def get_or_create_patient(name: str) -> Dict[str, Any]:
    """Return existing patient record or create a new one."""
    pid = name_to_id(name)
    if pid not in _store["patients"]:
        _store["patients"][pid] = {
            "patient_id": pid,
            "name": name.strip(),
            "created_at": datetime.utcnow().isoformat(),
            "visit_count": 0,
        }
        _store["history"][pid] = []
        _save()
    return _store["patients"][pid]


def record_visit(
    patient_id: str,
    top_syndrome: str,
    confidence: float,
    feature_vector: Optional[List[float]] = None,
    behavior_score: Optional[float] = None,  # 0–100 composite behavioral index
    notes: str = "",
) -> Dict[str, Any]:
    """Append a visit record. Returns the stored visit dict."""
    if patient_id not in _store["patients"]:
        raise ValueError(f"Unknown patient_id: {patient_id}")

    visit = {
        "visit_id": len(_store["history"].get(patient_id, [])) + 1,
        "timestamp": datetime.utcnow().isoformat(),
        "top_syndrome": top_syndrome,
        "confidence": round(confidence, 4),
        "behavior_score": behavior_score,
        "feature_vector_summary": feature_vector[:5] if feature_vector else None,
        "notes": notes,
    }

    _store["history"].setdefault(patient_id, []).append(visit)
    _store["patients"][patient_id]["visit_count"] = len(_store["history"][patient_id])
    _save()
    return visit


def get_history(patient_id: str) -> List[Dict[str, Any]]:
    return _store["history"].get(patient_id, [])


def get_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    return _store["patients"].get(patient_id)


def compute_growth_series(patient_id: str) -> Dict[str, Any]:
    """
    Returns longitudinal series + outlier flags for the frontend chart.
    Outlier = confidence deviates > 1.5 * IQR from Q1/Q3 of the series.
    """
    history = get_history(patient_id)
    if not history:
        return {"visits": [], "outliers": [], "trend": "no_data"}

    confidences = [v["confidence"] for v in history]
    behavior = [v.get("behavior_score") for v in history]

    # IQR outlier detection on confidence
    sorted_c = sorted(confidences)
    n = len(sorted_c)
    q1 = sorted_c[n // 4] if n >= 4 else sorted_c[0]
    q3 = sorted_c[(3 * n) // 4] if n >= 4 else sorted_c[-1]
    iqr = q3 - q1
    lo, hi = q1 - 1.5 * iqr, q3 + 1.5 * iqr

    visits_out = []
    outlier_ids = []
    for i, v in enumerate(history):
        c = v["confidence"]
        is_out = c < lo or c > hi
        if is_out:
            outlier_ids.append(i)
        visits_out.append({
            "visit_id": v["visit_id"],
            "timestamp": v["timestamp"],
            "top_syndrome": v["top_syndrome"],
            "confidence": c,
            "behavior_score": v.get("behavior_score"),
            "outlier": is_out,
        })

    # Simple trend
    if len(confidences) >= 2:
        delta = confidences[-1] - confidences[0]
        trend = "improving" if delta > 0.05 else "declining" if delta < -0.05 else "stable"
    else:
        trend = "single_visit"

    return {
        "visits": visits_out,
        "outlier_indices": outlier_ids,
        "trend": trend,
        "visit_count": len(history),
    }
