import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Beaker, BarChart3, Database, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soil Properties Prediction System | CU & φ ML Tool" },
      {
        name: "description",
        content:
          "A research-driven geotechnical engineering tool for predicting CU and φ from soil index properties using machine learning.",
      },
      { property: "og:title", content: "Soil Properties Prediction System" },
      {
        property: "og:description",
        content:
          "Predict undrained cohesion (CU) and angle of internal friction (φ) from soil index properties.",
      },
    ],
  }),
  component: Index,
});

const featureCards = [
  {
    icon: Beaker,
    title: "CU Prediction Model",
    body: "Predicts undrained cohesion (CU) values based on geotechnical soil index parameters. The model supports rapid estimation for cohesive soil strength analysis and early-stage design evaluation.",
  },
  {
    icon: BarChart3,
    title: "φ (Phi) Prediction Model",
    body: "Estimates the angle of internal friction (φ) using engineered soil features. This parameter is essential for analyzing shear resistance and stability in granular and mixed soil conditions.",
  },
  {
    icon: Database,
    title: "Data Preparation & Feature Engineering",
    body: "The dataset undergoes structured cleaning, transformation, and feature engineering to improve learning performance and preserve consistency with established geotechnical relationships.",
  },
  {
    icon: CheckCircle2,
    title: "Evaluation & Visualization",
    body: "Model performance is assessed using standard regression metrics and visual comparisons such as actual vs predicted plots, correlation analysis, and feature contribution summaries.",
  },
];

const steps = [
  {
    n: "01",
    title: "Input Soil Parameters",
    body: "Users provide soil index properties obtained from field or laboratory tests.",
  },
  {
    n: "02",
    title: "Preprocessing & Validation",
    body: "The system validates the input ranges and applies preprocessing to ensure compatibility with the trained model.",
  },
  {
    n: "03",
    title: "Machine Learning Inference",
    body: "Trained regression models generate predicted values for CU and φ in real time.",
  },
  {
    n: "04",
    title: "Results & Interpretability",
    body: "Outputs are presented with supporting charts to improve understanding, reliability, and decision confidence.",
  },
];

const previews = [
  { src: "/static/actual_vs_predicted.png", title: "Actual vs Predicted" },
  { src: "/static/correlation_heatmap.png", title: "Correlation Heatmap" },
  { src: "/static/phi_cu_image.png", title: "Feature Relationships" },
];

function Index() {
  return (
    <div>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Geotechnical · Machine Learning
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            Soil Properties Prediction Using Machine Learning
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            A research-driven geotechnical engineering tool for predicting key shear strength
            parameters (CU and φ) from soil index properties.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            This system applies supervised learning techniques to estimate soil strength
            characteristics, supporting faster preliminary analysis and improved decision-making in
            geotechnical investigations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/predict">
                Start Prediction <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/research">View Research Summary</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About / Project Overview */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Project Overview</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>
              Soil characterization is a critical stage in geotechnical engineering, influencing
              the design and safety of foundations, retaining structures, and earthworks. However,
              laboratory determination of shear strength parameters can be time-consuming, costly,
              and constrained by limited testing resources. This project presents a machine
              learning-based approach for predicting two key soil parameters—undrained cohesion
              (CU) and the angle of internal friction (φ)—using routinely measured soil index
              properties.
            </p>
            <p>
              The proposed system is developed as part of an academic research study and is
              designed to provide reliable predictive support for preliminary geotechnical
              assessment, while maintaining transparency through performance visualization and
              interpretability outputs.
            </p>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Key Features</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featureCards.map((c) => (
              <Card key={c.title}>
                <CardHeader className="pb-2">
                  <c.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="mt-2 text-base">{c.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Prediction Workflow</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-md border border-border bg-card p-5">
                <div className="font-mono text-xs text-primary">{s.n}</div>
                <div className="mt-2 font-semibold text-foreground">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Abstract */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Research Abstract</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            <p>
              Accurate estimation of soil shear strength parameters is fundamental to geotechnical
              engineering design and stability assessment. Traditional laboratory testing
              procedures, while reliable, are often resource-intensive and may limit rapid
              evaluation during early project stages. This study explores the application of
              machine learning regression techniques for predicting undrained cohesion (CU) and
              the angle of internal friction (φ) using soil index properties and engineered
              geotechnical features.
            </p>
            <p>
              The proposed approach integrates data preprocessing, feature engineering, and model
              evaluation using established performance metrics. The resulting predictive system is
              implemented as an interactive web-based tool to support practical usability and
              demonstrate model effectiveness through visualization outputs. The tool is intended
              for preliminary analysis and academic research applications, with emphasis on
              transparency, interpretability, and reproducibility.
            </p>
          </div>
        </div>
      </section>

      {/* Chart preview */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Model Performance Visualization</h2>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
            To ensure interpretability and research transparency, the system provides performance
            charts including actual vs predicted comparisons, correlation heatmaps, and feature
            importance summaries. These visual outputs support model validation and highlight the
            relationship between soil input parameters and predicted strength properties.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {previews.map((p) => (
              <figure
                key={p.title}
                className="overflow-hidden rounded-md border border-border bg-card"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-muted">
                  <span className="text-xs text-muted-foreground">{p.title} preview</span>
                  <img
                    src={p.src}
                    alt={p.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <figcaption className="border-t border-border px-3 py-2 text-xs font-medium text-foreground">
                  {p.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Begin a Prediction Session</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Use the prediction interface to input soil parameters and generate CU and φ estimates
            instantly. Results are accompanied by supporting charts to enhance interpretability
            and academic reporting.
          </p>
          <div className="mt-6">
            <Button asChild size="lg">
              <Link to="/predict">
                Go to Prediction Page <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
