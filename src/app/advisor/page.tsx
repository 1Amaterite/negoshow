"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navigation, Shield } from "lucide-react";
import { COMMODITIES, VENDOR_TIPS } from "@/lib/data";
import { PageHeader, SL, CommodityImage } from "@/components/ui";

function AdvisorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = searchParams.get("id");
  const quote = searchParams.get("quote");

  const commodity = COMMODITIES.find((c) => c.id === id) || COMMODITIES[0];
  const quotedPrice = quote ? parseFloat(quote) : 0;

  const cheapest = commodity.sources[0];
  const isFlagged = quotedPrice > 0 && quotedPrice > commodity.baseline * 1.15;
  const action = isFlagged ? "negotiate" : commodity.trend === "up" ? "monitor" : "buy";
  
  const cards = {
    buy:       { label:"Bilhin Na Ngayon",   color:"bg-green-600", emoji:"✅", desc:"Ang presyo ay patas at stable. Ito ang tamang oras para bumili." },
    negotiate: { label:"Makipag-Negotiate",  color:"bg-amber-600", emoji:"🤝", desc:"Ang quoted price ay mas mataas kaysa baseline. Subukan ang mas mababang halaga." },
    monitor:   { label:"Bantayan Muna",      color:"bg-blue-600",  emoji:"👀", desc:"Ang presyo ay pataaas pa. Maghintay ng ilang araw bago bumili." },
  };
  
  const card = cards[action];

  return (
    <div>
      <PageHeader title="Procurement Advisor" subtitle="Rekomendasyon batay sa presyo" onBack={() => router.back()}/>
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border">
          <CommodityImage commodity={commodity} size="lg"/>
          <div>
            <p className="font-bold text-foreground">{commodity.tagalog}</p>
            <p className="text-xs text-muted-foreground">Baseline: ₱{commodity.baseline}/kg{quotedPrice>0&&` · Quoted: ₱${quotedPrice}/kg`}</p>
          </div>
        </div>
        <div className={`${card.color} rounded-2xl p-5 text-white`}>
          <p className="text-3xl mb-2">{card.emoji}</p>
          <p className="text-xs uppercase tracking-widest text-white/70 mb-1 font-semibold">Inirerekomenda</p>
          <p className="text-2xl font-extrabold mb-2">{card.label}</p>
          <p className="text-sm text-white/80 leading-relaxed">{card.desc}</p>
        </div>
        <div>
          <SL>Mas Murang Malapit na Source</SL>
          <div className="bg-green-50 rounded-xl border border-green-200 px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-foreground">{cheapest.name}</p>
              <p className="text-2xl font-extrabold text-green-700">₱{cheapest.price}<span className="text-sm text-green-600">/kg</span></p>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Navigation size={11}/>{cheapest.distance} · Beripikado source</p>
            {quotedPrice>0&&(
              <div className="mt-3 bg-white/70 rounded-lg px-3 py-2 border border-green-200">
                <p className="text-xs font-semibold text-green-800">💰 Sa 10 kilo: makatitipid ka ng ₱{((quotedPrice-cheapest.price)*10).toFixed(0)}</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <SL>Tips para sa Vendor</SL>
          {VENDOR_TIPS.slice(0,2).map((tip,i)=>(
            <div key={i} className="flex items-start gap-3 bg-card rounded-xl px-4 py-3.5 border border-border mb-2">
              <span className="text-xl shrink-0 mt-0.5">{tip.icon}</span>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight mb-0.5">{tip.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{tip.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 bg-card rounded-xl px-4 py-3 border border-border">
          <Shield size={14} className="text-primary mt-0.5 shrink-0"/>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isFlagged
              ? `Ang iyong quote (₱${quotedPrice}) ay ${(((quotedPrice-commodity.baseline)/commodity.baseline)*100).toFixed(1)}% na mas mataas sa baseline.`
              : `Baseline ng ${commodity.tagalog}: ₱${commodity.baseline}/kg · DA Bulletin Jul 10, 2026.`}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">Naglo-load ng advisor...</div>}>
      <AdvisorContent />
    </Suspense>
  );
}
