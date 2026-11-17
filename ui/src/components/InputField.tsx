import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface InputFieldProps {
  id: string;
  label: string;
  unit?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  step?: string;
  hint?: string;
  tooltipText?: string;
  min?: number;
  max?: number;
  placeholder?: string;
}

export function InputField({
  id,
  label,
  unit,
  value,
  onChange,
  step = "any",
  hint,
  tooltipText,
  min,
  max,
  placeholder,
}: InputFieldProps) {
  return (
    <div className="space-y-1.5 group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label
            htmlFor={id}
            className="text-xs font-semibold text-foreground/80 group-focus-within:text-primary transition-colors"
          >
            {label}
          </Label>
          {tooltipText && (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-muted-foreground/60 hover:text-foreground transition-colors cursor-help"
                  >
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs leading-relaxed">
                  {tooltipText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {unit && (
          <span className="text-[11px] font-mono font-medium text-muted-foreground/75 px-1.5 py-0.5 rounded-xs bg-muted/60">
            {unit}
          </span>
        )}
      </div>

      <div className="relative">
        <Input
          id={id}
          type="number"
          step={step}
          min={min}
          max={max}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? "" : Number(raw));
          }}
          className="h-9 font-mono text-sm pr-3 transition-all focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary bg-background/50 hover:bg-background"
        />
      </div>

      {hint && <p className="text-[10px] text-muted-foreground/70 tracking-tight">{hint}</p>}
    </div>
  );
}
