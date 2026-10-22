import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Maximize2, Image as ImageIcon, ChevronRight } from "lucide-react";

interface VisualItem {
  id: string;
  src: string;
  category: string;
  title: string;
  desc: string;
  highlight: string;
}

const items: VisualItem[] = [
  {
    id: "avp",
    src: "/static/actual_vs_predicted.png",
    category: "Cross-Validation",
    title: "Actual vs Predicted (5-Fold Shuffled OOF)",
    desc: "Out-of-fold generalization performance across the full borehole training corpus. 1:1 reference diagonal demonstrates strong alignment with zero overfitting artifacts.",
    highlight: "Cu R² = 0.826 · Phi R² = 0.875",
  },
  {
    id: "heatmap",
    src: "/static/correlation_heatmap.png",
    category: "Feature Correlation",
    title: "Geotechnical Covariance & Feature Matrix",
    desc: "Pearson correlation coefficient matrix between engineered index features and both shear strength targets.",
    highlight: "Identifies collinearity & interactions",
  },
  {
    id: "cu",
    src: "/static/cu_image.png",
    category: "Target Distribution",
    title: "Cu_kPa (Undrained Cohesion) Diagnostic Suite",
    desc: "Target probability density distribution, single-feature Pearson correlation coefficients with Cu, and raw laboratory correlation heatmap.",
    highlight: "Primary driver: Liquid Limit (LL)",
  },
  {
    id: "phi",
    src: "/static/phi_image.png",
    category: "Target Distribution",
    title: "Phi_deg (Friction Angle) Diagnostic Suite",
    desc: "Friction angle probability density distribution, feature correlation coefficients with Phi, and raw laboratory correlation heatmap.",
    highlight: "Primary driver: Saturated Unit Wt (γ_sat)",
  },
  {
    id: "overview",
    src: "/static/phi_cu_image.png",
    category: "Data Integrity",
    title: "Dataset Distribution & Source Workbook Contributions",
    desc: "Composite distribution of both geotechnical targets paired with sample counts harmonized across all 10 borehole workbooks.",
    highlight: "10 Workbooks · 228 Validated Records",
  },
];

export function TrainingVisuals() {
  const [activeItem, setActiveItem] = useState<VisualItem>(items[0]);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center text-foreground">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Model Training & Geotechnical Research Diagnostics
            </h3>
            <p className="text-xs text-muted-foreground">
              Empirical figures generated during exploratory data analysis and 5-fold
              cross-validation.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="font-mono text-[10px]">
          5 Visualizations Available
        </Badge>
      </div>

      {/* Main Interactive Gallery Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Thumbnails / Selector Column */}
        <div className="lg:col-span-4 space-y-2">
          {items.map((item) => {
            const isSelected = activeItem.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-2 ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/30"
                    : "border-border/60 hover:border-border hover:bg-muted/20"
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.category}
                    </span>
                  </div>
                  <h4
                    className={`text-xs font-semibold truncate ${isSelected ? "text-primary" : "text-foreground"}`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">
                    {item.highlight}
                  </p>
                </div>

                <ChevronRight
                  className={`h-4 w-4 shrink-0 transition-transform mt-1 ${
                    isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground/40"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {/* Right Active Preview Canvas */}
        <div className="lg:col-span-8 flex flex-col justify-between rounded-lg border border-border/80 bg-muted/20 p-4 overflow-hidden">
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-[10px] font-mono">
                {activeItem.category}
              </Badge>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Fullscreen</span>
              </button>
            </div>
            <h4 className="text-sm font-bold text-foreground">{activeItem.title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">{activeItem.desc}</p>
          </div>

          {/* Interactive Image Frame */}
          <div
            onClick={() => setModalOpen(true)}
            className="relative rounded-md overflow-hidden border border-border bg-background cursor-pointer group flex items-center justify-center min-h-[280px]"
          >
            <img
              src={activeItem.src}
              alt={activeItem.title}
              className="max-h-[380px] w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-full bg-background/90 text-foreground text-xs font-medium shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                <Maximize2 className="h-3 w-3" /> Click to enlarge
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl p-6">
          <DialogTitle className="text-base font-bold">{activeItem.title}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {activeItem.desc} ({activeItem.highlight})
          </DialogDescription>
          <div className="mt-3 flex items-center justify-center rounded-lg border border-border/60 bg-muted/30 p-2">
            <img
              src={activeItem.src}
              alt={activeItem.title}
              className="max-h-[75vh] w-auto object-contain rounded-md"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
