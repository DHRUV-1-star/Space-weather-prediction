import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=== Testing FastAPI Endpoints ===")
    
    # 1. Health
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health failed: {r.text}"
    print("[PASS] GET /api/health ->", r.json()["status"])
    
    # 2. Space weather current
    r = client.get("/api/space-weather/current")
    assert r.status_code == 200, f"Current weather failed: {r.text}"
    print("[PASS] GET /api/space-weather/current -> Kp:", r.json()["kp_index"])
    
    # 3. Scenario switch
    r = client.post("/api/space-weather/scenario", json={"scenario_key": "severe_radiation"})
    assert r.status_code == 200, f"Scenario switch failed: {r.text}"
    print("[PASS] POST /api/space-weather/scenario -> Flare:", r.json()["flare_class"])
    
    # 4. Forecast
    r = client.get("/api/space-weather/forecast")
    assert r.status_code == 200, f"Forecast failed: {r.text}"
    print("[PASS] GET /api/space-weather/forecast -> Class X prob:", r.json()["flare_forecast"]["class_x_prob"])
    
    # 5. Satellites list
    r = client.get("/api/satellites")
    assert r.status_code == 200, f"Satellites list failed: {r.text}"
    sats = r.json()
    assert len(sats) >= 3, "Expected at least 3 satellites"
    print(f"[PASS] GET /api/satellites -> Count: {len(sats)}")
    
    # 6. Satellite get
    r = client.get("/api/satellites/SAT-EO-01")
    assert r.status_code == 200, f"Satellite get failed: {r.text}"
    print("[PASS] GET /api/satellites/SAT-EO-01 -> Name:", r.json()["name"])
    
    # 7. Risk calculate (default)
    r = client.post("/api/risk/calculate")
    assert r.status_code == 200, f"Risk calculate failed: {r.text}"
    risk = r.json()
    print(f"[PASS] POST /api/risk/calculate -> Risk: {risk['overall_risk']} ({risk['risk_level']}), Primary: {risk['primary_threat']}")
    
    # 8. What-If Simulation
    sim_req = {
        "satellite_id": "SAT-EO-01",
        "simulated_altitude_km": 750.0,
        "simulated_mass_kg": 1200.0,
        "simulated_cross_sectional_area_m2": 4.5,
        "simulated_shielding_thickness_mm_al": 3.5,
        "simulated_radiation_hardening": "Rad-Tolerant",
        "simulated_comms_dependency": 8,
        "simulated_nav_dependency": 7
    }
    r = client.post("/api/simulation", json=sim_req)
    assert r.status_code == 200, f"Simulation failed: {r.text}"
    sim_res = r.json()
    print(f"[PASS] POST /api/simulation -> Delta Risk: {sim_res['delta_overall_risk']}, Verdict: {sim_res['mitigation_verdict']}")
    
    # 9. Satellite Comparison
    r = client.post("/api/compare", json={"satellite_ids": ["SAT-EO-01", "SAT-COM-01", "SAT-NAV-01"]})
    assert r.status_code == 200, f"Compare failed: {r.text}"
    print(f"[PASS] POST /api/compare -> Evaluated {len(r.json()['satellites_evaluated'])} satellites")
    
    # 10. Historical Events
    r = client.get("/api/events")
    assert r.status_code == 200, f"Events failed: {r.text}"
    print(f"[PASS] GET /api/events -> Count: {len(r.json())}")
    
    r = client.get("/api/events/may-2024-g5")
    assert r.status_code == 200, f"Event get failed: {r.text}"
    print("[PASS] GET /api/events/may-2024-g5 ->", r.json()["name"])
    
    # 11. Alerts
    r = client.get("/api/alerts")
    assert r.status_code == 200, f"Alerts failed: {r.text}"
    print(f"[PASS] GET /api/alerts -> Count: {len(r.json())}")
    
    print("\n>>> ALL 11 API ENDPOINTS PASSED WITH ZERO ERRORS! <<<")

if __name__ == "__main__":
    run_tests()
