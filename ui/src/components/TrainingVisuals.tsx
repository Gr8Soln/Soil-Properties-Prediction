import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  {
    src: "/static/actual_vs_predicted.png",
    title: "Actual vs Predicted (Random Forest, 5-Fold OOF)",
    desc: "Out-of-fold validation for both targets. φ: R²=0.724, MAE=1.75, RMSE=2.81. CU: R²=0.776, MAE=5.61, RMSE=8.70.",
  },
  {
    src: "/static/correlation_heatmap.png",
    title: "Feature Correlation Matrix (incl. Targets)",
    desc: "Pearson correlations across engineered features and targets Phi_deg, Cu_kPa.",
  },
  {
    src: "/static/cu_image.png",
    title: "CU (kPa) — Distribution & Feature Correlations",
    desc: "Target distribution, engineered-feature Pearson correlations with Cu_kPa, and the raw-feature heatmap.",
  },
  {
    src: "/static/phi_image.png",
    title: "φ (deg) — Distribution & Feature Correlations",
    desc: "Target distribution, engineered-feature Pearson correlations with Phi_deg, and the raw-feature heatmap.",
  },
  {
    src: "/static/phi_cu_image.png",
    title: "Dataset Overview — φ, CU, and Source Workbooks",
    desc: "Distributions of Phi_deg and Cu_kPa alongside row counts contributed by each source workbook.",
  },
];

export function TrainingVisuals() {
  return (
    <div className="grid gap-6">
      {items.map((it) => (
        <Card key={it.src}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{it.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{it.desc}</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border border-border bg-background">
              <img
                src={it.src}
                alt={it.title}
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
