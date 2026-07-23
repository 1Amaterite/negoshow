import { DocKalagayan } from "./types";

export const COMMODITY_NAMES = ["Sibuyas Pula","Sibuyas Puti","Bawang","Luya","Patatas"];

export const COVERAGE_AREAS = ["Metro Manila","Pasay City","Makati City","Quezon City","Caloocan City","Marikina City"];

export const LOCATIONS = ["Pasay City Public Market","Cartimar Market","Baclaran Market"];

export const VENDOR_TIPS = [
  { icon: "🛒", title: "Bumili ng mas maaga", titleEn: "Buy Early", body: "Para sa Sibuyas Pula at Luya, bumili bago mag-Huwebes. Inaasahang tataas ang presyo ng hanggang 13% sa susunod na 3 araw.", bodyEn: "For Red Onion and Ginger, buy before Thursday. Prices are expected to rise up to 13% in the next 3 days." },
  { icon: "📍", title: "Mas mura sa Divisoria", titleEn: "Cheaper in Divisoria", body: "Ang Sibuyas Pula at Bawang ay may pinakamababang presyo sa Divisoria Market — ₱8–12/kg na mas mura kaysa sa lokal na talipapa.", bodyEn: "Red Onion and Garlic have the lowest prices in Divisoria Market — ₱8–12/kg cheaper than local markets." },
  { icon: "🤝", title: "I-negotiate ang Bawang", titleEn: "Negotiate Garlic", body: "Ang kasalukuyang presyo ng Bawang (₱220) ay mas mababa kaysa sa 30-araw na average (₱242). Ito ang tamang oras para makipag-negotiate.", bodyEn: "The current price of Garlic (₱220) is lower than the 30-day average (₱242). It is the right time to negotiate." },
  { icon: "⏳", title: "Huwag magmadali sa Patatas", titleEn: "Don't Rush Potato", body: "Stable ang Patatas. Walang pangangailangan na mag-stock ng malaki — mananatiling matatag ang presyo sa susunod na linggo.", bodyEn: "Potato is stable. No need to stock up heavily — prices will remain stable next week." },
];

export const DOC_STATUS: Record<DocKalagayan, { label: string; cls: string }> = {
  processing: { label: "Pinoproseso…", cls: "bg-blue-100 text-blue-700 border-blue-200"   },
  validated:  { label: "Napatunayan",   cls: "bg-amber-100 text-amber-700 border-amber-200" },
  published:  { label: "Nailathala",   cls: "bg-green-100 text-green-700 border-green-200" },
  rejected:   { label: "Tinanggihan",    cls: "bg-red-100 text-red-700 border-red-200"       },
};
