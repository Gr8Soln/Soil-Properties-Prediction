import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "./ChartCard";
import type { PredictResponse } from "@/lib/predict-api";

const axis = { fontSize: 11, fill: "var(--color-muted-foreground)" } as const;
const grid = "var(--color-border)";

export function ChartTabs({ data }: { data: PredictResponse["charts"] }) {
  const max = Math.max(...data.actual_vs_predicted.flatMap((d) => [d.actual, d.predicted]));
  const refLine = Array.from({ length: 2 }, (_, i) => ({ x: i * max, y: i * max }));

  return (
    <Tabs defaultValue="importance" className="w-full">
      <TabsList>
        <TabsTrigger value="importance">Feature Importance</TabsTrigger>
        <TabsTrigger value="distribution">Dataset Distribution</TabsTrigger>
        <TabsTrigger value="avp">Actual vs Predicted</TabsTrigger>
      </TabsList>

      <TabsContent value="importance" className="mt-4">
        <ChartCard title="Feature Importance" description="Relative contribution of each input feature.">
          <ResponsiveContainer>
            <BarChart data={data.feature_importance} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke={grid} horizontal={false} />
              <XAxis type="number" tick={axis} stroke={grid} />
              <YAxis type="category" dataKey="name" tick={axis} stroke={grid} width={110} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: `1px solid ${grid}`,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="var(--color-chart-1)" radius={[0, 2, 2, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </TabsContent>

      <TabsContent value="distribution" className="mt-4">
        <ChartCard title="Dataset Distribution" description="Sample count per bin from the training set.">
          <ResponsiveContainer>
            <BarChart data={data.distribution}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="name" tick={axis} stroke={grid} />
              <YAxis tick={axis} stroke={grid} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: `1px solid ${grid}`,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="var(--color-chart-2)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </TabsContent>

      <TabsContent value="avp" className="mt-4">
        <ChartCard title="Actual vs Predicted" description="Validation scatter against the 1:1 reference line.">
          <ResponsiveContainer>
            <ComposedChart>
              <CartesianGrid stroke={grid} />
              <XAxis type="number" dataKey="actual" name="Actual" tick={axis} stroke={grid} />
              <YAxis type="number" dataKey="predicted" name="Predicted" tick={axis} stroke={grid} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: `1px solid ${grid}`,
                  fontSize: 12,
                }}
              />
              <Scatter data={data.actual_vs_predicted} fill="var(--color-chart-1)" />
              <Line
                data={refLine}
                dataKey="y"
                stroke="var(--color-muted-foreground)"
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </TabsContent>
    </Tabs>
  );
}
