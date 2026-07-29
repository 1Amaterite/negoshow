
export type DocKalagayan = "processing" | "validated" | "published" | "rejected";

export interface Commodity {
  id: string; name: string; tagalog: string; shortLabel: string; image: string;
  baseline: number; baseline30d: number;
  trend: "up" | "down" | "stable"; change: number; changeAbs: number;
  volatility: "High" | "Medium" | "Low";
  primarySource: string;
  sources: { name: string; price: number; distance: string }[];
}

