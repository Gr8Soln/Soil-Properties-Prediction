import React from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GaugeCardProps {
  label: string;
  value: number | null;
  unit: string;
  min?: number;
  max?: number;
  modelName?: string;
  targetKey: "cu" | "phi";
  description?: string;
}

function getGeotechnicalClassification(
  key: "cu" | "phi",
  val: number,
): { label: string; color: string } {
  if (key === "cu") {
    // Undrained shear strength (Cu in kPa)
    if (val < 20)
      return { label: "Very Soft", color: "text-amber-500 border-amber-500/30 bg-amber-500/10" };
    if (val < 40)
      return { label: "Soft", color: "text-blue-500 border-blue-500/30 bg-blue-500/10" };
    if (val < 75)
      return { label: "Firm", color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" };
    if (val < 150)
      return { label: "Stiff", color: "text-teal-600 border-teal-600/30 bg-teal-600/10" };
    return {
      label: "Very Stiff / Hard",
      color: "text-purple-600 border-purple-600/30 bg-purple-600/10",
    };
  } else {
    // Friction angle (Phi in degrees)
    if (val < 26)
      return { label: "Very Loose", color: "text-amber-500 border-amber-500/30 bg-amber-500/10" };
    if (val < 32)
      return { label: "Loose / Medium", color: "text-blue-500 border-blue-500/30 bg-blue-500/10" };
    if (val < 38)
      return {
        label: "Medium Dense",
        color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10",
      };
    if (val < 45)
      return { label: "Dense", color: "text-teal-600 border-teal-600/30 bg-teal-600/10" };
    return { label: "Very Dense", color: "text-purple-600 border-purple-600/30 bg-purple-600/10" };
  }
}

export function GaugeCard({
  label,
  value,
  unit,
  min = 0,
  max,
  modelName,
  targetKey,
  description,
}: GaugeCardProps) {
  const actualMax = max ?? (targetKey === "cu" ? 150 : 50);
  const normalizedValue = value !== null ? Math.min(Math.max(value, min), actualMax) : min;
  const percentage = value !== null ? ((normalizedValue - min) / (actualMax - min)) * 100 : 0;

  // Arc math for semi-circle: radius 80, center at (100, 95)
  // Arc from 180° to 360° (left to right)
  const radius = 70;
  const circumference = Math.PI * radius; // Half-circle perimeter ~ 219.9
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  const classification = value !== null ? getGeotechnicalClassification(targetKey, value) : null;

  return (
    <Card className="relative overflow-hidden border border-border/80 bg-gradient-to-b from-card/90 to-card shadow-sm hover:shadow-md transition-shadow">
      {/* Decorative top accent glow */}
      <div
        className={`absolute top-0 inset-x-0 h-1 ${
          targetKey === "cu"
            ? "bg-gradient-to-r from-blue-500 via-teal-500 to-indigo-500"
            : "bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500"
        }`}
      />

      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs max-w-xs">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {modelName && (
            <Badge variant="outline" className="font-mono text-[10px] tracking-tight bg-muted/40">
              <Sparkles className="h-2.5 w-2.5 mr-1 text-primary" />
              {modelName}
            </Badge>
          )}
        </div>

        {value === null ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground mb-3">
              <span className="text-xl">~</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Awaiting Prediction</p>
            <p className="text-xs text-muted-foreground/70 mt-1 max-w-[200px]">
              Fill in borehole parameters and click predict to calculate {label}.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-2">
            {/* SVG Radial Semi-Circle Gauge */}
            <div className="relative w-48 h-28 flex items-end justify-center">
              <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id={`gauge-grad-${targetKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    {targetKey === "cu" ? (
                      <>
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </>
                    ) : (
                      <>
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="60%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </>
                    )}
                  </linearGradient>
                </defs>

                {/* Background track */}
                <path
                  d="M 30 100 A 70 70 0 0 1 170 100"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  strokeLinecap="round"
                  className="text-muted/40"
                />

                {/* Animated value arc */}
                <motion.path
                  d="M 30 100 A 70 70 0 0 1 170 100"
                  fill="none"
                  stroke={`url(#gauge-grad-${targetKey})`}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                />

                {/* Gauge tick labels */}
                <text
                  x="24"
                  y="118"
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground font-mono"
                >
                  {min}
                </text>
                <text
                  x="176"
                  y="118"
                  textAnchor="middle"
                  className="text-[10px] fill-muted-foreground font-mono"
                >
                  {actualMax}
                </text>
              </svg>

              {/* Central Value Overlay */}
              <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
                    {value.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    {unit}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Geotechnical Classification Tag */}
            {classification && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.3 }}
                className="mt-3"
              >
                <Badge
                  variant="outline"
                  className={`text-xs px-2.5 py-0.5 border ${classification.color}`}
                >
                  Consistency: {classification.label}
                </Badge>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
