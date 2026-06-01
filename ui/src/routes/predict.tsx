import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PredictionForm } from "@/components/PredictionForm";
import { ResultCard } from "@/components/ResultCard";
import { TrainingVisuals } from "@/components/TrainingVisuals";
import { ShapExplanation } from "@/components/ShapExplanation";
import { AlertBox } from "@/components/AlertBox";
import { predictSoil, type PredictInput, type PredictResponse } from "@/lib/predict-api";

export const Route = createFileRoute("/predict")({
  head: () => ({
    meta: [
      { title: "Predict CU & Phi - Soil Properties Prediction" },
      {
        name: "description",
        content:
          "Enter soil index properties and predict Undrained Cohesion and Angle of Internal Friction.",
      },
      { property: "og:title", content: "Predict CU & Phi" },
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
      const response = await predictSoil(input);
      setResult(response);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Prediction failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Soil Properties Prediction</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provide soil laboratory properties once to estimate CU (kPa) and Phi (degrees).
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

          {result && !error && (
            <AlertBox variant="success" title="Prediction generated successfully">
              Both models returned predictions and SHAP explanations.
            </AlertBox>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <ResultCard
              label="CU Prediction"
              value={result?.predictions.cu_kpa ?? null}
              unit="kPa"
              description={`Undrained cohesion (${result?.models.cu ?? "model pending"})`}
            />
            <ResultCard
              label="Phi Prediction"
              value={result?.predictions.phi_deg ?? null}
              unit="deg"
              description={`Angle of internal friction (${result?.models.phi ?? "model pending"})`}
            />
          </div>
        </div>
      </div>

      {result?.shap && (
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-semibold tracking-tight">
            Model Interpretability (SHAP)
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Positive values push the prediction upward; negative values pull it downward.
          </p>
          <ShapExplanation data={result.shap} />
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
