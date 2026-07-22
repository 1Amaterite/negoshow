import { Commodity, BulletinRecord, AdminRecord, UploadedDoc, DocKalagayan } from "./types";

export const COMMODITIES: Commodity[] = [
  {
    id: "red-onion", name: "Red Onion", tagalog: "Sibuyas Pula", shortLabel: "S. Pula", image: "/images/commodities/red-onion.webp",
    baseline: 140, baseline30d: 118, trend: "up", change: 6, changeAbs: 8,
    volatility: "Mataas", primarySource: "Divisoria Market",
    sources: [
      { name: "Divisoria Market", price: 132, distance: "2.1 km" },
      { name: "Guadalupe Market", price: 136, distance: "1.4 km" },
      { name: "Cartimar Market",  price: 145, distance: "0.3 km" },
    ],
  },
  {
    id: "white-onion", name: "White Onion", tagalog: "Sibuyas Puti", shortLabel: "S. Puti", image: "/images/commodities/white-onion.webp",
    baseline: 95, baseline30d: 98, trend: "stable", change: -2, changeAbs: -2,
    volatility: "Mababa", primarySource: "Cartimar Market",
    sources: [
      { name: "Cartimar Market",  price: 90, distance: "0.3 km" },
      { name: "Pasay Central",    price: 93, distance: "0.8 km" },
      { name: "Baclaran Market",  price: 96, distance: "1.9 km" },
    ],
  },
  {
    id: "garlic", name: "Garlic", tagalog: "Bawang", shortLabel: "Bawang", image: "/images/commodities/garlic.webp",
    baseline: 220, baseline30d: 242, trend: "down", change: -6, changeAbs: -14,
    volatility: "Katamtaman", primarySource: "Divisoria Market",
    sources: [
      { name: "Divisoria Market", price: 208, distance: "2.1 km" },
      { name: "Baclaran Market",  price: 214, distance: "1.9 km" },
      { name: "Guadalupe Market", price: 222, distance: "1.4 km" },
    ],
  },
  {
    id: "ginger", name: "Ginger", tagalog: "Luya", shortLabel: "Luya", image: "/images/commodities/ginger.webp",
    baseline: 180, baseline30d: 155, trend: "up", change: 7, changeAbs: 12,
    volatility: "Mataas", primarySource: "Guadalupe Market",
    sources: [
      { name: "Guadalupe Market", price: 170, distance: "1.4 km" },
      { name: "Pasay Central",    price: 175, distance: "0.8 km" },
      { name: "Cartimar Market",  price: 182, distance: "0.3 km" },
    ],
  },
  {
    id: "potato", name: "Potato", tagalog: "Patatas", shortLabel: "Patatas", image: "/images/commodities/potato.webp",
    baseline: 65, baseline30d: 63, trend: "stable", change: 2, changeAbs: 1,
    volatility: "Mababa", primarySource: "Cartimar Market",
    sources: [
      { name: "Cartimar Market",  price: 62, distance: "0.3 km" },
      { name: "Divisoria Market", price: 63, distance: "2.1 km" },
      { name: "Pasay Central",    price: 66, distance: "0.8 km" },
    ],
  },
];

export const COMMODITY_NAMES = ["Sibuyas Pula","Sibuyas Puti","Bawang","Luya","Patatas"];
export const COVERAGE_AREAS  = ["Metro Manila","Pasay City","Makati City","Quezon City","Caloocan City","Marikina City"];
export const LOCATIONS       = ["Pasay City Public Market","Cartimar Market","Baclaran Market"];

export const VARIANCE_DATA = COMMODITIES.map((c) => ({
  name: c.shortLabel,
  "30-Araw na Karaniwan": c.baseline30d,
  "Kasalukuyan":    c.baseline,
  variancePct: parseFloat((((c.baseline - c.baseline30d) / c.baseline30d) * 100).toFixed(1)),
}));

