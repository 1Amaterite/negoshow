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

export interface BulletinRecord {
  id: number; source: string; date: string; location: string;
  commodities: string[]; type: "PDF" | "Image"; verified: boolean;
}

export interface AdminRecord {
  id: number; commodity: string; price: number; location: string;
  date: string; source: string; status: "pending" | "approved" | "rejected";
  flagged?: boolean; flagReason?: string;
}

export interface UploadedDoc {
  id: number; filename: string; sourceOffice: string; bulletinDate: string;
  coverage: string; docType: "PDF" | "Image"; commodities: string[];
  status: DocKalagayan; uploadedAt: string;
}
