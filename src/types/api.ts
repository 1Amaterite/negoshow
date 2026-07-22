export interface DashboardCommodityDTO {
  id: string | number;
  name: string;
  shortLabel: string;
  primarySource: string;
  baseline: number;
  change: number;
  trend: "up" | "down" | "stable";
  volatility: "Mababa" | "Katamtaman" | "Mataas";
}

export interface PredictionDataPointDTO {
  araw: string;
  aktwal: number | null;
  hula: number | null;
  isPeak?: boolean;
}

export interface VarianceDataPointDTO {
  name: string;
  "Kasalukuyan": number;
  "30-Araw na Karaniwan": number;
  variancePct: number;
}

// Responses from APIs
export interface CommoditiesResponse {
  data: DashboardCommodityDTO[];
}

export interface PredictionsResponse {
  data: Record<string, PredictionDataPointDTO[]>;
}

export interface VarianceResponse {
  data: VarianceDataPointDTO[];
}
