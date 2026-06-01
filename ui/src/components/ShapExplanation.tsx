import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "./ChartCard";
import type { PredictResponse, ShapTarget } from "@/lib/predict-api";

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;
const grid = "var(--color-border)";
const POS = "var(--color-chart-1)";
const NEG = "var(--color-destructive)";

function ContributionTable({ data }: { data: ShapTarget }) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-foreground">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Rank</th>
            <th className="px-3 py-2 text-left font-medium">Feature</th>
            <th className="px-3 py-2 text-right font-medium">Value</th>
            <th className="px-3 py-2 text-right font-medium">SHAP Contribution</th>
            <th className="px-3 py-2 text-left font-medium">Impact</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {data.features.map((row) => (
            <tr key={`${row.rank}-${row.feature}`} className="border-t border-border">
              <td className="px-3 py-2 text-foreground">{row.rank}</td>
              <td className="px-3 py-2 font-mono text-xs text-foreground">{row.feature}</td>
              <td className="px-3 py-2 text-right">{row.value.toFixed(3)}</td>
              <td
                className={
                  row.shap_value >= 0
                    ? "px-3 py-2 text-right text-emerald-600"
                    : "px-3 py-2 text-right text-destructive"
                }
              >
                {row.shap_value >= 0 ? "+" : ""}
                {row.shap_value.toFixed(4)}
              </td>
              <td className="px-3 py-2 capitalize">{row.impact}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BarImportance({ data }: { data: ShapTarget }) {
  return (
    <ChartCard
      title="SHAP Bar Data"
      description="Features ranked by absolute contribution magnitude."
    >
      <ResponsiveContainer>
        <BarChart data={data.bar.slice(0, 10)} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid stroke={grid} horizontal={false} />
          <XAxis type="number" tick={axis} stroke={grid} />
          <YAxis type="category" dataKey="feature" tick={axis} stroke={grid} width={140} />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: `1px solid ${grid}`,
              fontSize: 12,
            }}
            formatter={(value: number) => [Number(value).toFixed(4), "abs(SHAP)"]}
          />
          <Bar dataKey="value" fill="var(--color-chart-2)" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function WaterfallData({ data }: { data: ShapTarget }) {
  return (
    <ChartCard
      title="Waterfall Data"
      description={`Base value ${data.base_value.toFixed(3)}; estimate ${data.summary.prediction_estimate.toFixed(3)}.`}
    >
      <ResponsiveContainer>
        <BarChart data={data.waterfall} layout="vertical" margin={{ left: 40 }}>
          <CartesianGrid stroke={grid} horizontal={false} />
          <XAxis type="number" tick={axis} stroke={grid} />
          <YAxis type="category" dataKey="feature" tick={axis} stroke={grid} width={140} />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: `1px solid ${grid}`,
              fontSize: 12,
            }}
            formatter={(value: number) => [
              `${Number(value) >= 0 ? "+" : ""}${Number(value).toFixed(4)}`,
              "SHAP",
            ]}
          />
          <Bar dataKey="shap_value" radius={[0, 2, 2, 0]}>
            {data.waterfall.map((row) => (
              <Cell key={row.feature} fill={row.shap_value >= 0 ? POS : NEG} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function Summary({ data, unit }: { data: ShapTarget; unit: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="rounded-md border border-border p-3">
        <p className="text-xs text-muted-foreground">Base value</p>
        <p className="font-mono text-sm">
          {data.base_value.toFixed(3)} {unit}
        </p>
      </div>
      <div className="rounded-md border border-border p-3">
        <p className="text-xs text-muted-foreground">Positive impact</p>
        <p className="font-mono text-sm text-emerald-600">
          +{data.summary.total_positive.toFixed(3)}
        </p>
      </div>
      <div className="rounded-md border border-border p-3">
        <p className="text-xs text-muted-foreground">Negative impact</p>
        <p className="font-mono text-sm text-destructive">
          {data.summary.total_negative.toFixed(3)}
        </p>
      </div>
      <div className="rounded-md border border-border p-3">
        <p className="text-xs text-muted-foreground">SHAP estimate</p>
        <p className="font-mono text-sm">
          {data.summary.prediction_estimate.toFixed(3)} {unit}
        </p>
      </div>
    </div>
  );
}

function TargetView({ data, unit }: { data: ShapTarget; unit: string }) {
  return (
    <div className="space-y-4">
      <Summary data={data} unit={unit} />
      <ContributionTable data={data} />
      <div className="grid gap-4 lg:grid-cols-2">
        <BarImportance data={data} />
        <WaterfallData data={data} />
      </div>
    </div>
  );
}

export function ShapExplanation({ data }: { data: PredictResponse["shap"] }) {
  return (
    <Tabs defaultValue="cu" className="w-full">
      <TabsList>
        <TabsTrigger value="cu">CU (kPa)</TabsTrigger>
        <TabsTrigger value="phi">Phi (deg)</TabsTrigger>
      </TabsList>
      <TabsContent value="cu" className="mt-4">
        <TargetView data={data.cu} unit="kPa" />
      </TabsContent>
      <TabsContent value="phi" className="mt-4">
        <TargetView data={data.phi} unit="deg" />
      </TabsContent>
    </Tabs>
  );
}