export const PREDICTION_DATA: Record<string, { araw: string; aktwal: number | null; hula: number | null; isPeak?: boolean }[]> = {
  "red-onion":   [
    { araw: "Jul 4",  aktwal: 124, hula: null },
    { araw: "Jul 6",  aktwal: 128, hula: null },
    { araw: "Jul 8",  aktwal: 133, hula: null },
    { araw: "Jul 10", aktwal: 140, hula: 140  },
    { araw: "Jul 11", aktwal: null, hula: 145 },
    { araw: "Jul 12", aktwal: null, hula: 151 },
    { araw: "Jul 13", aktwal: null, hula: 158, isPeak: true },
    { araw: "Jul 14", aktwal: null, hula: 153 },
    { araw: "Jul 15", aktwal: null, hula: 148 },
    { araw: "Jul 16", aktwal: null, hula: 144 },
  ],
  "ginger":      [
    { araw: "Jul 4",  aktwal: 162, hula: null },
    { araw: "Jul 6",  aktwal: 168, hula: null },
    { araw: "Jul 8",  aktwal: 174, hula: null },
    { araw: "Jul 10", aktwal: 180, hula: 180  },
    { araw: "Jul 11", aktwal: null, hula: 184 },
    { araw: "Jul 12", aktwal: null, hula: 189 },
    { araw: "Jul 13", aktwal: null, hula: 194, isPeak: true },
    { araw: "Jul 14", aktwal: null, hula: 191 },
    { araw: "Jul 15", aktwal: null, hula: 186 },
    { araw: "Jul 16", aktwal: null, hula: 183 },
  ],
  "garlic":      [
    { araw: "Jul 4",  aktwal: 248, hula: null },
    { araw: "Jul 6",  aktwal: 238, hula: null },
    { araw: "Jul 8",  aktwal: 228, hula: null },
    { araw: "Jul 10", aktwal: 220, hula: 220  },
    { araw: "Jul 11", aktwal: null, hula: 216 },
    { araw: "Jul 12", aktwal: null, hula: 212 },
    { araw: "Jul 13", aktwal: null, hula: 208 },
    { araw: "Jul 14", aktwal: null, hula: 205 },
    { araw: "Jul 15", aktwal: null, hula: 202 },
    { araw: "Jul 16", aktwal: null, hula: 200 },
  ],
  "white-onion": [
    { araw: "Jul 4",  aktwal: 97, hula: null },
    { araw: "Jul 6",  aktwal: 96, hula: null },
    { araw: "Jul 8",  aktwal: 95, hula: null },
    { araw: "Jul 10", aktwal: 95, hula: 95   },
    { araw: "Jul 11", aktwal: null, hula: 94 },
    { araw: "Jul 12", aktwal: null, hula: 95 },
    { araw: "Jul 13", aktwal: null, hula: 95 },
    { araw: "Jul 14", aktwal: null, hula: 94 },
    { araw: "Jul 15", aktwal: null, hula: 93 },
    { araw: "Jul 16", aktwal: null, hula: 93 },
  ],
  "potato":      [
    { araw: "Jul 4",  aktwal: 64, hula: null },
    { araw: "Jul 6",  aktwal: 65, hula: null },
    { araw: "Jul 8",  aktwal: 65, hula: null },
    { araw: "Jul 10", aktwal: 65, hula: 65   },
    { araw: "Jul 11", aktwal: null, hula: 65 },
    { araw: "Jul 12", aktwal: null, hula: 66 },
    { araw: "Jul 13", aktwal: null, hula: 65 },
    { araw: "Jul 14", aktwal: null, hula: 64 },
    { araw: "Jul 15", aktwal: null, hula: 64 },
    { araw: "Jul 16", aktwal: null, hula: 63 },
  ],
};

export const VENDOR_TIPS = [
  { icon: "🛒", title: "Bumili ng mas maaga", body: "Para sa Sibuyas Pula at Luya, bumili bago mag-Huwebes. Inaasahang tataas ang presyo ng hanggang 13% sa susunod na 3 araw." },
  { icon: "📍", title: "Mas mura sa Divisoria", body: "Ang Sibuyas Pula at Bawang ay may pinakamababang presyo sa Divisoria Market — ₱8–12/kg na mas mura kaysa sa lokal na talipapa." },
  { icon: "🤝", title: "I-negotiate ang Bawang", body: "Ang kasalukuyang presyo ng Bawang (₱220) ay mas mababa kaysa sa 30-araw na average (₱242). Ito ang tamang oras para makipag-negotiate." },
  { icon: "⏳", title: "Huwag magmadali sa Patatas", body: "Stable ang Patatas. Walang pangangailangan na mag-stock ng malaki — mananatiling matatag ang presyo sa susunod na linggo." },
];

