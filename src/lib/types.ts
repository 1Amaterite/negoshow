export type Screen =
  | "home" | "checker" | "dashboard" | "commodity"
  | "advisor" | "procurement" | "transparency" | "admin" | "admin-login" | "more";

export type ResultState = "fair" | "flagged" | null;
export type AdminTab = "upload" | "validate";
export type DocKalagayan = "processing" | "validated" | "published" | "rejected";

export interface Commodity {
  id: string; name: string; tagalog: string; shortLabel: string; image: string;
  baseline: number; baseline30d: number;
  trend: "up" | "down" | "stable"; change: number; changeAbs: number;
  volatility: "High" | "Medium" | "Low";
  primarySource: string;
  sources: { name: string; price: number; distance: string }[];
}

