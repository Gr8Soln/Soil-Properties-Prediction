import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PredictionForm } from "@/components/PredictionForm";
import { ResultCard } from "@/components/ResultCard";
import { ChartTabs } from "@/components/ChartTabs";
import { TrainingVisuals } from "@/components/TrainingVisuals";
import { ShapExplanation } from "@/components/ShapExplanation";
import { AlertBox } from "@/components/AlertBox";
import { predictSoil, type PredictInput, type PredictResponse } from "@/lib/predict-api";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict CU & φ — Soil Properties Prediction" },
      {
        name: "description",
        content: "Enter soil index properties and predict Undrained Cohesion and Angle of Internal Friction.",
      },
      { property: "og:title", content: "Predict CU & φ" },
    ],
  }),
  component: PredictPage,
});

function PredictPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (input: PredictInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await predictSoil(input);
      setResult(res);
    } catch (e: any) {
      setError(e?.message ?? "Prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Soil Properties Prediction</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide soil index properties to estimate CU (kPa) and φ (degrees).
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <PredictionForm onSubmit={handle} loading={loading} />

        <div className="space-y-4">
          {error && (
            <AlertBox variant="warning" title="Prediction error">
              {error}
            </AlertBox>
          )}

          {result && result.warnings.length > 0 && (
            <AlertBox variant="warning" title="Input range warning">
              <ul className="mt-1 list-disc pl-4">
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </AlertBox>
          )}

          {result && result.warnings.length === 0 && (
            <AlertBox variant="success" title="Prediction generated successfully">
              All inputs fall within the training distribution.
            </AlertBox>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <ResultCard
              label="CU Prediction"
              value={result?.prediction.cu ?? null}
              unit="kPa"
              description="Undrained cohesion"
            />
            <ResultCard
              label="φ Prediction"
              value={result?.prediction.phi ?? null}
              unit="°"
              description="Angle of internal friction"
            />
          </div>
        </div>
      </div>

      {result && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold tracking-tight">Model Diagnostics</h2>
          <ChartTabs data={result.charts} />
        </section>
      )}

      {result?.charts.shap && (
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-semibold tracking-tight">Model Interpretability (SHAP)</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            SHAP (SHapley Additive exPlanations) attributes each prediction to its input features.
            Positive values push the prediction above the base value; negative values pull it below.
          </p>
          <ShapExplanation data={result.charts.shap} />
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-1 text-xl font-semibold tracking-tight">Training Visualizations</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Figures generated during model training and dataset exploration.
        </p>
        <TrainingVisuals />
      </section>
    </div>
  );
}
