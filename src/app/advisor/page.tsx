"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navigation, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { VENDOR_TIPS } from "@/lib/constants";
import { Sparkles, CircleDollarSign } from "lucide-react";
import { PageHeader, SL, CommodityImage, DynamicIcon } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";

function AdvisorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useTranslation();

  const id = searchParams.get("id");
  const quote = searchParams.get("quote");

  const { data: dynamicCommodities = [], isLoading } = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await fetch('/api/commodities');
      return await res.json();
    }
  });

  const { data: aiTips = [], isLoading: isTipsLoading, refetch: refetchTips, isFetching: isTipsFetching } = useQuery({
    queryKey: ['ai-tips', lang],
    queryFn: async () => {
      const res = await fetch(`/api/advisor/tips?lang=${lang}`);
      return await res.json();
    }
  });

  const commodity = dynamicCommodities.find((c: any) => c.id === id) || dynamicCommodities[0];
  const quotedPrice = quote ? parseFloat(quote) : 0;

  if (isLoading || !commodity) return <div className="p-8 text-center text-muted-foreground text-sm">{t.advisor.loading}</div>;

  const cheapest = commodity.sources[0];
  const isFlagged = quotedPrice > 0 && quotedPrice > commodity.baseline * 1.15;
  const action = isFlagged ? "negotiate" : commodity.trend === "up" ? "monitor" : "buy";
  
  const cards = {
    buy:       { label: t.advisor.buyNow,   color:"bg-green-600", icon:"CheckCircle", desc: t.advisor.buyNowDesc },
    negotiate: { label: t.advisor.negotiate,  color:"bg-amber-600", icon:"Handshake", desc: t.advisor.negotiateDesc },
    monitor:   { label: t.advisor.monitor,      color:"bg-blue-600",  icon:"Eye", desc: t.advisor.monitorDesc },
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
          <DynamicIcon name={card.icon} size={32} className="mb-3" />
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
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Shield size={11}/>{t.advisor.verifiedSource}</p>
            {quotedPrice>0&&(
              <div className="mt-3 bg-white/70 rounded-lg px-3 py-2 border border-green-200">
                <p className="text-xs font-semibold text-green-800 flex items-center gap-1.5"><CircleDollarSign size={14} className="text-green-700"/> {t.advisor.savePer10kg.replace('{{amt}}', ((quotedPrice-cheapest.price)*10).toFixed(0))}</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-3">
            <SL className="mb-0">{t.advisor.vendorTips}</SL>
            <button onClick={() => refetchTips()} disabled={isTipsFetching} className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-full transition-colors disabled:opacity-50">
              <Sparkles size={12} className={isTipsFetching ? "animate-spin" : ""} />
              {isTipsFetching ? (lang === 'tl' ? "Nag-iisip..." : "Thinking...") : (lang === 'tl' ? "Bagong Tips" : "New Tips")}
            </button>
          </div>
          {isTipsLoading ? (
            <div className="p-4 text-center text-xs text-muted-foreground bg-card rounded-xl border border-border">
              {lang === 'tl' ? "Bumubuo ng mga tip mula sa AI..." : "Generating AI tips..."}
            </div>
          ) : (aiTips.length > 0 ? aiTips : VENDOR_TIPS).slice(0,3).map((tip: any, i: number) => {
            
            const getColor = (icon: string) => {
              switch(icon) {
                case "Flame": case "AlertTriangle": return "text-orange-500 bg-orange-50";
                case "CheckCircle": case "TrendingDown": return "text-green-600 bg-green-50";
                case "Zap": case "Lightbulb": return "text-yellow-600 bg-yellow-50";
                case "MapPin": return "text-blue-500 bg-blue-50";
                default: return "text-indigo-500 bg-indigo-50";
              }
            };

            return (
              <div key={i} className="group flex items-start gap-3.5 hover:bg-slate-50/80 transition-all duration-300 rounded-lg px-3 py-3 cursor-default border-b border-border/40 last:border-0 mb-1">
                <div className={`shrink-0 p-2.5 rounded-full transition-transform duration-300 group-hover:scale-110 ${getColor(tip.icon)}`}>
                  <DynamicIcon name={tip.icon} size={18} />
                </div>
                <div className="pt-0.5">
                  <strong className="block text-sm text-foreground mb-1 font-semibold tracking-tight">
                    {tip.titleEn ? (lang === 'tl' ? tip.title : tip.titleEn) : tip.title}
                  </strong>
                  <p className="text-[13px] leading-relaxed text-muted-foreground">
                    {tip.bodyEn ? (lang === 'tl' ? tip.body : tip.bodyEn) : tip.body}
                  </p>
                </div>
              </div>
            );
          })}
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
