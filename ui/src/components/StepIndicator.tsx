import { cn } from "@/lib/utils";

type Phase = "input" | "analyzing" | "results";

const steps = [
  { key: "input" as const, label: "Input", n: "1" },
  { key: "analyzing" as const, label: "Analyzing", n: "2" },
  { key: "results" as const, label: "Results", n: "3" },
];

const phaseIndex: Record<Phase, number> = { input: 0, analyzing: 1, results: 2 };

export function StepIndicator({ phase }: { phase: Phase }) {
  const active = phaseIndex[phase];

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((s, i) => {
        const done = i < active;
        const current = i === active;
        return (
          <div key={s.key} className="flex items-center">
            {/* connector line (before step, except first) */}
            {i > 0 && (
              <div
                className={cn(
                  "h-[2px] w-8 sm:w-14 transition-colors duration-500",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}

            {/* step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-500",
                  done && "bg-primary text-primary-foreground",
                  current &&
                    "bg-primary/15 text-primary ring-2 ring-primary/40 ring-offset-2 ring-offset-background",
                  !done && !current && "bg-muted text-muted-foreground",
                )}
              >
                {done ? (
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s.n
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors duration-500",
                  current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
