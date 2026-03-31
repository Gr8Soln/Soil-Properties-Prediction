# Geotechnical Shear Strength Predictive Suite

**Senior ML Engineer Deliverable**  
An end-to-end machine learning pipeline for predicting soil shear strength parameters from borehole data.

---

## 🎯 Project Overview

This suite predicts two critical geotechnical parameters:
- **Angle of Internal Friction (φ)** - Measures soil's resistance to shearing
- **Undrained Cohesion (Cu)** - Measures soil's shear strength under undrained conditions

The pipeline processes 10 disparate borehole datasets, applies geotechnical domain logic, engineers behavioral features, and compares three distinct ML algorithms.

---

## 📦 Project Structure

```
geotechnical-ml-suite/
│
├── borehole_merger.py              # Phase 1: Data unification script
├── Data_Cleaning.ipynb             # Phase 2: Geotechnical cleaning logic
├── Feature_Engineering.ipynb       # Phase 3: Advanced feature derivation
├── Comparative_Analysis.ipynb      # Phase 4: ML modeling & evaluation
├── requirements.txt                # Python dependencies
│
├── geotechnical_master_raw.csv     # Output from Phase 1
├── geotechnical_cleaned.csv        # Output from Phase 2
├── geotechnical_engineered.csv     # Output from Phase 3
│
└── models/                         # Trained models (Phase 4 output)
    ├── model_random_forest.pkl
    ├── model_xgboost.pkl
    ├── model_svr.pkl
    ├── model_scaler.pkl
    └── feature_names.pkl
```

---

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Prepare Your Data

Place your borehole CSV files in `/mnt/user-data/uploads/`:
- `geotechnical_data_0.csv`
- `geotechnical_data_1.csv`
- ...
- `geotechnical_data_9.csv`

**Required columns** (names can vary - script handles mapping):
- Atterberg Limits: `LL`, `PL`, `PI`
- Fines Content: `Fines_Content` or `Grain_75um`
- Unit Weight: `Unit_Weight` or `Bulk_Density`
- Targets: `Angle_Internal_Friction` (φ), `Undrained_Cohesion` (Cu)

### 3. Run the Pipeline

#### Phase 1: Data Merging
```bash
python borehole_merger.py
```
**Output:** `geotechnical_master_raw.csv`

#### Phase 2: Data Cleaning
```bash
jupyter notebook Data_Cleaning.ipynb
```
**Key operations:**
- Atterberg consistency validation ($PI = LL - PL$)
- Non-plastic soil handling
- Physical boundary outlier removal
- Unit standardization (kPa, kN/m³)

**Output:** `geotechnical_cleaned.csv`

#### Phase 3: Feature Engineering
```bash
jupyter notebook Feature_Engineering.ipynb
```
**Derived features:**
- Liquidity Index: $LI = \frac{W_n - PL}{LL - PL}$
- Synthetic CPT from SPT: $q_c \approx 0.4 \times N$ (cohesive), $0.6 \times N$ (granular)
- Activity Ratio, Consistency Index

**Output:** `geotechnical_engineered.csv`

#### Phase 4: Model Training & Comparison
```bash
jupyter notebook Comparative_Analysis.ipynb
```
**Models evaluated:**
1. **Random Forest** - Ensemble baseline
2. **XGBoost** - Gradient boosting precision
3. **SVR (RBF Kernel)** - Non-linear kernel method

**Outputs:**
- Performance metrics (R², MAE, RMSE)
- Actual vs. Predicted plots
- Feature importance rankings
- Serialized models (`.pkl` files)

---

## 📊 Expected Results

### Model Performance Benchmarks
Based on typical geotechnical datasets:

| Model          | φ (R²) | Cu (R²) | Training Time |
|----------------|--------|---------|---------------|
| Random Forest  | 0.75+  | 0.70+   | Fast          |
| XGBoost        | 0.80+  | 0.75+   | Medium        |
| SVR (RBF)      | 0.65+  | 0.65+   | Slow          |

*Note: Actual performance depends on data quality and completeness.*

### Top Predictive Features
Typically include:
1. Liquidity Index (LI)
2. Plasticity Index (PI)
3. CPT resistance (qc)
4. Fines Content
5. Unit Weight

---

## 🏗️ Architecture Principles

### Clean Architecture for Production SaaS

The codebase follows modular design:

```python
# Example: Using the trained model in production
import pickle

# Load trained model
with open('models/model_xgboost.pkl', 'rb') as f:
    model = pickle.load(f)

with open('models/model_scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)

# New borehole sample
new_sample = {
    'LL': 45, 'PL': 20, 'PI': 25,
    'Moisture_Content': 30, 'Unit_Weight': 18.5,
    'CPT_qc_unified': 2500, 'Liquidity_Index': 0.4,
    # ... other features
}

# Preprocess
X_new = scaler.transform([list(new_sample.values())])

# Predict
phi, cu = model.predict(X_new)[0]
print(f"Predicted φ: {phi:.2f}°")
print(f"Predicted Cu: {cu:.2f} kPa")
```

---

## 🧪 Validation Strategy

### 5-Fold Cross-Validation
All models undergo rigorous 5-fold CV to ensure:
- Generalization to unseen data
- Robustness against overfitting
- Stable performance metrics

### Geotechnical Domain Validation
- Physical boundary enforcement (φ: 0-50°, Cu: 0-500 kPa)
- Atterberg consistency checks
- Unit standardization to SI conventions

---

## 📈 Future Enhancements

1. **Ensemble Stacking**: Combine all three models for improved accuracy
2. **Uncertainty Quantification**: Add prediction intervals using bootstrapping
3. **Spatial Modeling**: Incorporate geostatistical kriging for spatial interpolation
4. **Deep Learning**: Experiment with neural networks for complex soil profiles
5. **Real-time API**: Deploy as REST API with FastAPI/Flask
6. **Automated Reporting**: Generate PDF reports with visualizations

---

## 🔧 Troubleshooting

### Common Issues

**Issue:** `FileNotFoundError` when running `borehole_merger.py`  
**Solution:** Ensure CSV files are in `/mnt/user-data/uploads/` with correct naming pattern.

**Issue:** Low R² scores  
**Solution:** 
- Check target variable completeness (need sufficient non-null samples)
- Verify feature quality (too many missing values degrade performance)
- Consider feature selection (remove low-correlation features)

**Issue:** Model training is very slow  
**Solution:**
- Reduce `n_estimators` for RF/XGBoost
- Use smaller dataset for prototyping
- Enable parallel processing: `n_jobs=-1`

---

## 📚 Technical References

### Geotechnical Formulas

**Liquidity Index:**
$$LI = \frac{W_n - PL}{LL - PL}$$

**SPT-CPT Correlations:**
- Cohesive soils: $q_c \approx 0.4 \times N$ (MPa)
- Granular soils: $q_c \approx 0.6 \times N$ (MPa)

### Literature
- Terzaghi, K., Peck, R. B., & Mesri, G. (1996). *Soil Mechanics in Engineering Practice*.
- Robertson, P. K. (2009). *Interpretation of cone penetration tests—a unified approach*.
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

**Last Updated:** March 2026  
**Pipeline Version:** 1.0.0
