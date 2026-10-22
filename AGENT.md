# AGENT.md — Soil-Properties-Prediction

> Onboarding guide for AI coding assistants working on this codebase.
> Read this file before making any changes to the project.

---

## Project Identity

**Name:** Geotechnical Shear Strength Predictive Suite  
**Domain:** Geotechnical engineering — soil mechanics and shear strength analysis  
**Purpose:** End-to-end ML pipeline and production inference system that predicts two critical soil parameters from borehole/laboratory data:

| Target | Symbol | Unit | Physical Meaning | Domain Bounds |
|---|---|---|---|---|
| Undrained Cohesion | Cu_kPa | kPa | Shear strength under undrained conditions | 0–500 kPa |
| Angle of Internal Friction | Phi_deg (φ) | degrees | Soil's resistance to shearing | 0–50° |

**Best models for both targets:** ExtraTreesRegressor (Cu R²=0.826, Phi R²=0.875)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        DATA PIPELINE                             │
│                                                                  │
│  datasets/*.xlsx ──► datasets_merger.py ──► master_raw.csv       │
│                                                 │                │
│  notebooks/Unified_Geotechnical_Modeling.ipynb   │                │
│  notebooks/Data_Cleaning.ipynb                   ▼                │
│  notebooks/Feature_Engineering.ipynb        cleaned/engineered   │
│  notebooks/Cu_Target_Modeling.ipynb              │                │
│  notebooks/Phi_Target_Modeling.ipynb             ▼                │
│                                          outputs/*.joblib         │
│                                          outputs/*.csv            │
└──────────────────────────────────────────────────────────────────┘
                              │
                    loads at startup
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (app/)                        │
│                                                                  │
│  main.py ◄── schemas.py (Pydantic v2 models)                    │
│     │                                                            │
│     ├── model_service.py (load, predict, explain)                │
│     │       │                                                    │
│     │       ├── feature_engineering.py (build_cu/phi_features)   │
│     │       ├── joblib models (ExtraTreesRegressor)              │
│     │       └── SHAP TreeExplainer                               │
│     │                                                            │
│     └── CSV readers (model_comparison, feature_importance)       │
└──────────────────────────────────────────────────────────────────┘
                              │
                     HTTP (JSON REST)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    FRONTEND UI (ui/)                              │
│                                                                  │
│  TanStack Start (SSR) + React 19 + Vite 7                       │
│     │                                                            │
│     ├── routes/index.tsx ........... Landing page & Research Hub  │
│     └── routes/predict.tsx ......... Prediction Suite & SHAP      │
│     │                                                            │
│     ├── lib/predict-api.ts ......... API client (fetch wrapper)  │
│     ├── components/ ................ Custom + shadcn/ui           │
│     └── styles.css ................. Tailwind CSS 4              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend (`app/`)
| Layer | Technology | Version Constraint |
|---|---|---|
| Framework | FastAPI | ≥0.109.0 |
| Validation | Pydantic v2 | ≥2.0.0 |
| ML Models | scikit-learn (ExtraTreesRegressor) | ≥1.2.0 |
| Explainability | SHAP (TreeExplainer) | ≥0.45.0 |
| Boosting | XGBoost (training only) | ≥1.7.0 |
| Serialization | joblib | ≥1.2.0 |
| Server | uvicorn | ≥0.27.0 |
| Data | pandas, numpy | ≥1.5.0, ≥1.23.0 |

### Frontend (`ui/`)
| Layer | Technology | Version |
|---|---|---|
| Runtime | React 19 | ^19.2.0 |
| SSR Framework | TanStack Start | ^1.167.50 |
| Router | TanStack Router (file-based) | ^1.168.25 |
| Data Fetching | TanStack React Query | ^5.83.0 |
| Build | Vite 7 | ^7.3.1 |
| CSS | Tailwind CSS 4 | ^4.2.1 |
| Component Library | shadcn/ui (New York variant) | — |
| Charts | Recharts | ^3.8.1 |
| Forms | react-hook-form + zod | ^7.71.2, ^3.24.2 |
| Icons | lucide-react | ^0.575.0 |
| Package Manager | Bun | — |
| Deployment | Cloudflare Workers (Nitro) | — |

### ML Pipeline (`notebooks/`)
| Tool | Usage |
|---|---|
| Jupyter / IPython | Interactive notebook environment |
| pandas / numpy | Data wrangling |
| scikit-learn | Model training, cross-validation, permutation importance |
| XGBoost | Alternative model comparison |
| matplotlib / seaborn | Visualization |
| openpyxl | Reading .xlsx files |

---

## Project Structure

```
Soil-Properties-Prediction/
│
├── AGENT.md                          # This file — AI assistant guide
├── README.md                         # Human-facing documentation
├── requirements.txt                  # Python dependencies
├── .env.sample                       # Backend env template (CORS_ORIGINS=)
├── .gitignore                        # Git ignore rules
├── datasets_merger.py                # Phase 1: Merge 10 Excel files → CSV
│
├── app/                              # FastAPI inference service
│   ├── __init__.py                   # Package marker (empty)
│   ├── main.py                       # API routes, startup, CORS, CSV readers
│   ├── schemas.py                    # Pydantic v2 request/response models
│   ├── feature_engineering.py        # build_cu_features() & build_phi_features()
│   └── model_service.py              # ModelService: load, predict, explain (SHAP)
│
├── notebooks/                        # Jupyter ML pipeline
│   ├── Unified_Geotechnical_Modeling.ipynb  # Phase 0: Data extraction & harmonization
│   ├── Data_Cleaning.ipynb                  # Phase 1 (legacy): Atterberg cleaning
│   ├── Feature_Engineering.ipynb            # Phase 2 (legacy): LI, qc_est derivation
│   ├── Comparative_Analysis.ipynb           # Phase 3 (legacy): Multi-output comparison
│   ├── Cu_Target_Modeling.ipynb             # Phase 4a: Cu model training (PRODUCTION)
│   └── Phi_Target_Modeling.ipynb            # Phase 4b: Phi model training (PRODUCTION)
│
├── datasets/                         # Raw input data (10 Excel workbooks)
│   └── geotechnical_data_{0-9}.xlsx
│
├── outputs/                          # Trained artifacts & evaluation files
│   ├── cu_best_model.joblib          # ExtraTreesRegressor — Cu_kPa
│   ├── phi_best_model.joblib         # ExtraTreesRegressor — Phi_deg
│   ├── cu_model_comparison.csv       # CV results for all 6 Cu models
│   ├── phi_model_comparison.csv      # CV results for all 6 Phi models
│   ├── cu_feature_importance.csv     # Permutation importances — Cu
│   ├── phi_feature_importance.csv    # Permutation importances — Phi
│   ├── cu_oof_predictions.csv        # Out-of-fold predictions — Cu
│   ├── phi_oof_predictions.csv       # Out-of-fold predictions — Phi
│   ├── geotechnical_training_ready.csv       # Joint training dataset
│   ├── geotechnical_cu_training_ready.csv    # Cu-specific (227 rows × 11 cols)
│   ├── geotechnical_phi_training_ready.csv   # Phi-specific (228 rows × 11 cols)
│   └── geotechnical_modeling_dataset.csv     # Intermediate dataset
│
├── ui/                               # Frontend (TanStack Start + React 19)
│   ├── package.json                  # Dependencies & scripts (bun)
│   ├── vite.config.ts                # Vite 7 + TanStack Start + Tailwind + Nitro
│   ├── tsconfig.json                 # TypeScript strict, path alias @/* → ./src/*
│   ├── components.json               # shadcn/ui config (New York, slate, lucide)
│   ├── eslint.config.js              # ESLint + Prettier
│   ├── bunfig.toml                   # Bun configuration
│   ├── vercel.json                   # Vercel SPA rewrite rules
│   ├── wrangler.jsonc                # Cloudflare Workers config
│   ├── .env.sample                   # VITE_API_BASE_URL=
│   │
│   └── src/
│       ├── router.tsx                # TanStack Router factory with QueryClient
│       ├── server.ts                 # Cloudflare Workers entry (SSR error handling)
│       ├── start.ts                  # TanStack Start instance with error middleware
│       ├── styles.css                # Tailwind CSS 4 entry
│       ├── routeTree.gen.ts          # Auto-generated route tree (DO NOT EDIT)
│       │
│       ├── routes/                   # File-based routing
│       │   ├── __root.tsx            # Root layout (Navbar + Outlet + Footer)
│       │   ├── index.tsx             # Landing page (hero, benchmarks, feature pipeline, CTA)
│       │   └── predict.tsx           # Prediction form + gauge results + SHAP + visuals
│       │
│       ├── components/               # Custom components
│       │   ├── AlertBox.tsx          # Warning/info/success alert (lucide icons)
│       │   ├── ChartCard.tsx         # Card wrapper for chart containers (h-72)
│       │   ├── ChartTabs.tsx         # Tabbed charts (importance, distribution, avp)
│       │   ├── Footer.tsx            # Site footer with disclaimer
│       │   ├── InputField.tsx        # Labeled numeric input with unit
│       │   ├── Navbar.tsx            # Sticky nav with route links + theme toggle
│       │   ├── PredictionForm.tsx    # 8-field soil input form with defaults
│       │   ├── ResultCard.tsx        # Large-number display card for predictions
│       │   ├── ShapExplanation.tsx   # SHAP tabs (Cu/Phi) with table + bar + waterfall
│       │   ├── ThemeToggle.tsx       # Dark/light mode (localStorage + class toggle)
│       │   ├── TrainingVisuals.tsx   # Static training image cards
│       │   └── ui/                   # shadcn/ui primitives (DO NOT MANUALLY EDIT)
│       │
│       ├── lib/
│       │   ├── predict-api.ts        # API client: predictSoil(), types, error parsing
│       │   ├── utils.ts              # cn() — clsx + tailwind-merge
│       │   ├── error-capture.ts      # Global error/rejection capture for SSR
│       │   └── error-page.ts         # Static HTML error fallback page
│       │
│       └── hooks/
│           └── use-mobile.tsx        # Mobile breakpoint hook
│
├── actual_vs_predicted.png           # Training diagnostic chart
└── correlation_heatmap.png           # Feature correlation heatmap
```

---

## Backend API Reference (`app/`)

### API Routes

| Method | Path | Request Body | Response Model | Tag | Description |
|---|---|---|---|---|---|
| `GET` | `/` | — | `Dict` | — | Service info links (hidden from OpenAPI schema) |
| `GET` | `/health` | — | `HealthResponse` | Monitoring | Model/explainer load status |
| `POST` | `/predict/cu` | `CuPredictionRequest` | `PredictionResponse` | Prediction | Predict Cu_kPa only |
| `POST` | `/predict/phi` | `PhiPredictionRequest` | `PredictionResponse` | Prediction | Predict Phi_deg only |
| `POST` | `/predict` | `UnifiedPredictionRequest` | `UnifiedPredictionResponse` | Prediction | Predict both + SHAP |
| `POST` | `/explain` | `UnifiedPredictionRequest` | `ExplanationResponse` | Explanation | SHAP only (no predictions) |
| `GET` | `/model-info/cu` | — | `Dict` | Model Info | Cu model metadata + CSV data |
| `GET` | `/model-info/phi` | — | `Dict` | Model Info | Phi model metadata + CSV data |

### Pydantic Schema Hierarchy

```
SoilInputBase (7 fields: LL, PL, Sat_Unit_Wt_kN_m3, Mv_50kPa, Cv_50kPa, Fines_Content_pct, Sand_Fraction_pct)
├── CuPredictionRequest    (inherits 7 fields — no extras)
└── PhiPredictionRequest   (adds Gravel_Fraction_pct — 8 fields total)
    └── UnifiedPredictionRequest (same 8 fields — used for /predict and /explain)
```

**Response models:**
- `PredictionResponse`: `prediction`, `target`, `model`
- `UnifiedPredictionResponse`: `predictions` (cu_kpa, phi_deg), `models` (cu, phi), `shap` (ShapBundle)
- `ExplanationResponse`: `models`, `shap`
- `HealthResponse`: `status`, `cu_model_loaded`, `phi_model_loaded`, `cu_explainer_loaded`, `phi_explainer_loaded`
- `ShapBundle`: contains `cu` and `phi` ShapTargetExplanation objects
- `ShapTargetExplanation`: `base_value`, `features`, `positive`, `negative`, `bar`, `waterfall`, `summary`

### ModelService Lifecycle

1. **Startup:** `model_service.load()` called in FastAPI `startup_event`
2. **Load:** `joblib.load()` each `.joblib` → stores model + builds `shap.TreeExplainer`
3. **Predict:** `build_features(key, payload)` → `model.predict(features)` → scalar float
4. **Explain:** `explainer.shap_values(features)` → normalized → structured response with waterfall/bar/contribution data

### CORS Configuration
Currently hardcoded `allow_origins=["*"]`. The `.env.sample` has `CORS_ORIGINS=` but this is **not wired up** in `main.py`.

---

## Feature Engineering — CRITICAL INVARIANTS

> **The feature engineering in `app/feature_engineering.py` MUST exactly match the transformations used during model training in the notebooks. Any divergence causes silent prediction errors.**

### Cu_kPa Pipeline: 7 raw inputs → 15 model features

**Raw inputs:** LL, PL, Sat_Unit_Wt_kN_m3, Mv_50kPa, Cv_50kPa, Fines_Content_pct, Sand_Fraction_pct

**Engineered features (8):**

| Feature | Formula | Notes |
|---|---|---|
| `PI_calc` | `LL − PL` | Plasticity Index |
| `LL_to_PL_Ratio` | `LL / max(PL, 1e-6)` | Clipped denominator |
| `Plasticity_to_LL` | `PI_calc / max(LL, 1e-6)` | Clipped denominator |
| `Coarse_Fraction_pct` | `100 − Fines_Content_pct` | Complementary fraction |
| `Sand_to_Fines_Ratio` | `Sand / (Fines + 1)` | +1 prevents div-by-zero |
| `Cv_to_Mv_Ratio` | `Cv_50kPa / max(Mv_50kPa, 1e-6)` | Consolidation response |
| `Density_x_Fines` | `Sat_Unit_Wt_kN_m3 × Fines_Content_pct` | Interaction term |
| `Compression_x_Plasticity` | `Mv_50kPa × PI_calc` | Interaction term |

**Final column order (15):** `LL, PL, Sat_Unit_Wt_kN_m3, Mv_50kPa, Cv_50kPa, Fines_Content_pct, Sand_Fraction_pct, PI_calc, LL_to_PL_Ratio, Plasticity_to_LL, Coarse_Fraction_pct, Sand_to_Fines_Ratio, Cv_to_Mv_Ratio, Density_x_Fines, Compression_x_Plasticity`

### Phi_deg Pipeline: 8 raw inputs → 14 model features

**Raw inputs:** LL, PL, Sat_Unit_Wt_kN_m3, Mv_50kPa, Cv_50kPa, Fines_Content_pct, Sand_Fraction_pct, **Gravel_Fraction_pct**

**Engineered features (6):**

| Feature | Formula | Notes |
|---|---|---|
| `PI_calc` | `LL − PL` | Plasticity Index |
| `Plasticity_to_LL` | `PI_calc / max(LL, 1e-6)` | Clipped denominator |
| `Coarse_Fraction_pct` | `100 − Fines_Content_pct` | Complementary fraction |
| `Sand_to_Fines_Ratio` | `Sand / (Fines + 1)` | +1 prevents div-by-zero |
| `Gravel_to_Sand_Ratio` | `Gravel / (Sand + 1)` | Unique to Phi — granular sensitivity |
| `Mv_to_Cv_Ratio` | `Mv_50kPa / max(Cv_50kPa, 1e-6)` | **INVERSE of Cu's ratio** |
| `Density_x_Sand` | `Sat_Unit_Wt_kN_m3 × Sand_Fraction_pct` | **Different from Cu's Density_x_Fines** |

**Final column order (14):** `LL, PL, Sat_Unit_Wt_kN_m3, Mv_50kPa, Cv_50kPa, Fines_Content_pct, Sand_Fraction_pct, PI_calc, Plasticity_to_LL, Coarse_Fraction_pct, Sand_to_Fines_Ratio, Gravel_to_Sand_Ratio, Mv_to_Cv_Ratio, Density_x_Sand`

### Key Differences Between Cu and Phi Pipelines

| Aspect | Cu | Phi |
|---|---|---|
| Raw inputs | 7 fields | 8 fields (adds Gravel_Fraction_pct) |
| Output features | 15 columns | 14 columns |
| Consolidation ratio | `Cv_to_Mv_Ratio` | `Mv_to_Cv_Ratio` (inverted) |
| Density interaction | `Density_x_Fines` | `Density_x_Sand` |
| Has LL_to_PL_Ratio | ✅ Yes | ❌ No |
| Has Gravel_to_Sand_Ratio | ❌ No | ✅ Yes |
| Has Compression_x_Plasticity | ✅ Yes | ❌ No |

### Assertions
Both pipelines assert:
- No NaN values in the output DataFrame
- All values are finite (`np.isfinite`)
- Column order matches the defined `_CU_FEATURE_COLUMNS` / `_PHI_FEATURE_COLUMNS` list exactly

---

## Frontend Reference (`ui/`)

### Routes

| Path | File | Purpose |
|---|---|---|
| `/` | `routes/index.tsx` | Landing page — hero, benchmarks, feature pipeline, workflow steps, CTA |
| `/predict` | `routes/predict.tsx` | Prediction interface — form, gauge cards, SHAP explanation, training visuals |

### Component Data Flow (Predict Page)

```
PredictPage (state: loading, result, error)
├── PredictionForm ──► onSubmit(input) ──► predictSoil(input) ──► POST /predict
│   └── InputField × 8 (LL, PL, Sat_Unit_Wt, Mv, Cv, Fines, Sand, Gravel)
├── AlertBox (error or success)
├── ResultCard × 2 (Cu_kPa, Phi_deg)
├── ShapExplanation (tabs: Cu / Phi)
│   └── TargetView
│       ├── Summary (base_value, positive, negative, estimate)
│       ├── ContributionTable (ranked features)
│       ├── BarImportance (top 10 by |SHAP|)
│       └── WaterfallData (cumulative SHAP)
└── TrainingVisuals (static training images)
```

### API Client Configuration
- File: `ui/src/lib/predict-api.ts`
- Base URL: `import.meta.env.VITE_API_BASE_URL` ?? `"http://127.0.0.1:8000"`
- Endpoint: `POST /predict` with JSON body matching `PredictInput` (8 fields)
- Error handling: Parses FastAPI `detail` field from error responses

### Environment Variables
| Variable | File | Purpose | Default |
|---|---|---|---|
| `VITE_API_BASE_URL` | `ui/.env` | Backend API URL | `http://127.0.0.1:8000` |
| `CORS_ORIGINS` | `.env` | CORS allowed origins (NOT WIRED UP) | — |

### Styling Conventions
- **CSS framework:** Tailwind CSS 4 via `@tailwindcss/vite` plugin
- **Component library:** shadcn/ui New York variant with slate base color and CSS variables
- **Path alias:** `@/*` → `./src/*` (configured in tsconfig.json)
- **Icon library:** lucide-react
- **Theme:** Dark/light toggle via `dark` class on `<html>` + localStorage persistence
- **Font:** Inter (loaded from Google Fonts)

### SSR Architecture
- TanStack Start creates the SSR app via `createStart()` in `start.ts`
- Nitro handles server-side rendering with Cloudflare Workers compatibility
- `server.ts` is the Workers entry point with catastrophic SSR error normalization
- Error middleware catches unhandled errors and returns a branded HTML error page

### Auto-Generated Files (DO NOT MANUALLY EDIT)
- `src/routeTree.gen.ts` — Auto-generated by TanStack Router plugin from `routes/` directory

---

## ML Pipeline Reference (`notebooks/`)

### Two Pipeline Variants

The project contains two data pipeline lineages:

**Modern pipeline (PRODUCTION — generates the deployed models):**
1. `Unified_Geotechnical_Modeling.ipynb` — Reads 10 Excel workbooks, harmonizes headers/units, deduplicates (SHA-256), exports target-specific dense CSVs
2. `Cu_Target_Modeling.ipynb` — Cu-specific feature engineering, trains 6 models, exports best model
3. `Phi_Target_Modeling.ipynb` — Phi-specific feature engineering, trains 6 models, exports best model

**Legacy pipeline (research exploration — not used in production):**
1. `Data_Cleaning.ipynb` — Atterberg limits recovery from single raw CSV
2. `Feature_Engineering.ipynb` — LI, synthetic qc_est derivation, correlation heatmap
3. `Comparative_Analysis.ipynb` — Multi-output regression comparison (RF, HistGBR, SVR)

### Modern Pipeline Details

**Data flow:**
```
datasets/geotechnical_data_{0-9}.xlsx
    ↓ Unified_Geotechnical_Modeling.ipynb
outputs/geotechnical_cu_training_ready.csv  (227 rows × 11 cols, zero NaN)
outputs/geotechnical_phi_training_ready.csv (228 rows × 11 cols, zero NaN)
    ↓ Cu_Target_Modeling.ipynb / Phi_Target_Modeling.ipynb
outputs/cu_best_model.joblib + outputs/phi_best_model.joblib
outputs/*_model_comparison.csv + outputs/*_feature_importance.csv
```

**Models compared (6 per target):**

| Model | Configuration |
|---|---|
| Linear Regression | Pipeline(StandardScaler + LinearRegression) |
| Ridge Regression | Pipeline(StandardScaler + Ridge(α=1.0)) |
| Random Forest | n_estimators=400, min_samples_leaf=2 |
| Extra Trees | n_estimators=500, min_samples_leaf=2 |
| Gradient Boosting | learning_rate=0.05, n_estimators=300, max_depth=3 |
| XGBoost | n_estimators=300, learning_rate=0.05, max_depth=4, subsample=0.9 |

**Validation:** 5-fold shuffled KFold CV (RANDOM_STATE=42)  
**Metrics:** RMSE, MAE, R² (both CV-mean and OOF)  
**Feature importance:** Permutation importance (30 repeats) on best model

### Model Performance Summary

**Cu_kPa:**
| Model | OOF R² | OOF RMSE | OOF MAE |
|---|---|---|---|
| **Extra Trees ⭐** | **0.826** | **6.76** | **4.08** |
| XGBoost | 0.813 | 7.02 | 4.32 |
| Gradient Boosting | 0.799 | 7.27 | 4.56 |
| Random Forest | 0.776 | 7.69 | 4.82 |

**Phi_deg:**
| Model | OOF R² | OOF RMSE | OOF MAE |
|---|---|---|---|
| **Extra Trees ⭐** | **0.875** | **1.40** | **0.96** |
| XGBoost | 0.825 | 1.66 | 1.12 |
| Gradient Boosting | 0.796 | 1.79 | 1.22 |
| Random Forest | 0.775 | 1.88 | 1.29 |

### Top Predictive Features

**Cu_kPa:** LL (0.247), Cv_to_Mv_Ratio (0.167), PL (0.122), Cv_50kPa (0.058), Sand_Fraction_pct (0.042)

**Phi_deg:** Sat_Unit_Wt_kN_m3 (0.237), Mv_50kPa (0.133), PI_calc (0.100), Density_x_Sand (0.076), Gravel_to_Sand_Ratio (0.054)

---

## Development Workflows

### Backend Development

```bash
# Environment setup
python -m venv .venv
source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt

# Start dev server (auto-reload)
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# API docs (auto-generated)
# Swagger UI:  http://127.0.0.1:8000/docs
# ReDoc:       http://127.0.0.1:8000/redoc
```

### Frontend Development

```bash
cd ui

# Install dependencies
bun install

# Start dev server
bun run dev          # → vite dev

# Build for production
bun run build        # → vite build

# Preview production build
bun run preview      # → vite preview

# Lint & format
bun run lint         # → eslint .
bun run format       # → prettier --write .
```

### Full Pipeline Retrain

```bash
# 1. Merge raw Excel files
python datasets_merger.py
# → outputs geotechnical_master_raw.csv

# 2. Run notebooks in order:
#    a. notebooks/Unified_Geotechnical_Modeling.ipynb
#    b. notebooks/Cu_Target_Modeling.ipynb
#    c. notebooks/Phi_Target_Modeling.ipynb
# → outputs/*.joblib, outputs/*.csv

# 3. Restart API to load new models
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## Code Conventions

### Python (Backend)
- **Type hints** on all function signatures
- **Pydantic v2** for all request/response validation (BaseModel + Field)
- **FastAPI** tags for endpoint grouping: `Prediction`, `Monitoring`, `Explanation`, `Model Info`
- **Logging** via `logging.getLogger(__name__)`
- **Path resolution** via `pathlib.Path` relative to `__file__`
- **Error responses:** 503 for model not loaded, 422 for feature engineering errors
- **Division safety:** All ratios use `max(denominator, 1e-6)` or `denominator + 1` to prevent div-by-zero

### TypeScript (Frontend)
- **Strict mode** TypeScript (`strict: true` in tsconfig)
- **Path aliases:** `@/` → `./src/` for all imports
- **TanStack Router** file-based routing — add new routes in `src/routes/`
- **Component pattern:** Functional components with destructured props + explicit type annotations
- **State management:** `useState` for local state, React Query for server state
- **shadcn/ui:** Use `npx shadcn-ui@latest add <component>` to add new primitives — do not manually create files in `components/ui/`
- **Tailwind:** Use utility classes directly; use `cn()` from `lib/utils.ts` for conditional classes
- **Form defaults:** Default values provided in `PredictionForm.tsx` for quick testing

### Geotechnical Domain Rules
- **Atterberg consistency:** PI = LL − PL must always be positive
- **Gradation constraint:** Fines + Sand + Gravel should ≈ 100%
- **Physical bounds:** Phi_deg ∈ [0°, 50°], Cu_kPa ∈ [0, 500 kPa], Sat_Unit_Wt ∈ [10, 24.5 kN/m³]
- **Unit consistency:** All density values in kN/m³, all pressures in kPa, all consolidation in m²/year or m²/kN

---

## Critical Rules for AI Agents

1. **Never modify feature engineering without updating BOTH `app/feature_engineering.py` AND the corresponding notebook.** The feature transformations must be identical — same formulas, same column order, same clipping constants.

2. **Never edit `ui/src/routeTree.gen.ts`** — it is auto-generated by TanStack Router. Adding/removing route files in `src/routes/` will regenerate it automatically.

3. **Never manually edit files in `ui/src/components/ui/`** — these are shadcn/ui generated components. Use the shadcn CLI to add or update them.

4. **Column order matters.** The model's `feature_names_in_` must match the order defined in `_CU_FEATURE_COLUMNS` and `_PHI_FEATURE_COLUMNS` in `feature_engineering.py`. Reordering columns will cause silent prediction errors.

5. **The Cu and Phi feature pipelines intentionally differ.** Cu uses `Cv_to_Mv_Ratio` and `Density_x_Fines`; Phi uses the inverse `Mv_to_Cv_Ratio` and `Density_x_Sand`. This is by geotechnical design, not a bug.

6. **Model files in `outputs/` are binary artifacts.** They require the exact scikit-learn version used during training to deserialize correctly. Do not upgrade scikit-learn without retraining.

7. **The `.env.sample` `CORS_ORIGINS` variable is NOT functional.** CORS is hardcoded as `allow_origins=["*"]` in `main.py`. If restricting CORS, modify `main.py` directly.

8. **Preserve all existing comments and docstrings** unrelated to your changes.

9. **When adding new API endpoints**, follow the existing pattern: define Pydantic schemas in `schemas.py`, add route in `main.py`, handle errors with `_service_unavailable()` or `_feature_error()` helpers.

10. **When adding new frontend routes**, create the file in `ui/src/routes/` with `createFileRoute()` and add `head()` metadata for SEO. Update `Navbar.tsx` links array if navigation is needed.
