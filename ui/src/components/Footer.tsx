export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted-foreground md:grid-cols-3">
        <div>
          <p className="font-semibold text-foreground">Soil Properties Prediction</p>
          <p className="mt-1">CU & φ Prediction Using Machine Learning</p>
        </div>
        <div className="md:col-span-2">
          <p className="font-medium text-foreground">Disclaimer</p>
          <p className="mt-1">
            This tool provides predictions generated from machine learning models trained on
            historical geotechnical datasets. Outputs are intended for academic research and
            preliminary engineering assessment. Final engineering decisions should be supported by
            appropriate laboratory testing and professional geotechnical evaluation.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-3 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Geotechnical ML Research
      </div>
    </footer>
  );
}
