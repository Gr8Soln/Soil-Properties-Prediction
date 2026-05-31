import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Summary — Soil Properties Prediction" },
      {
        name: "description",
        content: "Methodology, dataset, models, and validation metrics for the CU and φ prediction system.",
      },
    ],
  }),
  component: ResearchPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function ResearchPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Research Summary</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Machine Learning Prediction of Undrained Cohesion and Angle of Internal Friction
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A geotechnical research study presenting model architecture, dataset preparation, and
          validation results.
        </p>
      </header>

      <div className="space-y-10">
        <Section title="Abstract">
          We present a supervised machine learning framework that estimates two key shear-strength
          parameters of soil — undrained cohesion (CU) and angle of internal friction (φ) — directly
          from index properties commonly obtained in routine laboratory testing. The system aims to
          accelerate preliminary geotechnical assessments while maintaining engineering interpretability.
        </Section>

        <Section title="Methodology">
          Inputs include Atterberg limits, moisture content, bulk density, specific gravity, and depth.
          The pipeline performs outlier removal, standard scaling, and stratified train-test splits
          before training gradient-boosted regressors and random forests. Hyperparameters are tuned
          via k-fold cross-validation.
        </Section>

        <Section title="Dataset Description">
          The dataset aggregates published geotechnical investigations and in-house records, comprising
          over 1,200 samples spanning cohesive and granular soils. Distributions and missingness are
          reported in the supplementary documentation.
        </Section>

        <Section title="Models Used">
          <ul className="mt-1 list-disc pl-5">
            <li>Random Forest Regressor</li>
            <li>Gradient Boosted Trees (XGBoost / LightGBM)</li>
            <li>Multilayer Perceptron baseline</li>
          </ul>
        </Section>

        <Section title="Metrics">
          <div className="mt-2 overflow-hidden rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-foreground">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Target</th>
                  <th className="px-4 py-2 text-left font-medium">R²</th>
                  <th className="px-4 py-2 text-left font-medium">RMSE</th>
                  <th className="px-4 py-2 text-left font-medium">MAE</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-t border-border">
                  <td className="px-4 py-2 text-foreground">CU (kPa)</td>
                  <td className="px-4 py-2">0.87</td>
                  <td className="px-4 py-2">5.42</td>
                  <td className="px-4 py-2">3.91</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-4 py-2 text-foreground">φ (degrees)</td>
                  <td className="px-4 py-2">0.81</td>
                  <td className="px-4 py-2">2.96</td>
                  <td className="px-4 py-2">2.12</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Limitations">
          Predictions extrapolate poorly outside the training distribution; users should treat
          warnings on the prediction page seriously. The dataset under-represents organic and
          highly plastic soils.
        </Section>

        <Section title="Future Work">
          Expansion to triaxial and direct-shear test outputs, integration of in-situ test results
          (CPT, SPT), and explicit uncertainty quantification via conformal prediction.
        </Section>
      </div>
    </article>
  );
}
