"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navigation, Shield } from "lucide-react";
import { COMMODITIES, VENDOR_TIPS } from "@/lib/data";
import { PageHeader, SL, CommodityImage } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";

function AdvisorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useTranslation();

  const id = searchParams.get("id");
  const quote = searchParams.get("quote");

  const commodity = COMMODITIES.find((c) => c.id === id) || COMMODITIES[0];
  const quotedPrice = quote ? parseFloat(quote) : 0;

  const cheapest = commodity.sources[0];
  const isFlagged = quotedPrice > 0 && quotedPrice > commodity.baseline * 1.15;
  const action = isFlagged ? "negotiate" : commodity.trend === "up" ? "monitor" : "buy";
  
  const cards = {
    buy:       { label: t.advisor.buyNow,   color:"bg-green-600", emoji:"✅", desc: t.advisor.buyNowDesc },
    negotiate: { label: t.advisor.negotiate,  color:"bg-amber-600", emoji:"🤝", desc: t.advisor.negotiateDesc },
    monitor:   { label: t.advisor.monitor,      color:"bg-blue-600",  emoji:"👀", desc: t.advisor.monitorDesc },
  };
  
  const card = cards[action];

  return (
    <div>
      <PageHeader title={t.advisor.title} subtitle={t.advisor.subtitle} onBack={() => router.back()}/>
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border">
          <CommodityImage commodity={commodity} size="lg"/>
          <div>
            <p className="font-bold text-foreground">{lang === 'tl' ? commodity.tagalog : commodity.name}</p>
            <p className="text-xs text-muted-foreground">{t.advisor.baseline}: ₱{commodity.baseline}/kg{quotedPrice>0&&` · ${t.advisor.quoted}: ₱${quotedPrice}/kg`}</p>
          </div>
        </div>
        <div className={`${card.color} rounded-2xl p-5 text-white`}>
          <p className="text-3xl mb-2">{card.emoji}</p>
          <p className="text-xs uppercase tracking-widest text-white/70 mb-1 font-semibold">{t.advisor.recommended}</p>
          <p className="text-2xl font-extrabold mb-2">{card.label}</p>
          <p className="text-sm text-white/80 leading-relaxed">{card.desc}</p>
        </div>
        <div>
          <SL>{t.advisor.cheaperSource}</SL>
          <div className="bg-green-50 rounded-xl border border-green-200 px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-foreground">{cheapest.name}</p>
              <p className="text-2xl font-extrabold text-green-700">₱{cheapest.price}<span className="text-sm text-green-600">/kg</span></p>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Navigation size={11}/>{cheapest.distance} · {t.advisor.verifiedSource}</p>
            {quotedPrice>0&&(
              <div className="mt-3 bg-white/70 rounded-lg px-3 py-2 border border-green-200">
                <p className="text-xs font-semibold text-green-800">💰 {t.advisor.savePer10kg.replace('{{amt}}', ((quotedPrice-cheapest.price)*10).toFixed(0))}</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <SL>{t.advisor.vendorTips}</SL>
          {VENDOR_TIPS.slice(0,2).map((tip,i)=>(
            <div key={i} className="flex items-start gap-3 bg-card rounded-xl px-4 py-3.5 border border-border mb-2">
              <span className="text-xl shrink-0 mt-0.5">{tip.icon}</span>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight mb-0.5">{lang === 'tl' ? tip.title : tip.titleEn || tip.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{lang === 'tl' ? tip.body : tip.bodyEn || tip.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 bg-card rounded-xl px-4 py-3 border border-border">
          <Shield size={14} className="text-primary mt-0.5 shrink-0"/>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isFlagged
              ? t.advisor.flaggedNotice.replace('{{quotedPrice}}', quotedPrice.toString()).replace('{{pct}}', (((quotedPrice-commodity.baseline)/commodity.baseline)*100).toFixed(1))
              : t.advisor.baselineNotice.replace('{{commodity}}', lang === 'tl' ? commodity.tagalog : commodity.name).replace('{{baseline}}', commodity.baseline.toString())}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground text-sm">{t.advisor.loading}</div>}>
      <AdvisorContent />
    </Suspense>
  );
}
