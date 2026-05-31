# Geotechnical Shear Strength Predictive Suite

**Senior ML Engineer Deliverable**  
An end-to-end machine learning pipeline and **production FastAPI inference service** for predicting soil shear strength parameters from borehole data.

---

## 🎯 Project Overview

This suite predicts two critical geotechnical parameters:

- **Angle of Internal Friction (φ / Phi_deg)** — Measures soil's resistance to shearing  
- **Undrained Cohesion (Cu_kPa)** — Measures soil's shear strength under undrained conditions

The pipeline processes 10 disparate borehole datasets, applies geotechnical domain logic, engineers behavioural features, trains and compares multiple ML algorithms, and exposes the best models via a **REST API**.

---

## 📦 Project Structure

```
Soil-Properties-Prediction/
│
├── app/                              # 🆕 FastAPI inference service
│   ├── __init__.py
│   ├── main.py                       # API routes & startup logic
│   ├── schemas.py                    # Pydantic request/response models
│   └── feature_engineering.py        # build_cu_features & build_phi_features
│
├── notebooks/
│   ├── Data_Cleaning.ipynb           # Phase 2: Geotechnical cleaning logic
│   ├── Feature_Engineering.ipynb     # Phase 3: Advanced feature derivation
│   ├── Cu_Target_Modeling.ipynb      # Phase 4a: Cu_kPa model training
│   └── Phi_Target_Modeling.ipynb     # Phase 4b: Phi_deg model training
│
├── outputs/                          # All trained artifacts & evaluation files
│   ├── cu_best_model.joblib          # ExtraTreesRegressor – Cu_kPa
│   ├── phi_best_model.joblib         # ExtraTreesRegressor – Phi_deg
│   ├── cu_model_comparison.csv       # CV results for all Cu models
│   ├── phi_model_comparison.csv      # CV results for all Phi models
│   ├── cu_feature_importance.csv     # Permutation importances – Cu
│   ├── phi_feature_importance.csv    # Permutation importances – Phi
│   ├── cu_oof_predictions.csv        # Out-of-fold predictions – Cu
│   └── phi_oof_predictions.csv       # Out-of-fold predictions – Phi
│
├── datasets/                         # Input Excel files (.xlsx)
├── datasets_merger.py                # Phase 1: Data unification script
├── requirements.txt
└── README.md
```

---

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Activate (Git Bash / macOS / Linux)
source .venv/Scripts/activate

# Install all dependencies (data science + API)
pip install -r requirements.txt
```

### 2. Start the Inference API

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:

| URL | Description |
|---|---|
| http://127.0.0.1:8000/docs | Interactive Swagger UI |
| http://127.0.0.1:8000/redoc | ReDoc documentation |
| http://127.0.0.1:8000/health | Model load status |

---

## 🔌 API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Returns model-load status for both models |
| `POST` | `/predict/cu` | Predict **Cu_kPa** (undrained shear strength) |
| `POST` | `/predict/phi` | Predict **Phi_deg** (friction angle) |
| `GET` | `/model-info/cu` | Cu model class, CV results, feature importances |
| `GET` | `/model-info/phi` | Phi model class, CV results, feature importances |

### Example — Predict Cu_kPa

```bash
curl -X POST http://127.0.0.1:8000/predict/cu \
  -H "Content-Type: application/json" \
  -d '{
    "LL": 47.0,
    "PL": 35.5,
    "Sat_Unit_Wt_kN_m3": 18.84,
    "Mv_50kPa": 0.47,
    "Cv_50kPa": 0.85,
    "Fines_Content_pct": 36.5,
    "Sand_Fraction_pct": 62.7
  }'
```

**Response:**

```json
{
  "prediction": 41.5573,
  "target": "Cu_kPa",
  "model": "ExtraTreesRegressor"
}
```

### Example — Predict Phi_deg

```bash
curl -X POST http://127.0.0.1:8000/predict/phi \
  -H "Content-Type: application/json" \
  -d '{
    "LL": 47.0,
    "PL": 35.5,
    "Sat_Unit_Wt_kN_m3": 18.84,
    "Mv_50kPa": 0.47,
    "Cv_50kPa": 0.85,
    "Fines_Content_pct": 36.5,
    "Sand_Fraction_pct": 62.7,
    "Gravel_Fraction_pct": 0.8
  }'
