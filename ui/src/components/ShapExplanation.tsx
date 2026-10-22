import React, { useState } from "react";
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
import { ForcePlot } from "./ForcePlot";
import type { PredictResponse, ShapTarget, ShapContribution } from "@/lib/predict-api";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const axisStyle = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;
const gridColor = "var(--color-border)";
const POS_COLOR = "#10b981"; // emerald-500
const NEG_COLOR = "#f43f5e"; // rose-500

function SummaryStatsStrip({ data, unit }: { data: ShapTarget; unit: string }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Base Value */}
      <div className="rounded-lg border border-border/70 p-3.5 bg-muted/20 relative overflow-hidden">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Base Value E[f(X)]
          </span>
          <Target className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-xl font-bold text-foreground">{data.base_value.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Dataset global average expectation</p>
      </div>

      {/* Positive Pull */}
      <div className="rounded-lg border border-emerald-500/30 p-3.5 bg-emerald-500/5 relative overflow-hidden">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Positive Drivers
          </span>
          <TrendingUp className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            +{data.summary.total_positive.toFixed(2)}
          </span>
          <span className="text-xs text-emerald-600/70">{unit}</span>
        </div>
        <p className="text-[10px] text-emerald-600/80 mt-1">
          {data.positive.length} features increased strength
        </p>
      </div>

      {/* Negative Pull */}
      <div className="rounded-lg border border-rose-500/30 p-3.5 bg-rose-500/5 relative overflow-hidden">
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            Negative Drivers
          </span>
          <TrendingDown className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
            {data.summary.total_negative.toFixed(2)}
          </span>
          <span className="text-xs text-rose-600/70">{unit}</span>
        </div>
        <p className="text-[10px] text-rose-600/80 mt-1">
          {data.negative.length} features reduced strength
        </p>
      </div>

      {/* Net Outcome */}
      <div className="rounded-lg border border-primary/30 p-3.5 bg-primary/5 relative overflow-hidden">
        <div className="flex items-center justify-between text-primary mb-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            SHAP Estimation
          </span>
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-xl font-bold text-primary">
            {data.summary.prediction_estimate.toFixed(2)}
          </span>
          <span className="text-xs text-primary/70">{unit}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Base + Net Effect: {data.summary.net_effect >= 0 ? "+" : ""}
          {data.summary.net_effect.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

function ContributionTable({ data }: { data: ShapTarget }) {
  const [expanded, setExpanded] = useState(false);
  const rows = expanded ? data.features : data.features.slice(0, 6);

  return (
    <div className="rounded-lg border border-border/80 bg-card overflow-hidden shadow-xs">
      <div className="px-4 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Complete Feature SHAP Attribution Matrix
          </h4>
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">
          {data.features.length} features assessed
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/60">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Rank</th>
              <th className="px-4 py-2.5 text-left font-semibold">Feature Variable</th>
              <th className="px-4 py-2.5 text-right font-semibold">Input Value</th>
              <th className="px-4 py-2.5 text-right font-semibold">SHAP Impact Value</th>
              <th className="px-4 py-2.5 text-center font-semibold">Influence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-mono">
            {rows.map((row: ShapContribution) => (
              <tr
                key={`${row.rank}-${row.feature}`}
                className="hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-2 text-muted-foreground font-semibold">#{row.rank}</td>
                <td className="px-4 py-2 font-medium text-foreground">{row.feature}</td>
                <td className="px-4 py-2 text-right text-muted-foreground">
                  {row.value.toFixed(3)}
                </td>
                <td
                  className={`px-4 py-2 text-right font-semibold ${
                    row.shap_value >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {row.shap_value >= 0 ? "+" : ""}
                  {row.shap_value.toFixed(4)}
                </td>
                <td className="px-4 py-2 text-center">
                  <Badge
                    variant="outline"
                    className={`text-[9px] uppercase px-1.5 py-0 font-sans ${
                      row.impact === "positive"
                        ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                        : "text-rose-600 border-rose-500/30 bg-rose-500/10"
                    }`}
                  >
                    {row.impact}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.features.length > 6 && (
        <div className="p-2 border-t border-border/60 bg-muted/15 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Show Top 6 Only
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show All {data.features.length} Features
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function BarImportance({ data, unit }: { data: ShapTarget; unit: string }) {
  // Present top 8 features by absolute magnitude
  const chartData = data.bar.slice(0, 8);

  return (
    <ChartCard
      title="Top 8 Feature Attribution Magnitudes"
      description={`Ranked by absolute |SHAP| impact on ${unit} output.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={axisStyle} stroke={gridColor} />
          <YAxis
            type="category"
            dataKey="feature"
            tick={axisStyle}
            stroke={gridColor}
            width={135}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              borderColor: gridColor,
              borderRadius: "0.5rem",
              fontSize: "12px",
            }}
            formatter={(value: unknown) => [
              `${Number(value).toFixed(4)} ${unit}`,
              "Magnitude |SHAP|",
            ]}
          />
          <Bar dataKey="value" fill="var(--color-primary)" radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function WaterfallData({ data, unit }: { data: ShapTarget; unit: string }) {
  // Top 10 waterfall contributions
  const topWaterfall = data.waterfall.slice(0, 10);

  return (
    <ChartCard
      title="Feature Impact Direction (Top Drivers)"
      description={`Green indicates positive contribution; Red indicates reduction.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topWaterfall}
          layout="vertical"
          margin={{ left: 10, right: 20, top: 10, bottom: 10 }}
        >
          <CartesianGrid stroke={gridColor} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={axisStyle} stroke={gridColor} />
          <YAxis
            type="category"
            dataKey="feature"
            tick={axisStyle}
            stroke={gridColor}
            width={135}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              borderColor: gridColor,
              borderRadius: "0.5rem",
              fontSize: "12px",
            }}
            formatter={(val: unknown) => [
              `${Number(val) >= 0 ? "+" : ""}${Number(val).toFixed(4)} ${unit}`,
              "SHAP Force",
            ]}
          />
          <Bar dataKey="shap_value" radius={[0, 4, 4, 0]} barSize={16}>
            {topWaterfall.map((entry) => (
              <Cell key={entry.feature} fill={entry.shap_value >= 0 ? POS_COLOR : NEG_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function TargetView({
  data,
  unit,
  targetLabel,
}: {
  data: ShapTarget;
  unit: string;
  targetLabel: string;
}) {
  return (
    <div className="space-y-5">
      {/* 4-Stat Summary Strip */}
      <SummaryStatsStrip data={data} unit={unit} />

      {/* Hero Force Plot Tug-of-War */}
      <ForcePlot data={data} unit={unit} targetName={targetLabel} />

      {/* Dual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BarImportance data={data} unit={unit} />
        <WaterfallData data={data} unit={unit} />
      </div>

      {/* Complete Attribution Matrix (Accordion) */}
      <ContributionTable data={data} />
    </div>
  );
}

export function ShapExplanation({ data }: { data: PredictResponse["shap"] }) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-5 shadow-xs">
      <Tabs defaultValue="cu" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <BarChart2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                SHAP TreeExplainer Interpretability
              </h3>
              <p className="text-xs text-muted-foreground">
                Local feature contributions revealing the physical rationale behind each prediction.
              </p>
            </div>
          </div>

          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="cu" className="text-xs font-semibold px-4 py-1.5">
              Cu_kPa (Undrained Cohesion)
            </TabsTrigger>
            <TabsTrigger value="phi" className="text-xs font-semibold px-4 py-1.5">
              Phi_deg (Friction Angle)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="cu" className="mt-0 focus-visible:outline-none">
          <TargetView data={data.cu} unit="kPa" targetLabel="Cu (Undrained Cohesion)" />
        </TabsContent>

        <TabsContent value="phi" className="mt-0 focus-visible:outline-none">
          <TargetView data={data.phi} unit="deg" targetLabel="Phi (Internal Friction Angle)" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
