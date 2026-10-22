import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { Layers, Sparkles } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-foreground">
            Soil Shear Strength Suite
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="h-8 text-xs font-semibold gap-1.5 shadow-xs">
            <Link to="/predict">
              <Sparkles className="h-3 w-3" />
              <span>Launch Predictor</span>
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
