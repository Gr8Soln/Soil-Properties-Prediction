import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputField } from "./InputField";
import type { PredictInput } from "@/lib/predict-api";

const empty = {
  LL: "" as number | "",
  PL: "" as number | "",
  PI: "" as number | "",
  MC: "" as number | "",
  bulkDensity: "" as number | "",
  specificGravity: "" as number | "",
};

const defaults = {
  LL: 45, PL: 22, PI: 23, MC: 18, bulkDensity: 1.85, specificGravity: 2.68,
};

export function PredictionForm({
  onSubmit,
  loading,
}: {
  onSubmit: (input: PredictInput) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<typeof empty>({ ...defaults });

  const set = (k: keyof typeof empty) => (v: number | "") => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v === "" ? 0 : v]),
    ) as PredictInput;
    onSubmit(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Soil Input Parameters</CardTitle>
        <p className="text-xs text-muted-foreground">
          Enter laboratory index properties. Defaults shown reflect typical clay samples.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InputField id="LL" label="Liquid Limit (LL)" unit="%" value={form.LL} onChange={set("LL")} />
            <InputField id="PL" label="Plastic Limit (PL)" unit="%" value={form.PL} onChange={set("PL")} />
            <InputField id="PI" label="Plasticity Index (PI)" unit="%" value={form.PI} onChange={set("PI")} />
            <InputField id="MC" label="Moisture Content (MC)" unit="%" value={form.MC} onChange={set("MC")} />
            <InputField id="BD" label="Bulk Density" unit="g/cm³" value={form.bulkDensity} onChange={set("bulkDensity")} />
            <InputField id="SG" label="Specific Gravity" unit="—" value={form.specificGravity} onChange={set("specificGravity")} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Predicting…" : "Predict"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm({ ...empty })}
            >
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
