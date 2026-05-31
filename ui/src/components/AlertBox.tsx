import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "warning" | "info" | "success";

const styles: Record<Variant, string> = {
  warning: "border-warning/40 bg-warning/10 text-warning-foreground",
  info: "border-primary/30 bg-primary/5 text-foreground",
  success: "border-emerald-500/30 bg-emerald-500/10 text-foreground",
};

const icons = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
};

export function AlertBox({
  variant = "info",
  title,
  children,
}: {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
}) {
  const Icon = icons[variant];
  return (
    <div className={cn("flex gap-3 rounded-md border px-4 py-3 text-sm", styles[variant])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
