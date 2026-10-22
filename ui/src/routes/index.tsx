import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Cpu,
  BarChart3,
  Layers,
  Activity,
  Compass,
  CheckCircle2,
  FileCheck2,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Soil Properties Predictive Suite | Precision Geotechnical ML" },
      {
        name: "description",
        content:
          "Advanced machine learning pipeline predicting soil shear strength parameters (Cu and φ) from borehole index properties with SHAP explainability.",
      },
      { property: "og:title", content: "Soil Properties Predictive Suite" },
    ],
  }),
  component: IndexPage,
});

// Benchmark data directly from the empirical training comparisons
const cuBenchmarks = [
  { model: "Extra Trees Regressor", r2: 0.826, rmse: "6.76 kPa", mae: "4.08 kPa", winner: true },
  { model: "XGBoost Regressor", r2: 0.813, rmse: "7.02 kPa", mae: "4.32 kPa", winner: false },
  { model: "Gradient Boosting", r2: 0.799, rmse: "7.27 kPa", mae: "4.56 kPa", winner: false },
  { model: "Random Forest", r2: 0.776, rmse: "7.69 kPa", mae: "4.82 kPa", winner: false },
  { model: "Linear Regression", r2: 0.465, rmse: "11.86 kPa", mae: "9.03 kPa", winner: false },
  { model: "Ridge Regression", r2: 0.469, rmse: "11.82 kPa", mae: "9.10 kPa", winner: false },
];

const phiBenchmarks = [
  { model: "Extra Trees Regressor", r2: 0.875, rmse: "1.40°", mae: "0.96°", winner: true },
  { model: "XGBoost Regressor", r2: 0.825, rmse: "1.66°", mae: "1.12°", winner: false },
  { model: "Gradient Boosting", r2: 0.796, rmse: "1.79°", mae: "1.22°", winner: false },
  { model: "Random Forest", r2: 0.775, rmse: "1.88°", mae: "1.29°", winner: false },
  { model: "Linear Regression", r2: 0.585, rmse: "2.56°", mae: "2.00°", winner: false },
  { model: "Ridge Regression", r2: 0.471, rmse: "2.89°", mae: "2.33°", winner: false },
];

const rawParameters = [
  {
    symbol: "LL",
    name: "Liquid Limit",
    unit: "%",
    desc: "Water content at plastic-to-liquid boundary",
  },
  {
    symbol: "PL",
    name: "Plastic Limit",
    unit: "%",
    desc: "Water content at semi-solid-to-plastic boundary",
  },
  {
    symbol: "γ_sat",
    name: "Saturated Unit Weight",
    unit: "kN/m³",
    desc: "Bulk density under fully saturated in-situ state",
  },
  {
    symbol: "Mv",
    name: "Volume Compressibility",
    unit: "m²/kN",
    desc: "Strain per unit stress increase measured @ 50 kPa",
  },
  {
    symbol: "Cv",
    name: "Consolidation Coefficient",
    unit: "m²/yr",
    desc: "Rate of pore water dissipation measured @ 50 kPa",
  },
  {
    symbol: "Fines",
    name: "Fines Fraction",
    unit: "%",
    desc: "Percentage passing 75 µm sieve (<0.075 mm)",
  },
  {
    symbol: "Sand",
    name: "Sand Fraction",
    unit: "%",
    desc: "Medium granular soil particles (0.075 - 4.75 mm)",
  },
  {
    symbol: "Gravel",
    name: "Gravel Fraction",
    unit: "%",
    desc: "Coarse granular soil particles (>4.75 mm)",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Borehole Lab Testing",
    desc: "Collect standard index measurements (Atterberg limits, sieve gradation, consolidation, and unit weight) from field sampling.",
  },
  {
    step: "02",
    title: "Consistency Validation",
    desc: "Automated verification ensures physical bounds consistency: PI = LL - PL > 0 and gradation percentages sum to ~100%.",
  },
  {
    step: "03",
    title: "Ensemble ML Inference",
    desc: "Trained ExtraTrees regressors derive 14-15 non-linear geotechnical interaction features and compute simultaneous predictions.",
  },
  {
    step: "04",
    title: "Explainability & Reporting",
    desc: "SHAP TreeExplainer attributes positive and negative physical drivers with actionable consistency classifications.",
  },
];

