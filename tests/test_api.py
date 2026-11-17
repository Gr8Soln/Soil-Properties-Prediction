import pytest
from fastapi.testclient import TestClient

from app.main import app

# The three presets offered by the UI prediction form.
PRESETS = {
    "default": dict(LL=47, PL=35.5, Sat_Unit_Wt_kN_m3=18.84, Mv_50kPa=0.47, Cv_50kPa=0.85,
                    Fines_Content_pct=36.5, Sand_Fraction_pct=62.7, Gravel_Fraction_pct=0.8),
    "clay": dict(LL=58.2, PL=29.4, Sat_Unit_Wt_kN_m3=17.65, Mv_50kPa=0.62, Cv_50kPa=0.42,
                 Fines_Content_pct=78.0, Sand_Fraction_pct=20.5, Gravel_Fraction_pct=1.5),
    "sand": dict(LL=24.5, PL=16.0, Sat_Unit_Wt_kN_m3=20.15, Mv_50kPa=0.18, Cv_50kPa=2.15,
                 Fines_Content_pct=18.5, Sand_Fraction_pct=74.0, Gravel_Fraction_pct=7.5),
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_reports_models_and_explainers(client):
    body = client.get("/health").json()
    assert all(body[key] for key in (
        "cu_model_loaded", "phi_model_loaded", "cu_explainer_loaded", "phi_explainer_loaded"))


@pytest.mark.parametrize("preset", PRESETS)
def test_predict_returns_plausible_values_and_additive_shap(client, preset):
    response = client.post("/predict", json=PRESETS[preset])
    assert response.status_code == 200, response.text
    body = response.json()
    assert 0 <= body["predictions"]["cu_kpa"] <= 500
    assert 0 <= body["predictions"]["phi_deg"] <= 50
    for key, predicted in (("cu", "cu_kpa"), ("phi", "phi_deg")):
        estimate = body["shap"][key]["summary"]["prediction_estimate"]
        # SHAP contributions must add up to the prediction they explain.
        assert estimate == pytest.approx(body["predictions"][predicted], abs=0.05)


def test_single_target_endpoints_match_unified(client):
    unified = client.post("/predict", json=PRESETS["default"]).json()["predictions"]
    cu_input = {k: v for k, v in PRESETS["default"].items() if k != "Gravel_Fraction_pct"}
    assert client.post("/predict/cu", json=cu_input).json()["prediction"] == unified["cu_kpa"]
    assert client.post("/predict/phi", json=PRESETS["default"]).json()["prediction"] == unified["phi_deg"]


def test_training_like_input_has_no_range_warning(client):
    assert client.post("/predict", json=PRESETS["default"]).json()["out_of_range"] == []


def test_extrapolation_is_flagged_not_rejected(client):
    payload = {**PRESETS["default"], "LL": 140.0}
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    assert [w["field"] for w in response.json()["out_of_range"]] == ["LL"]


@pytest.mark.parametrize("change", [
    {"PL": 60.0},                      # PL above LL
    {"Fines_Content_pct": -5.0},       # negative percentage
    {"Sand_Fraction_pct": 90.0},       # gradation sums past 100%
    {"Sat_Unit_Wt_kN_m3": 0.0},
])
def test_impossible_inputs_are_rejected(client, change):
    assert client.post("/predict", json={**PRESETS["default"], **change}).status_code == 422


def test_model_info_exposes_both_validation_schemes(client):
    body = client.get("/model-info/cu").json()
    assert {row["Validation"] for row in body["cv_comparison"]} == {"site_holdout", "shuffled_5fold"}
    assert "site_holdout" in body["deployment"]["selected_by"]


def test_five_core_inputs_are_enough(client):
    core = {k: PRESETS["default"][k] for k in
            ("LL", "PL", "Sat_Unit_Wt_kN_m3", "Fines_Content_pct", "Sand_Fraction_pct")}
    for path in ("/predict", "/predict/cu", "/predict/phi"):
        assert client.post(path, json=core).status_code == 200, path
    # ...and the extra fields the current UI still sends are accepted and ignored.
    assert client.post("/predict", json=PRESETS["default"]).json()["predictions"] == \
        client.post("/predict", json=core).json()["predictions"]
