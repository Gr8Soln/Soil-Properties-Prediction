import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputField } from "./InputField";
import type { PredictInput } from "@/lib/predict-api";

const empty = {
  LL: "" as number | "",
  PL: "" as number | "",
  Sat_Unit_Wt_kN_m3: "" as number | "",
  Mv_50kPa: "" as number | "",
  Cv_50kPa: "" as number | "",
  Fines_Content_pct: "" as number | "",
  Sand_Fraction_pct: "" as number | "",
  Gravel_Fraction_pct: "" as number | "",
};

const defaults = {
  LL: 47,
  PL: 35.5,
  Sat_Unit_Wt_kN_m3: 18.84,
  Mv_50kPa: 0.47,
  Cv_50kPa: 0.85,
  Fines_Content_pct: 36.5,
  Sand_Fraction_pct: 62.7,
  Gravel_Fraction_pct: 0.8,
};

export function PredictionForm({
  onSubmit,
  loading,
}: {
  onSubmit: (input: PredictInput) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<typeof empty>({ ...defaults });

  const set = (key: keyof typeof empty) => (value: number | "") =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const values = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === "" ? 0 : value]),
    ) as PredictInput;
    onSubmit(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Soil Input Parameters</CardTitle>
        <p className="text-xs text-muted-foreground">
          Enter the laboratory measurements required by both prediction models.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField
              id="LL"
              label="Liquid Limit (LL)"
              unit="%"
              value={form.LL}
              onChange={set("LL")}
            />
            <InputField
              id="PL"
              label="Plastic Limit (PL)"
              unit="%"
              value={form.PL}
              onChange={set("PL")}
            />
            <InputField
              id="Sat_Unit_Wt_kN_m3"
              label="Saturated Unit Weight"
              unit="kN/m3"
              value={form.Sat_Unit_Wt_kN_m3}
              onChange={set("Sat_Unit_Wt_kN_m3")}
            />
            <InputField
              id="Mv_50kPa"
              label="Mv at 50 kPa"
              unit="m2/kN"
              value={form.Mv_50kPa}
              onChange={set("Mv_50kPa")}
            />
            <InputField
              id="Cv_50kPa"
              label="Cv at 50 kPa"
              unit="m2/year"
              value={form.Cv_50kPa}
              onChange={set("Cv_50kPa")}
            />
            <InputField
              id="Fines_Content_pct"
              label="Fines Content"
              unit="%"
              value={form.Fines_Content_pct}
              onChange={set("Fines_Content_pct")}
            />
            <InputField
              id="Sand_Fraction_pct"
              label="Sand Fraction"
              unit="%"
              value={form.Sand_Fraction_pct}
              onChange={set("Sand_Fraction_pct")}
            />
            <InputField
              id="Gravel_Fraction_pct"
              label="Gravel Fraction"
              unit="%"
              value={form.Gravel_Fraction_pct}
              onChange={set("Gravel_Fraction_pct")}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Predicting..." : "Predict"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm({ ...empty })}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
