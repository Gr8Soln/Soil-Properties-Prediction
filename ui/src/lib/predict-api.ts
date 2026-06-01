export interface PredictInput {
  LL: number;
  PL: number;
  Sat_Unit_Wt_kN_m3: number;
  Mv_50kPa: number;
  Cv_50kPa: number;
  Fines_Content_pct: number;
  Sand_Fraction_pct: number;
  Gravel_Fraction_pct: number;
}

export interface ShapContribution {
  feature: string;
  value: number;
  shap_value: number;
  impact: "positive" | "negative";
  rank: number;
  abs_shap_value: number;
  start?: number | null;
  end?: number | null;
}

export interface ShapBarDatum {
  feature: string;
  value: number;
  shap_value: number;
}

export interface ShapSummary {
  total_positive: number;
  total_negative: number;
  net_effect: number;
  absolute_sum: number;
  prediction_estimate: number;
}

export interface ShapTarget {
  base_value: number;
  features: ShapContribution[];
  positive: ShapContribution[];
  negative: ShapContribution[];
  bar: ShapBarDatum[];
  waterfall: ShapContribution[];
  summary: ShapSummary;
}

export interface PredictResponse {
  predictions: {
    cu_kpa: number;
    phi_deg: number;
  };
  models: {
    cu: string;
    phi: string;
  };
  shap: {
    cu: ShapTarget;
    phi: ShapTarget;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

async function parseError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") {
      return body.detail;
    }
    if (Array.isArray(body.detail)) {
      return body.detail.map((item) => item.msg ?? JSON.stringify(item)).join("; ");
    }
    return JSON.stringify(body);
  } catch {
    return `${response.status} ${response.statusText}`;
  }
}

export async function predictSoil(input: PredictInput): Promise<PredictResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}