function IndexPage() {
  const [activeTab, setActiveTab] = useState<"cu" | "phi">("cu");

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ── 1. Hero Section ── */}
      <section className="relative predict-header-gradient border-b border-border/70 overflow-hidden pt-16 pb-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="space-y-6 max-w-3xl">
            {/* Top pill badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Production ML Engine v1.1.0 · ExtraTrees Dual Ensemble</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-foreground"
            >
              Predict Soil Shear Strength with{" "}
              <span className="bg-gradient-to-r from-primary via-teal-500 to-indigo-500 bg-clip-text text-transparent">
                Research-Grade
              </span>{" "}
              Precision
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl"
            >
              Estimate critical geotechnical parameters—
              <span className="font-semibold text-foreground">
                Undrained Cohesion (Cu)
              </span> and{" "}
              <span className="font-semibold text-foreground">Internal Friction Angle (φ)</span>
              —directly from routine borehole index measurements with zero feature drift and
              game-theoretic SHAP explainability.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Button
                asChild
                size="lg"
                className="h-12 px-6 text-sm font-semibold shadow-md predict-btn-pulse"
              >
                <Link to="/predict">
                  <span>Launch Prediction Suite</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="h-12 px-5 text-sm font-medium">
                <a href="#benchmarks">View Model Benchmarks</a>
              </Button>
            </motion.div>
          </div>

          {/* Metric Stat Ribbon */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-xs p-4 shadow-xs">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                φ Friction Angle
              </p>
              <div className="mt-1 flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-extrabold text-foreground">0.875</span>
                <span className="text-xs font-bold text-emerald-600">OOF R²</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                RMSE: 1.40° · MAE: 0.96°
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-xs p-4 shadow-xs">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cu Undrained Cohesion
              </p>
              <div className="mt-1 flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-extrabold text-foreground">0.826</span>
                <span className="text-xs font-bold text-emerald-600">OOF R²</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                RMSE: 6.76 kPa · MAE: 4.08 kPa
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-xs p-4 shadow-xs">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Validation Rigor
              </p>
              <div className="mt-1 flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-extrabold text-primary">5-Fold</span>
                <span className="text-xs font-semibold text-muted-foreground">Shuffled CV</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Zero sample leakage & group verified
              </p>
            </div>

            <div className="rounded-xl border border-border/80 bg-card/80 backdrop-blur-xs p-4 shadow-xs">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Feature Pipeline
              </p>
              <div className="mt-1 flex items-baseline gap-1 font-mono">
                <span className="text-3xl font-extrabold text-foreground">15</span>
                <span className="text-xs font-semibold text-muted-foreground">Engineered</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Non-linear interaction ratios
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2. Dual Target Architecture ── */}
      <section className="py-16 sm:py-20 border-b border-border/70 px-4">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="outline" className="font-mono text-xs">
              Geotechnical Targets
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Two Essential Soil Shear Parameters
            </h2>
            <p className="text-sm text-muted-foreground">
              Shear strength dictates soil stability under load. The suite estimates both
              fundamental components.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cu Card */}
            <Card className="border border-border/80 bg-card relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold font-mono text-base">
                    Cu
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs text-blue-600 border-blue-500/30"
                  >
                    Range: 0 - 500 kPa
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Undrained Shear Strength (Cu)
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                    Cohesive Soils · Short-Term Loading
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Measures the shear resistance of fine-grained saturated clays and silts before
                  pore water pressure can dissipate. Essential for evaluating foundation bearing
                  capacity, slope stability during rapid construction, and deep excavations.
                </p>

                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Key Predictive Drivers (SHAP)
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded-sm bg-muted/60 text-foreground">
                      Liquid Limit (LL)
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-muted/60 text-foreground">
                      Cv/Mv Consolidation Ratio
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-muted/60 text-foreground">
                      Density × Fines
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-muted/60 text-foreground">
                      Plastic Limit (PL)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phi Card */}
            <Card className="border border-border/80 bg-card relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-amber-500" />
              <CardContent className="p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold font-mono text-base">
                    φ
                  </div>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs text-emerald-600 border-emerald-500/30"
                  >
                    Range: 0 - 50°
                  </Badge>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    Angle of Internal Friction (Phi)
                  </h3>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
                    Granular & Mixed Soils · Effective Stress
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Represents the frictional resistance and particle interlocking that occurs between
                  soil grains under normal compressive stress. Crucial for retaining wall lateral
                  earth pressures, slope equilibrium, and long-term drained stability.
                </p>

                <div className="pt-2 border-t border-border/60">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Key Predictive Drivers (SHAP)
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    <span className="px-2 py-0.5 rounded-sm bg-muted/60 text-foreground">
                      Saturated Unit Wt (γ_sat)
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-muted/60 text-foreground">
                      Compressibility (Mv)
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-muted/60 text-foreground">
                      Density × Sand
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-muted/60 text-foreground">
                      Gravel/Sand Ratio
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── 3. Empirical Model Benchmarks Section ── */}
      <section
        id="benchmarks"
        className="py-16 sm:py-20 border-b border-border/70 px-4 bg-muted/15"
      >
        <div className="mx-auto max-w-6xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <Badge variant="outline" className="font-mono text-xs">
                5-Fold Cross-Validation Study
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Model Performance & Algorithm Comparison
              </h2>
              <p className="text-sm text-muted-foreground max-w-xl">
                Rigorous evaluation across 6 regression algorithms on 228 verified borehole records
                using out-of-fold metrics.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "cu" | "phi")}>
              <TabsList className="bg-background border border-border">
                <TabsTrigger value="cu" className="text-xs font-semibold px-4">
                  Cu (kPa) Benchmark
                </TabsTrigger>
                <TabsTrigger value="phi" className="text-xs font-semibold px-4">
                  φ (deg) Benchmark
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-border/80 bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Algorithm</th>
                    <th className="px-5 py-3 text-right font-semibold">OOF R²</th>
                    <th className="px-5 py-3 text-right font-semibold">OOF RMSE</th>
                    <th className="px-5 py-3 text-right font-semibold">OOF MAE</th>
                    <th className="px-5 py-3 text-center font-semibold">Model Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-mono">
                  {(activeTab === "cu" ? cuBenchmarks : phiBenchmarks).map((row) => (
                    <tr
                      key={row.model}
                      className={`hover:bg-muted/20 transition-colors ${
                        row.winner ? "bg-primary/5 font-semibold" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 flex items-center gap-2 font-sans font-medium text-foreground text-xs sm:text-sm">
                        {row.winner && <Sparkles className="h-4 w-4 text-primary shrink-0" />}
                        <span>{row.model}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-foreground text-xs sm:text-sm">
                        {row.r2.toFixed(3)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground text-xs sm:text-sm">
                        {row.rmse}
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground text-xs sm:text-sm">
                        {row.mae}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        {row.winner ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">
                            Selected Champion ⭐
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-sans">
                            Evaluated Baseline
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-muted/20 border-t border-border/60 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
              <span className="font-sans">
                ⭐ <strong>ExtraTreesRegressor</strong> proved optimal for both targets due to
                randomized tree splits mitigating high covariance.
              </span>
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary gap-1">
                <Link to="/predict">
                  Test Champion Models <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Zero-Drift Feature Engineering Pipeline Section ── */}
      <section id="pipeline" className="py-16 sm:py-20 border-b border-border/70 px-4">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="outline" className="font-mono text-xs">
              Domain Feature Derivation
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              8 Standard Lab Inputs ➔ 15 Engineered Predictors
            </h2>
            <p className="text-sm text-muted-foreground">
              Raw measurements alone lack mechanical interaction terms. The pipeline engineers
              domain-specific geotechnical features identical to training notebooks.
            </p>
          </div>

          {/* 8 Raw Inputs Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Measured Laboratory Inputs Required
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {rawParameters.map((p) => (
                <div
                  key={p.symbol}
                  className="rounded-lg border border-border/80 bg-card p-3.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-primary">{p.symbol}</span>
                    <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-xs">
                      {p.unit}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">{p.name}</h4>
                  <p className="text-[10px] text-muted-foreground leading-tight">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Derived Features Highlight Cards */}
          <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/5 via-card to-primary/5 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Key Engineered Non-Linear Ratios & Interactions
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="rounded-lg border border-border/60 bg-background/80 p-3.5 space-y-1">
                <span className="text-primary font-bold">PI_calc = LL - PL</span>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Atterberg plasticity span; dictates cohesive yield criteria.
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/80 p-3.5 space-y-1">
                <span className="text-primary font-bold">Cv / Mv Ratio</span>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Couples permeability and soil skeleton stiffness response.
                </p>
              </div>

              <div className="rounded-lg border border-border/60 bg-background/80 p-3.5 space-y-1">
                <span className="text-primary font-bold">γ_sat × Sand Fraction</span>
                <p className="text-[11px] font-sans text-muted-foreground">
                  Effective granular density governing internal friction angle (φ).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. 4-Stage Workflow ── */}
      <section className="py-16 sm:py-20 border-b border-border/70 px-4 bg-muted/15">
        <div className="mx-auto max-w-6xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Badge variant="outline" className="font-mono text-xs">
              Engineering Lifecycle
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              From Lab Tests to Validated Output
            </h2>
            <p className="text-sm text-muted-foreground">
              A streamlined, transparent sequence designed for preliminary site assessments.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflowSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-xl border border-border/80 bg-card p-5 relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <span className="font-mono text-2xl font-extrabold text-primary/40 block mb-2">
                    {step.step}
                  </span>
                  <h4 className="text-sm font-bold text-foreground mb-1.5">{step.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center text-[11px] font-semibold text-primary">
                  <span>Phase {step.step}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Final Call to Action ── */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary/10 text-primary items-center justify-center mx-auto">
            <Compass className="h-6 w-6" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Ready to Analyze Borehole Soil Parameters?
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Enter your index test values into the interactive suite to generate instantaneous
            predictions, radial consistency gauges, and SHAP game-theoretic force plots.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 px-7 text-sm font-semibold shadow-lg predict-btn-pulse"
            >
              <Link to="/predict">
                <span>Start Prediction Session</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
