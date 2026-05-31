import { createFileRoute } from "@tanstack/react-router";
import { AlertBox } from "@/components/AlertBox";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation — Soil Properties Prediction" },
      {
        name: "description",
        content: "How to use the soil prediction tool, input definitions, and disclaimers.",
      },
    ],
  }),
  component: DocsPage,
});

const inputs = [
  ["Liquid Limit (LL)", "%", "Water content at the boundary between liquid and plastic states."],
  ["Plastic Limit (PL)", "%", "Water content at the boundary between plastic and semi-solid states."],
  ["Plasticity Index (PI)", "%", "PI = LL − PL. Indicates the soil's plasticity range."],
  ["Moisture Content (MC)", "%", "In-situ water content of the sample."],
  ["Bulk Density", "g/cm³", "Total mass per unit volume of the soil sample."],
  ["Specific Gravity", "—", "Ratio of soil particle density to water density."],
  ["Depth", "m", "Sampling depth below ground surface."],
];

function DocsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10 border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reference guide for the Soil Properties Prediction System.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">How to use the tool</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Open the Predict page from the navigation bar.</li>
          <li>Enter your soil index properties in the input form.</li>
          <li>Click <span className="font-medium text-foreground">Predict</span> to compute CU and φ.</li>
          <li>Review the result cards, warnings, and diagnostic charts below.</li>
        </ol>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Input parameters</h2>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Parameter</th>
                <th className="px-4 py-2 text-left font-medium">Unit</th>
                <th className="px-4 py-2 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {inputs.map(([name, unit, desc]) => (
                <tr key={name} className="border-t border-border align-top">
                  <td className="px-4 py-2 text-foreground">{name}</td>
                  <td className="px-4 py-2">{unit}</td>
                  <td className="px-4 py-2">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Outputs</h2>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">CU (kPa)</span> — Undrained cohesion of the soil,
          a key parameter for short-term stability of saturated cohesive soils.
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">φ (degrees)</span> — Angle of internal friction,
          governing the shear strength contribution from particle interlock and friction.
        </p>
      </section>

      <section className="mt-10">
        <AlertBox variant="warning" title="Disclaimer">
          Predictions are intended for academic and preliminary use only. Always validate results
          with appropriate laboratory and in-situ tests before any engineering decision.
        </AlertBox>
      </section>
    </article>
  );
}