```

**Response:**

```json
{
  "prediction": 10.9815,
  "target": "Phi_deg",
  "model": "ExtraTreesRegressor"
}
```

---

## 📊 Model Performance (Actual Results)

Six regression algorithms were compared using **5-fold group cross-validation**. Results below are **out-of-fold (OOF)** metrics on the full training set.

### Cu_kPa — Undrained Shear Strength

| Model | OOF R² | OOF RMSE | OOF MAE |
|---|---|---|---|
| **Extra Trees** ⭐ | **0.826** | **6.76 kPa** | **5.18 kPa** |
| XGBoost | 0.791 | 7.33 kPa | 5.75 kPa |
| Gradient Boosting | 0.755 | 7.98 kPa | 6.08 kPa |
| Random Forest | 0.733 | 8.33 kPa | 6.44 kPa |
| Linear Regression | 0.495 | 11.44 kPa | 9.32 kPa |
| Ridge Regression | 0.462 | 11.81 kPa | 9.65 kPa |

### Phi_deg — Friction Angle

| Model | OOF R² | OOF RMSE | OOF MAE |
|---|---|---|---|
| **Extra Trees** ⭐ | **0.875** | **1.40°** | **0.96°** |
| XGBoost | 0.825 | 1.66° | 1.12° |
| Gradient Boosting | 0.796 | 1.79° | 1.22° |
| Random Forest | 0.775 | 1.88° | 1.29° |
| Linear Regression | 0.585 | 2.56° | 2.01° |
| Ridge Regression | 0.471 | 2.89° | 2.33° |

### Top Predictive Features

**Cu_kPa:** `LL`, `Cv_to_Mv_Ratio`, `Compression_x_Plasticity`, `Density_x_Fines`, `Mv_50kPa`

**Phi_deg:** `Sat_Unit_Wt_kN_m3`, `Mv_50kPa`, `Cv_50kPa`, `Density_x_Sand`, `LL`

---

## ⚙️ Feature Engineering

The API replicates the **exact same** feature transformations used during training — ensuring zero drift between research notebooks and production inference.

### Cu_kPa — 7 raw inputs → 15 model features

| Engineered Feature | Formula |
|---|---|
| `PI_calc` | `LL − PL` |
| `LL_to_PL_Ratio` | `LL / PL` |
| `Plasticity_to_LL` | `PI_calc / LL` |
| `Coarse_Fraction_pct` | `100 − Fines_Content_pct` |
| `Sand_to_Fines_Ratio` | `Sand / (Fines + 1)` |
| `Cv_to_Mv_Ratio` | `Cv_50kPa / Mv_50kPa` |
| `Density_x_Fines` | `Sat_Unit_Wt_kN_m3 × Fines_Content_pct` |
| `Compression_x_Plasticity` | `Mv_50kPa × PI_calc` |

### Phi_deg — 8 raw inputs → 14 model features

| Engineered Feature | Formula |
|---|---|
| `PI_calc` | `LL − PL` |
| `Plasticity_to_LL` | `PI_calc / LL` |
| `Coarse_Fraction_pct` | `100 − Fines_Content_pct` |
| `Sand_to_Fines_Ratio` | `Sand / (Fines + 1)` |
| `Gravel_to_Sand_Ratio` | `Gravel / (Sand + 1)` |
| `Mv_to_Cv_Ratio` | `Mv_50kPa / Cv_50kPa` |
| `Density_x_Sand` | `Sat_Unit_Wt_kN_m3 × Sand_Fraction_pct` |

---

## 🧬 Notebook Pipeline

If retraining from scratch, run the notebooks in order:

### Phase 1 — Data Merging

```bash
python datasets_merger.py
```

**Output:** `geotechnical_master_raw.csv`

### Phase 2 — Data Cleaning

```bash
jupyter notebook notebooks/Data_Cleaning.ipynb
```

Key operations: Atterberg consistency validation ($PI = LL - PL$), outlier removal, unit standardisation (kPa, kN/m³).

**Output:** `geotechnical_cleaned.csv`

### Phase 3 — Feature Engineering

```bash
jupyter notebook notebooks/Feature_Engineering.ipynb
```

**Output:** `geotechnical_engineered.csv`

### Phase 4a — Cu_kPa Model Training

```bash
jupyter notebook notebooks/Cu_Target_Modeling.ipynb
```

**Outputs:** `outputs/cu_best_model.joblib`, `outputs/cu_model_comparison.csv`, `outputs/cu_feature_importance.csv`

### Phase 4b — Phi_deg Model Training

```bash
jupyter notebook notebooks/Phi_Target_Modeling.ipynb
```

**Outputs:** `outputs/phi_best_model.joblib`, `outputs/phi_model_comparison.csv`, `outputs/phi_feature_importance.csv`

---

## 🧪 Validation Strategy

### 5-Fold Group Cross-Validation

All models undergo 5-fold CV grouped by borehole dataset to ensure:

- No data leakage between boreholes from the same site
- Generalisation to unseen soil profiles
- Stable, unbiased performance metrics

### Geotechnical Domain Validation

- Physical boundary enforcement (φ: 0–50°, Cu: 0–500 kPa)
- Atterberg consistency checks ($PI = LL - PL$ must be positive)
- Finite/non-null assertions in the feature pipeline

---

## 🔧 Troubleshooting

| Issue | Solution |
|---|---|
| `FileNotFoundError` on `datasets_merger.py` | Ensure Excel files are in `datasets/` with naming pattern `geotechnical_data_*.xlsx` |
| API returns `503 Service Unavailable` | Model `.joblib` files are missing from `outputs/` — re-run the training notebooks |
| `422 Unprocessable Entity` on prediction | Check all required fields are present and numeric (no nulls or `NaN`) |
| Low R² scores on retrain | Verify target variable completeness and check for data leakage in group folds |
| Server won't start | Confirm venv is activated and `fastapi`/`uvicorn` are installed: `pip install -r requirements.txt` |

---

## 📚 Technical References

### Geotechnical Formulas

**Liquidity Index:**
$$LI = \frac{W_n - PL}{LL - PL}$$

**Plasticity Index:**
$$PI = LL - PL$$

### Literature

- Terzaghi, K., Peck, R. B., & Mesri, G. (1996). *Soil Mechanics in Engineering Practice*.
- Robertson, P. K. (2009). *Interpretation of cone penetration tests — a unified approach*.
- Kulhawy, F. H., & Mayne, P. W. (1990). *Manual on estimating soil properties for foundation design*.

---

## 👨‍💻 Author

**Senior Machine Learning Engineer**  
Geotechnical Predictive Analytics Team

---

## 📄 License

This project is proprietary software developed for geotechnical engineering applications.

---

## 🙏 Acknowledgments

- Geotechnical domain expertise from ASCE standards
- ML best practices from scikit-learn and XGBoost communities
- Data engineering principles from Clean Architecture guidelines

---

**Last Updated:** May 2026  
**Pipeline Version:** 2.0.0 — Production FastAPI Inference Service