export const INITIAL_BULLETINS: BulletinRecord[] = [
  { id: 1, source: "DA – Region IV-A", date: "Jul 10, 2026", location: "Metro Manila", commodities: ["Sibuyas Pula","Bawang"],              type: "PDF",   verified: true  },
  { id: 2, source: "LGU Pasay City",   date: "Jul 8, 2026",  location: "Pasay City",   commodities: ["Patatas","Luya"],                    type: "Image", verified: true  },
  { id: 3, source: "DA – Region IV-A", date: "Jul 5, 2026",  location: "Metro Manila", commodities: ["Sibuyas Puti","Sibuyas Pula"],        type: "PDF",   verified: true  },
  { id: 4, source: "LGU Makati",       date: "Jul 3, 2026",  location: "Makati City",  commodities: ["Bawang","Luya","Patatas"],            type: "PDF",   verified: false },
  { id: 5, source: "DA – Region IV-A", date: "Jun 28, 2026", location: "Metro Manila", commodities: ["Sibuyas Pula","Sibuyas Puti","Bawang"],type: "PDF",  verified: true  },
];

export const INITIAL_RECORDS: AdminRecord[] = [
  { id: 1, commodity: "Sibuyas Pula", price: 138, location: "Divisoria",    date: "Jul 10", source: "DA Bulletin",  status: "pending" },
  { id: 2, commodity: "Bawang",       price: 580, location: "Baclaran",     date: "Jul 10", source: "DA Bulletin",  status: "pending", flagged: true, flagReason: "Presyo ay 2.6× itaas ng baseline (₱220)" },
  { id: 3, commodity: "Patatas",      price: 64,  location: "Cartimar",     date: "Jul 9",  source: "LGU Bulletin", status: "approved" },
  { id: 4, commodity: "Luya",         price: 175, location: "Guadalupe",    date: "Jul 9",  source: "LGU Bulletin", status: "pending" },
  { id: 5, commodity: "Sibuyas Puti", price: 92,  location: "Pasay Central",date: "Jul 8",  source: "DA Bulletin",  status: "rejected" },
  { id: 6, commodity: "Bawang",       price: 218, location: "Cartimar",     date: "Jul 8",  source: "LGU Bulletin", status: "approved" },
];

export const INITIAL_UPLOADS: UploadedDoc[] = [
  { id: 1, filename: "DA_PriceMonitoring_Jul10_2026.pdf", sourceOffice: "DA – Region IV-A", bulletinDate: "2026-07-10", coverage: "Metro Manila", docType: "PDF",   commodities: ["Sibuyas Pula","Bawang"],       status: "published",  uploadedAt: "Jul 10, 9:02 AM"  },
  { id: 2, filename: "LGU_Pasay_Bulletin_Jul08.jpg",      sourceOffice: "LGU Pasay City",   bulletinDate: "2026-07-08", coverage: "Pasay City",   docType: "Image", commodities: ["Patatas","Luya"],             status: "published",  uploadedAt: "Jul 8, 11:45 AM"  },
  { id: 3, filename: "DA_PriceMonitoring_Jul05_2026.pdf", sourceOffice: "DA – Region IV-A", bulletinDate: "2026-07-05", coverage: "Metro Manila", docType: "PDF",   commodities: ["Sibuyas Puti","Sibuyas Pula"],status: "validated",  uploadedAt: "Jul 5, 2:18 PM"   },
];

export const ADMIN_CREDS = { username: "admin", password: "negoshow2026" };

export const DOC_STATUS: Record<DocKalagayan, { label: string; cls: string }> = {
  processing: { label: "Pinoproseso…", cls: "bg-blue-100 text-blue-700 border-blue-200"   },
  validated:  { label: "Napatunayan",   cls: "bg-amber-100 text-amber-700 border-amber-200" },
  published:  { label: "Nailathala",   cls: "bg-green-100 text-green-700 border-green-200" },
  rejected:   { label: "Tinanggihan",    cls: "bg-red-100 text-red-700 border-red-200"       },
};
