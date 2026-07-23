"use client";

import Link from "next/link";
import { Search, ChevronRight, BarChart2, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { CommodityImage, SL } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";

export default function Home() {
  const { t, lang } = useTranslation();

  const { data: dynamicCommodities = [], isLoading } = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await fetch('/api/commodities');
      return await res.json();
    }
  });

  const volatileCommodity = dynamicCommodities.length > 0 ? dynamicCommodities.find((c: any) => c.volatility === "High") || dynamicCommodities[0] : null;
  const stableCommodity = dynamicCommodities.length > 0 ? dynamicCommodities.find((c: any) => c.volatility === "Low") || dynamicCommodities[dynamicCommodities.length - 1] : null;

  return (
    <div>
      <div className="home-hero px-5 pt-8 pb-6">
        <div className="relative z-10">
          <img src="/images/negoshow-logo.svg" alt="NegoShow" className="h-12 w-auto mb-4 brightness-0 invert opacity-95" />
          <h1 className="text-2xl font-extrabold text-white leading-tight mb-1" dangerouslySetInnerHTML={{ __html: t.home.title.replace(' ', '<br/>') }}></h1>
          <p className="text-white/70 text-base leading-relaxed mb-5 max-w-xl">{t.home.subtitle}</p>
          <Link href="/checker"
            className="bg-white text-primary font-bold text-sm px-5 py-3 rounded-full flex items-center gap-2 active:scale-95 transition-transform shadow-md w-fit">
            <Search size={15}/>{t.home.checkPriceBtn}
          </Link>
        </div>
      </div>

      <div className="px-4 pt-5">
        <SL>{t.home.marketCondition}</SL>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">{t.home.volatileToday}</p>
            {isLoading || !volatileCommodity ? (
              <div className="animate-pulse h-8 bg-muted rounded w-3/4 mt-2"></div>
            ) : (
              <>
                <div className="flex items-center gap-2"><CommodityImage commodity={volatileCommodity} size="sm"/><p className="text-lg font-bold text-foreground">{lang === 'tl' ? volatileCommodity.tagalog : volatileCommodity.name}</p></div>
                <p className="text-xs text-red-600 font-semibold mt-0.5">{t.home.lastDayIncrease}</p>
              </>
            )}
          </div>
          <div className="bg-card rounded-xl p-3 border border-border">
            <p className="text-xs text-muted-foreground mb-1">{t.home.mostStable}</p>
            {isLoading || !stableCommodity ? (
              <div className="animate-pulse h-8 bg-muted rounded w-3/4 mt-2"></div>
            ) : (
              <>
                <div className="flex items-center gap-2"><CommodityImage commodity={stableCommodity} size="sm"/><p className="text-lg font-bold text-foreground">{lang === 'tl' ? stableCommodity.tagalog : stableCommodity.name}</p></div>
                <p className="text-xs text-green-700 font-semibold mt-0.5">{t.home.barelyMoved}</p>
              </>
            )}
          </div>
          <div className="col-span-2 bg-card rounded-xl p-3 border border-border flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t.home.lastBaselineUpdate}</p>
              <p className="text-sm font-bold text-foreground">Jul 10, 2026 — DA Bulletin</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
          </div>
        </div>

        <SL>{t.home.quickAccess}</SL>
        <div className="space-y-2 mb-5">
          {[
            { icon: BarChart2, label: t.home.priceDashboard, sub: t.home.priceDashboardSub, href: "/dashboard" },
            { icon: FileText,  label: t.home.sourcesList,      sub: t.home.sourcesListSub,          href: "/transparency" },
          ].map(({ icon: Icon, label, sub, href }) => (
            <Link key={href} href={href}
              className="w-full flex items-center gap-3 bg-card rounded-xl px-4 py-3 border border-border active:bg-muted transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0"><Icon size={16} className="text-accent"/></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{sub}</p>
              </div>
              <ChevronRight size={15} className="text-muted-foreground shrink-0"/>
            </Link>
          ))}
        </div>
        <div className="mb-6 rounded-xl bg-[#f0ebe4] border border-[#ddd5c8] px-4 py-3">
          <p className="text-xs text-[#72796e] leading-relaxed">
            <span className="font-bold text-foreground">NegoShow</span> {t.home.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
