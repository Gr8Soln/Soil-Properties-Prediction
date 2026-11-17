import React from "react";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

type Variant = "warning" | "info" | "success" | "error";

const styles: Record<Variant, { container: string; border: string; icon: string }> = {
  warning: {
    container: "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30",
    border: "bg-amber-500",
    icon: "text-amber-600 dark:text-amber-400",
  },
  info: {
    container: "bg-blue-500/10 text-blue-900 dark:text-blue-200 border-blue-500/30",
    border: "bg-blue-500",
    icon: "text-blue-600 dark:text-blue-400",
  },
  success: {
    container: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-emerald-500/30",
    border: "bg-emerald-500",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    container: "bg-rose-500/10 text-rose-900 dark:text-rose-200 border-rose-500/30",
    border: "bg-rose-500",
    icon: "text-rose-600 dark:text-rose-400",
  },
};

const icons = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
};

export function AlertBox({
  variant = "info",
  title,
  children,
  onDismiss,
}: {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const Icon = icons[variant];
  const config = styles[variant];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "relative flex items-start gap-3 rounded-lg border p-4 text-sm shadow-xs overflow-hidden",
          config.container,
        )}
      >
        <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.border)} />
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.icon)} />
        <div className="flex-1">
          {title && (
            <h5 className="font-semibold text-xs uppercase tracking-wide mb-0.5">{title}</h5>
          )}
          <div className="text-xs leading-relaxed opacity-95">{children}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted-foreground/70 hover:text-foreground p-0.5 rounded-sm transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
