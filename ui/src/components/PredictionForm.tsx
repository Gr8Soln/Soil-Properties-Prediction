import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputField } from "./InputField";
import type { PredictInput } from "@/lib/predict-api";
import {
  Sparkles,
  RotateCcw,
  Compass,
  Layers,
  Scale,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const empty: Record<keyof PredictInput, number | ""> = {
  LL: "",
  PL: "",
  Sat_Unit_Wt_kN_m3: "",
  Mv_50kPa: "",
  Cv_50kPa: "",
  Fines_Content_pct: "",
  Sand_Fraction_pct: "",
  Gravel_Fraction_pct: "",
};

const presets: Record<string, { label: string; values: PredictInput }> = {
  default: {
    label: "Standard Laboratory Index (Sample #1)",
    values: {
      LL: 47,
      PL: 35.5,
      Sat_Unit_Wt_kN_m3: 18.84,
      Mv_50kPa: 0.47,
      Cv_50kPa: 0.85,
      Fines_Content_pct: 36.5,
      Sand_Fraction_pct: 62.7,
      Gravel_Fraction_pct: 0.8,
    },
  },
  clay: {
    label: "Plastic Silt-Clay",
    values: {
      LL: 58.2,
      PL: 29.4,
      Sat_Unit_Wt_kN_m3: 17.65,
      Mv_50kPa: 0.62,
      Cv_50kPa: 0.42,
      Fines_Content_pct: 78.0,
      Sand_Fraction_pct: 20.5,
      Gravel_Fraction_pct: 1.5,
    },
  },
  sand: {
    label: "Dense Silty Sand",
    values: {
      LL: 24.5,
      PL: 16.0,
      Sat_Unit_Wt_kN_m3: 20.15,
      Mv_50kPa: 0.18,
      Cv_50kPa: 2.15,
      Fines_Content_pct: 18.5,
      Sand_Fraction_pct: 74.0,
      Gravel_Fraction_pct: 7.5,
    },
  },
};

interface PredictionFormProps {
  onSubmit: (input: PredictInput) => void;
  loading: boolean;
}

export function PredictionForm({ onSubmit, loading }: PredictionFormProps) {
  const [form, setForm] = useState<typeof empty>({ ...presets.default.values });

  const set = (key: keyof typeof empty) => (value: number | "") =>
    setForm((current) => ({ ...current, [key]: value }));

  // Real-time calculated indicators
  const numLL = typeof form.LL === "number" ? form.LL : 0;
  const numPL = typeof form.PL === "number" ? form.PL : 0;
  const piCalc = form.LL !== "" && form.PL !== "" ? Number((numLL - numPL).toFixed(1)) : null;

  const numFines = typeof form.Fines_Content_pct === "number" ? form.Fines_Content_pct : 0;
  const numSand = typeof form.Sand_Fraction_pct === "number" ? form.Sand_Fraction_pct : 0;
  const numGravel = typeof form.Gravel_Fraction_pct === "number" ? form.Gravel_Fraction_pct : 0;
  const totalGradation =
    form.Fines_Content_pct !== "" ||
    form.Sand_Fraction_pct !== "" ||
    form.Gravel_Fraction_pct !== ""
      ? Number((numFines + numSand + numGravel).toFixed(1))
      : null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const values = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === "" ? 0 : Number(value)]),
    ) as unknown as PredictInput;
    onSubmit(values);
  };

  const loadPreset = (presetKey: string) => {
    if (presets[presetKey]) {
      setForm({ ...presets[presetKey].values });
    }
  };

  return (
    <Card className="border border-border/80 shadow-sm">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              <span>Borehole Lab Measurements</span>
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Provide index tests for automated dual-target shear strength inference.
            </CardDescription>
          </div>

          {/* Quick presets pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground mr-1">
              Presets:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadPreset("default")}
              className="h-7 text-xs px-2.5 bg-muted/30 hover:bg-muted font-normal"
            >
              Default
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadPreset("clay")}
              className="h-7 text-xs px-2.5 bg-muted/30 hover:bg-muted font-normal"
            >
              Clay-Rich
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadPreset("sand")}
              className="h-7 text-xs px-2.5 bg-muted/30 hover:bg-muted font-normal"
            >
              Silty Sand
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Atterberg Consistency */}
          <div className="rounded-lg border border-border/70 p-4 bg-muted/15 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                    Atterberg Limits & Plasticity
                  </h3>
                </div>
              </div>

              {piCalc !== null && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${
                    piCalc >= 0
                      ? "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/5"
                      : "text-rose-500 border-rose-500/30 bg-rose-500/5"
                  }`}
                >
                  Calculated PI: {piCalc}%
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <InputField
                id="LL"
                label="Liquid Limit (LL)"
                unit="%"
                value={form.LL}
                onChange={set("LL")}
                min={0}
                max={150}
                hint="Water content at liquid state boundary"
                tooltipText="Standard Casagrande or fall cone liquid limit. Typical range: 15% - 90%."
              />
              <InputField
                id="PL"
                label="Plastic Limit (PL)"
                unit="%"
                value={form.PL}
                onChange={set("PL")}
                min={0}
                max={80}
                hint="Water content at plastic state boundary"
                tooltipText="Lower moisture boundary of plasticity. Must be less than or equal to LL."
              />
            </div>
          </div>

          {/* Section 2: Grain Size Distribution */}
          <div className="rounded-lg border border-border/70 p-4 bg-muted/15 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Layers className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                    Soil Gradation Composition
                  </h3>
                </div>
              </div>

              {totalGradation !== null && (
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${
                    Math.abs(totalGradation - 100) < 1.5
                      ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/5"
                      : "text-amber-600 border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  Sum: {totalGradation}% {Math.abs(totalGradation - 100) >= 1.5 && "(~100% ideal)"}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InputField
                id="Fines_Content_pct"
                label="Fines Content"
                unit="%"
                value={form.Fines_Content_pct}
                onChange={set("Fines_Content_pct")}
                min={0}
                max={100}
                hint="Passing #200 sieve (<0.075mm)"
                tooltipText="Percentage of silt and clay fraction passing 75 micrometers."
              />
              <InputField
                id="Sand_Fraction_pct"
                label="Sand Fraction"
                unit="%"
                value={form.Sand_Fraction_pct}
                onChange={set("Sand_Fraction_pct")}
                min={0}
                max={100}
                hint="0.075mm to 4.75mm"
                tooltipText="Sand particle fraction by dry mass."
              />
              <InputField
                id="Gravel_Fraction_pct"
                label="Gravel Fraction"
                unit="%"
                value={form.Gravel_Fraction_pct}
                onChange={set("Gravel_Fraction_pct")}
                min={0}
                max={100}
                hint="Retained on 4.75mm sieve"
                tooltipText="Coarse granular fraction. Critical for Phi_deg friction angle estimation."
              />
            </div>
          </div>

          {/* Section 3: Physical & Consolidation Characteristics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Density */}
            <div className="rounded-lg border border-border/70 p-4 bg-muted/15 space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Scale className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                  In-Situ Density
                </h3>
              </div>

              <InputField
                id="Sat_Unit_Wt_kN_m3"
                label="Saturated Unit Weight (γ_sat)"
                unit="kN/m³"
                value={form.Sat_Unit_Wt_kN_m3}
                onChange={set("Sat_Unit_Wt_kN_m3")}
                min={10}
                max={25}
                hint="Typical: 16.0 - 22.0 kN/m³"
                tooltipText="Total unit weight of saturated soil specimen."
              />
            </div>

            {/* Consolidation */}
            <div className="rounded-lg border border-border/70 p-4 bg-muted/15 space-y-3.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-foreground">
                  Consolidation Mechanics
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <InputField
                  id="Mv_50kPa"
                  label="Mv @ 50kPa"
                  unit="m²/kN"
                  step="0.001"
                  value={form.Mv_50kPa}
                  onChange={set("Mv_50kPa")}
                  hint="Compressibility"
                  tooltipText="Coefficient of volume compressibility measured at 50 kPa stress level."
                />
                <InputField
                  id="Cv_50kPa"
                  label="Cv @ 50kPa"
                  unit="m²/yr"
                  step="0.01"
                  value={form.Cv_50kPa}
                  onChange={set("Cv_50kPa")}
                  hint="Consolidation rate"
                  tooltipText="Coefficient of consolidation rate measured at 50 kPa stress level."
                />
              </div>
            </div>
          </div>

          {/* Form Controls */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 text-sm font-semibold shadow-md transition-all predict-btn-pulse cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running ExtraTrees Inference & SHAP...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Soil Shear Strength Predictions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={loading}
              onClick={() => setForm({ ...empty })}
              className="h-11 px-4 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
