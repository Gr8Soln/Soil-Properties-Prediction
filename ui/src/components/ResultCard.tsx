import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ResultCard({
  label,
  value,
  unit,
  description,
}: {
  label: string;
  value: number | null;
  unit: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {value === null ? (
          <p className="text-sm text-muted-foreground">Awaiting prediction…</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight text-foreground">
                {value.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{unit}</span>
            </div>
            {description && (
              <p className="mt-2 text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
