import { Link } from "@tanstack/react-router";
import { Layers, BookOpen, ShieldAlert } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-card/40 text-xs text-muted-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-border/60">
          {/* Brand Col */}
          <div className="md:col-span-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="h-3.5 w-3.5" />
              </div>
              <span className="font-bold text-foreground text-sm">
                Geotechnical Shear Strength Suite
              </span>
            </div>
            <p className="text-muted-foreground leading-relaxed text-[11px]">
              Advanced machine learning framework for predicting Undrained Cohesion (Cu) and
              Internal Friction Angle (φ) from borehole index properties with SHAP explainability.
            </p>
            <div className="flex items-center gap-2 pt-1 font-mono text-[10px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Inference Engine v1.1.0 · ExtraTrees Regressors</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-2.5">
            <h4 className="font-bold uppercase tracking-wider text-foreground text-[10px]">
              Navigation
            </h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <a href="/#benchmarks" className="hover:text-primary transition-colors">
                  Model Benchmarks
                </a>
              </li>
              <li>
                <a href="/#pipeline" className="hover:text-primary transition-colors">
                  Feature Pipeline
                </a>
              </li>
              <li>
                <Link
                  to="/predict"
                  className="hover:text-primary transition-colors font-medium text-foreground"
                >
                  Launch Predictor
                </Link>
              </li>
            </ul>
          </div>

          {/* References */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-bold uppercase tracking-wider text-foreground text-[10px] flex items-center gap-1.5">
              <BookOpen className="h-3 w-3 text-primary" />
              <span>Technical References</span>
            </h4>
            <ul className="space-y-1.5 text-[10px] leading-snug">
              <li>
                <span className="font-medium text-foreground">Terzaghi, Peck, Mesri (1996)</span>
                <p className="text-muted-foreground/80">Soil Mechanics in Engineering Practice</p>
              </li>
              <li>
                <span className="font-medium text-foreground">Kulhawy & Mayne (1990)</span>
                <p className="text-muted-foreground/80">
                  Estimating Soil Properties for Foundation Design
                </p>
              </li>
              <li>
                <span className="font-medium text-foreground">Robertson (2009)</span>
                <p className="text-muted-foreground/80">Unified Geotechnical Soil Behavior</p>
              </li>
            </ul>
          </div>

          {/* Disclaimer Col */}
          <div className="md:col-span-3 space-y-2.5">
            <h4 className="font-bold uppercase tracking-wider text-foreground text-[10px] flex items-center gap-1.5">
              <ShieldAlert className="h-3 w-3 text-amber-500" />
              <span>Engineering Disclaimer</span>
            </h4>
            <p className="text-[10px] leading-relaxed text-muted-foreground/90">
              Predictions are intended for academic research, preliminary design, and feasibility
              screening. Critical geotechnical designs must be verified with certified laboratory
              triaxial/direct-shear testing and professional engineering sign-off.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
          <p>© {new Date().getFullYear()} Geotechnical Machine Learning Predictive Analytics</p>
          <p className="text-muted-foreground/70 font-mono text-[10px]">
            Trained on 10 Borehole Datasets · 5-Fold Shuffled Cross-Validation
          </p>
        </div>
      </div>
    </footer>
  );
}
