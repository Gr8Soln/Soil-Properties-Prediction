# CLAUDE.md

Final-year project: predict soil shear strength (`Cu_kPa`, `Phi_deg`) from laboratory
index tests. Training pipeline in `training/`, FastAPI service in `app/`, React UI in `ui/`.

**Read `AGENT.md` first** — architecture, data, results and conventions live there.

## Commands

```bash
source .venv/bin/activate
python -m training.train        # retrain + compare all models (~10 min), rewrites outputs/
python -m training.report       # figures -> outputs/figures/
pytest                          # data, feature-parity and API tests
uvicorn app.main:app --reload   # API on :8000
cd ui && bun run dev            # UI
```

## Rules that are easy to break

1. **One feature implementation.** `app/feature_engineering.py` is used by both training
   and the API. Never re-implement a feature in `training/` or a notebook.
2. **Never quote a shuffled-CV score on its own.** Each workbook is one site; shuffled
   folds leak site information and roughly double R². The unseen-site
   (leave-one-site-out) score is the headline and picks the deployed model.
3. **Models are chosen by the pipeline, not by hand.** `outputs/*_best_model.joblib` and
   `outputs/*_model_meta.json` are written together by `training.train`; the API reads
   the metadata to know which features to build. Do not edit or replace one without the other.
4. **Saved models are tied to the pinned scikit-learn / xgboost versions** in
   `requirements.txt`. Changing either means retraining.
5. Do not hand-edit `ui/src/routeTree.gen.ts` or `ui/src/components/ui/*` (generated).
6. `datasets/*.xlsx` are the raw data. Do not modify them.
