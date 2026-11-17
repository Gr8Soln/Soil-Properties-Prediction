import React, { useState } from "react";
import { motion } from "motion/react";
import type { ShapTarget } from "@/lib/predict-api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface ForcePlotProps {
  data: ShapTarget;
  unit: string;
  targetName: string;
}

export function ForcePlot({ data, unit, targetName }: ForcePlotProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // Take top positive and top negative features for clean visualization
  const topPositive = data.positive.slice(0, 4);
  const topNegative = data.negative.slice(0, 4);

  const totalPos = data.summary.total_positive;
  const totalNeg = Math.abs(data.summary.total_negative);
  const totalImpact = totalPos + totalNeg || 1;

  return (
    <div className="rounded-lg border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
      {/* Header bar with summary values */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <span>Force Tug-of-War (SHAP Breakdown)</span>
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            How features pushed {targetName} from baseline to final prediction
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-[10px] uppercase font-sans">Base:</span>
            <span className="font-semibold text-foreground">{data.base_value.toFixed(2)}</span>
          </div>
          <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-sans text-muted-foreground">Output:</span>
            <span className="font-bold text-primary">
              {data.summary.prediction_estimate.toFixed(2)} {unit}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Force Balance Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Positive Drivers (+{totalPos.toFixed(2)})</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <span>Negative Drivers (-{totalNeg.toFixed(2)})</span>
            <TrendingDown className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Proportional Tug-of-war segmented bar */}
        <div className="h-9 w-full rounded-md overflow-hidden flex bg-muted/60 p-1 gap-1 border border-border/40 shadow-inner">
          {/* Positive segments (pushing right/up) */}
          <div
            className="flex h-full gap-0.5"
            style={{ width: `${(totalPos / totalImpact) * 100}%` }}
          >
            {topPositive.map((f, i) => {
              const segPct = (f.shap_value / totalPos) * 100;
              const isHovered = activeFeature === f.feature;
              return (
                <TooltipProvider key={f.feature} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        onMouseEnter={() => setActiveFeature(f.feature)}
                        onMouseLeave={() => setActiveFeature(null)}
                        className={`h-full rounded-xs flex items-center justify-center text-[10px] font-mono font-medium px-1.5 cursor-pointer truncate transition-all ${
                          isHovered
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-emerald-500/85 hover:bg-emerald-500 text-white"
                        }`}
                        style={{ width: `${segPct}%`, minWidth: segPct > 10 ? "40px" : "12px" }}
                      >
                        <span className="truncate">{f.feature}</span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold text-emerald-500 font-mono">
                        +{f.shap_value.toFixed(4)} {unit}
                      </p>
                      <p className="text-muted-foreground">
                        {f.feature} = {f.value.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">
                        Pushes prediction higher
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Center Dividing Notch */}
          <div className="w-[2px] h-full bg-foreground/40 self-center" />

          {/* Negative segments (pushing left/down) */}
          <div
            className="flex h-full gap-0.5"
            style={{ width: `${(totalNeg / totalImpact) * 100}%` }}
          >
            {topNegative.map((f, i) => {
              const segPct = (Math.abs(f.shap_value) / totalNeg) * 100;
              const isHovered = activeFeature === f.feature;
              return (
                <TooltipProvider key={f.feature} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        onMouseEnter={() => setActiveFeature(f.feature)}
                        onMouseLeave={() => setActiveFeature(null)}
                        className={`h-full rounded-xs flex items-center justify-center text-[10px] font-mono font-medium px-1.5 cursor-pointer truncate transition-all ${
                          isHovered
                            ? "bg-rose-500 text-white shadow-xs"
                            : "bg-rose-500/85 hover:bg-rose-500 text-white"
                        }`}
                        style={{ width: `${segPct}%`, minWidth: segPct > 10 ? "40px" : "12px" }}
                      >
                        <span className="truncate">{f.feature}</span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p className="font-semibold text-rose-500 font-mono">
                        {f.shap_value.toFixed(4)} {unit}
                      </p>
                      <p className="text-muted-foreground">
                        {f.feature} = {f.value.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">
                        Pulls prediction lower
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Legend / Tip */}
        <p className="text-[11px] text-muted-foreground/80 text-center pt-1">
          Hover over each segment to inspect feature values and individual SHAP forces.
        </p>
      </div>
    </div>
  );
}
