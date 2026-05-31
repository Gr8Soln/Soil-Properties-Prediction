import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "./ChartCard";
import type { PredictResponse, ShapTarget } from "@/lib/predict-api";

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;
const grid = "var(--color-border)";
const POS = "var(--color-chart-1)";
const NEG = "var(--color-destructive)";

function WaterfallChart({ data, unit }: { data: ShapTarget; unit: string }) {
  const sorted = [...data.local].sort((a, b) => Math.abs(b.shap) - Math.abs(a.shap));
  const final = data.base_value + sorted.reduce((s, d) => s + d.shap, 0);
  const rows = sorted.map((d) => ({
    name: `${d.feature} = ${d.value}`,
    shap: d.shap,
  }));

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Base value: <span className="font-mono text-foreground">{data.base_value.toFixed(2)} {unit}</span></span>
        <span>Final prediction: <span className="font-mono text-foreground">{final.toFixed(2)} {unit}</span></span>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid stroke={grid} horizontal={false} />
            <XAxis type="number" tick={axis} stroke={grid} />
            <YAxis type="category" dataKey="name" tick={axis} stroke={grid} width={150} />
            <Tooltip
              contentStyle={{ background: "var(--color-popover)", border: `1px solid ${grid}`, fontSize: 12 }}
              formatter={(v: any) => [`${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(3)} ${unit}`, "SHAP"]}
            />
            <Bar dataKey="shap" radius={[0, 2, 2, 0]}>
              {rows.map((r, i) => (
                <Cell key={i} fill={r.shap >= 0 ? POS : NEG} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GlobalChart({ data, unit }: { data: ShapTarget; unit: string }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data.global} layout="vertical" margin={{ left: 30 }}>
          <CartesianGrid stroke={grid} horizontal={false} />
          <XAxis type="number" tick={axis} stroke={grid} />
          <YAxis type="category" dataKey="feature" tick={axis} stroke={grid} width={130} />
          <Tooltip
            contentStyle={{ background: "var(--color-popover)", border: `1px solid ${grid}`, fontSize: 12 }}
            formatter={(v: any) => [`${Number(v).toFixed(3)} ${unit}`, "mean(|SHAP|)"]}
          />
          <Bar dataKey="mean_abs_shap" fill="var(--color-chart-2)" radius={[0, 2, 2, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BeeswarmChart({ data, unit }: { data: ShapTarget; unit: string }) {
  const features = data.global.map((g) => g.feature);
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ScatterChart margin={{ left: 30, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid stroke={grid} />
          <XAxis type="number" dataKey="shap" name="SHAP" tick={axis} stroke={grid} />
          <YAxis
            type="category"
            dataKey="feature"
            tick={axis}
            stroke={grid}
            width={130}
            domain={features}
          />
          <ZAxis type="number" dataKey="feature_value" range={[40, 120]} name="Feature value" />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            contentStyle={{ background: "var(--color-popover)", border: `1px solid ${grid}`, fontSize: 12 }}
            formatter={(v: any, n: any) =>
              n === "SHAP" ? [`${Number(v).toFixed(3)} ${unit}`, n] : [v, n]
            }
          />
          <Scatter data={data.beeswarm} fill="var(--color-chart-1)" fillOpacity={0.55} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function TargetView({ data, unit, label }: { data: ShapTarget; unit: string; label: string }) {
  return (
    <Tabs defaultValue="waterfall" className="w-full">
      <TabsList>
        <TabsTrigger value="waterfall">Local (Waterfall)</TabsTrigger>
        <TabsTrigger value="global">Global Importance</TabsTrigger>
        <TabsTrigger value="beeswarm">Beeswarm</TabsTrigger>
      </TabsList>

      <TabsContent value="waterfall" className="mt-4">
        <ChartCard
          title={`${label} — Local Explanation`}
          description="Each bar shows how a feature pushed this prediction above (positive) or below (negative) the model's base value."
        >
          <WaterfallChart data={data} unit={unit} />
        </ChartCard>
      </TabsContent>

      <TabsContent value="global" className="mt-4">
        <ChartCard
          title={`${label} — Global Feature Importance`}
          description="Mean absolute SHAP value across the validation set. Higher means the feature has more overall influence on the model."
        >
          <GlobalChart data={data} unit={unit} />
        </ChartCard>
      </TabsContent>

      <TabsContent value="beeswarm" className="mt-4">
        <ChartCard
          title={`${label} — Beeswarm Summary`}
          description="Distribution of SHAP values per feature across samples. Marker size encodes the underlying feature value."
        >
          <BeeswarmChart data={data} unit={unit} />
        </ChartCard>
      </TabsContent>
    </Tabs>
  );
}

export function ShapExplanation({ data }: { data: NonNullable<PredictResponse["charts"]["shap"]> }) {
  return (
    <Tabs defaultValue="cu" className="w-full">
      <TabsList>
        <TabsTrigger value="cu">CU (kPa)</TabsTrigger>
        <TabsTrigger value="phi">φ (deg)</TabsTrigger>
      </TabsList>
      <TabsContent value="cu" className="mt-4">
        <TargetView data={data.cu} unit="kPa" label="CU" />
      </TabsContent>
      <TabsContent value="phi" className="mt-4">
        <TargetView data={data.phi} unit="°" label="φ" />
      </TabsContent>
    </Tabs>
  );
}
