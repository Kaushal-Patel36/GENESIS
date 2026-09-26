import sys
import os
import math

# Add backend directory to path
sys.path.insert(0, os.path.join(os.getcwd(), 'backend'))

from ml.heteronet_engine import HeteroNetEngine

def test_mc_gpm_engine():
    print("=" * 60)
    print("  GENESIS MC-GPM Engine Verification")
    print("=" * 60)
    
    engine = HeteroNetEngine()
    
    # Run analysis for ZIC3 (classic heterotaxy gene)
    print("\n[TEST] Running MC-GPM analysis for ZIC3...")
    result = engine.run("ZIC3")
    
    # Verify 7-layer cascade outputs
    print(f"\n[LAYERS] Shannon Entropy H by Layer:")
    for layer, h in result["layer_entropies"].items():
        print(f" - Layer {layer}: {h} bits")
        
    print(f"\n[MATH] Axis Coherence Index (ACI): {result['aci_score']}")
    
    # Verify Validation Keys
    val = result["validation"]
    print(f"\n[METRICS] Validation Results:")
    print(f" - ACI (Axis Coherence): {val.get('aci_coherence')}")
    print(f" - Mechanistic Fidelity: {val.get('mc_gpm_fidelity')}")
    print(f" - Ablation Delta: {val.get('ablation_delta')}")
    print(f" - Cascade Stability: {val.get('cascade_stability')}")

    assert "aci_coherence" in val, "ACI missing from validation"
    assert val["mc_gpm_fidelity"] > 0.9, "Fidelity lower than expected"
    assert "layer_entropies" in result, "Layer entropies missing"
    assert "aci_score" in result, "ACI score missing from root"

    print("\n[SUCCESS] MC-GPM Dynamic Engine Verified.")

if __name__ == "__main__":
    test_mc_gpm_engine()
