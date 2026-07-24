import { DocKalagayan } from "./types";

export const COMMODITY_NAMES = ["Sibuyas Pula","Sibuyas Puti","Bawang","Luya","Patatas"];

export const COVERAGE_AREAS = ["Metro Manila","Pasay City","Makati City","Quezon City","Caloocan City","Marikina City"];

export const LOCATIONS = ["Pasay City Public Market","Cartimar Market","Baclaran Market"];

// Note: 'icon' now stores the Lucide icon name instead of an emoji.
export const VENDOR_TIPS = [
  { icon: "ShoppingCart", title: "Bumili ng bultuhan kung mura", titleEn: "Buy in Bulk When Cheap", body: "Laging suriin ang 30-araw na baseline. Kung ang presyo ay mas mababa sa average, magandang oras ito para bumili ng bultuhan.", bodyEn: "Always check the 30-day baseline. If the current price is below average, it is a good time to buy in bulk." },
  { icon: "MapPin", title: "Paghambingin ang mga Pamilihan", titleEn: "Compare Markets", body: "Iba-iba ang presyo sa bawat talipapa. Ang pamilihang malayo sa sentro ay minsan mas mura kaysa sa lokal na pamilihan.", bodyEn: "Prices vary by market. Markets further from the center are sometimes cheaper than local ones." },
  { icon: "Handshake", title: "I-negotiate ang Presyo", titleEn: "Negotiate Prices", body: "Gamitin ang datos ng app na ito para makipag-negotiate sa iyong supplier. Ipakita ang pinakamababang presyo mula sa ibang pamilihan.", bodyEn: "Use the data from this app to negotiate with your supplier. Show the lowest prices from other markets." },
  { icon: "Clock", title: "Bantayan ang Presyo", titleEn: "Monitor Prices", body: "Kung ang trend ay patuloy na tumataas nang higit sa 5%, isaalang-alang ang paghahanap ng alternatibong sangkap.", bodyEn: "If the trend continues to rise by more than 5%, consider looking for alternative ingredients." },
];

export const DOC_STATUS: Record<DocKalagayan, { label: string; cls: string }> = {
  processing: { label: "Pinoproseso…", cls: "bg-blue-100 text-blue-700 border-blue-200"   },
  validated:  { label: "Napatunayan",   cls: "bg-amber-100 text-amber-700 border-amber-200" },
  published:  { label: "Nailathala",   cls: "bg-green-100 text-green-700 border-green-200" },
  rejected:   { label: "Tinanggihan",    cls: "bg-red-100 text-red-700 border-red-200"       },
};
