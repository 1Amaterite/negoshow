"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown, Check, CheckCircle, AlertTriangle, Navigation, Shield, Users } from "lucide-react";
import { PageHeader, SL, CommodityImage } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { QuoteCheckerWalkthrough } from "@/components/QuoteCheckerWalkthrough";

export default function CheckerPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [checkerStep, setCheckerStep] = useState<"input" | "result">("input");
  const [checkerCommodity, setCheckerCommodity] = useState<any | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [checkerMarketId, setCheckerMarketId] = useState<number | "">("");
  const [checkResult, setCheckResult] = useState<"fair" | "flagged" | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [varianceData, setVarianceData] = useState<{variancePercentage: number, recommendation: string} | null>(null);

  const { data: dynamicCommodities = [], isLoading } = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await fetch('/api/commodities');
      return await res.json();
    }
  });

  const { data: markets = [] } = useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await fetch('/api/markets');
      return await res.json();
    }
  });

  const checkerLocationName = markets.find((m: any) => m.id === checkerMarketId)?.name || "";

  const { data: peerData = null, refetch: fetchPeers } = useQuery({
    queryKey: ['peers', checkerCommodity?.id, checkerMarketId],
    queryFn: async () => {
      if (!checkerCommodity || !checkerMarketId) return null;
      const res = await fetch(`/api/analytics/peers?commodityId=${checkerCommodity.id}&marketId=${checkerMarketId}`);
      if (!res.ok) return null;
      return await res.json();
    },
    enabled: false
  });

  const onCheck = async () => {
    if (!checkerCommodity || !quotedPrice || !checkerMarketId) return;

    try {
      const res = await fetch("/api/check-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodityId: checkerCommodity.id,
          location: checkerMarketId,
          quotedPrice: parseFloat(quotedPrice),
        }),
      });
      
      const data = await res.json();
      setCheckResult(data.status.toLowerCase());
      setVarianceData({
        variancePercentage: data.variancePercentage,
        recommendation: data.recommendation
      });
      
      fetchPeers();
      setCheckerStep("result");
    } catch (err) {
      console.error("Failed to save price check:", err);
      const variance = (parseFloat(quotedPrice) - checkerCommodity.baseline) / checkerCommodity.baseline;
      setCheckResult(variance > 0.15 ? "flagged" : "fair");
      setCheckerStep("result");
      fetchPeers();
    }
  };

  const onReset = () => {
    setCheckerStep("input");
    setCheckResult(null);
    setQuotedPrice("");
  };

  const canSubmit = checkerCommodity && quotedPrice && parseFloat(quotedPrice) > 0 && checkerMarketId !== "";

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading commodities...</div>;

  if (checkerStep === "result" && checkResult && checkerCommodity) {
    const isFair = checkResult === "fair";
    const quoted = parseFloat(quotedPrice);
    
    const variancePct = varianceData?.variancePercentage ?? (((quoted - checkerCommodity.baseline) / checkerCommodity.baseline) * 100);

    return (
      <div>
        <QuoteCheckerWalkthrough />
        <PageHeader title={t.checker.resultTitle} subtitle={`${lang === 'tl' ? checkerCommodity.tagalog : checkerCommodity.name} · ${checkerLocationName}`} />
        <div className="px-4 pt-5 space-y-4 pb-6">
          <div className={`rounded-2xl p-5 border-2 ${isFair ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isFair ? "bg-green-600" : "bg-red-600"}`}>
                {isFair ? <CheckCircle size={24} className="text-white"/> : <AlertTriangle size={24} className="text-white"/>}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${isFair ? "text-green-700" : "text-red-700"}`}>{isFair ? t.checker.fair : t.checker.flagged}</p>
                <p className={`text-2xl font-extrabold ${isFair ? "text-green-800" : "text-red-800"}`}>{isFair ? t.checker.fairPrice : t.checker.tooExpensive}</p>
                <p className={`text-sm mt-1 ${isFair ? "text-green-700" : "text-red-700"}`}>
                  {varianceData?.recommendation || (isFair ? t.checker.fairDesc : t.checker.flaggedDesc.replace('{pct}', Math.abs(variancePct).toFixed(1)))}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border"><p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t.checker.priceBreakdown}</p></div>
            {[
              { label:t.checker.quotedPrice,      value:`₱${quoted.toFixed(2)}/kg`,          highlight:!isFair },
              { label:t.checker.currentBaseline, value:`₱${checkerCommodity.baseline.toFixed(2)}/kg`,   highlight:false },
              { label:t.checker.difference,            value:`${variancePct>0?"+":""}${variancePct.toFixed(1)}%`, highlight:!isFair },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-sm font-bold ${highlight ? "text-red-600" : "text-foreground"}`}>{value}</p>
              </div>
            ))}
          </div>

          {!isFair && peerData && peerData.averagePeerPrice && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-blue-200 bg-blue-50 flex items-center gap-2">
                <Users size={14} className="text-blue-700"/>
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Community Check</p>
              </div>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-foreground">Average Peer Price</p>
                  <p className="text-lg font-extrabold text-blue-700">₱{peerData.averagePeerPrice}/kg</p>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Based on {peerData.recentReports.length} recent reports from vendors in {checkerLocationName}.
                </div>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-blue-700">You could save ₱{(quoted - peerData.averagePeerPrice).toFixed(0)} if you match the peer average.</p>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-updated flex items-center gap-2 bg-card rounded-xl px-4 py-3 border border-border">
            <Shield size={14} className="text-primary shrink-0"/>
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{t.checker.source}: </span>DA Bulletin, {new Date().toLocaleDateString()} · {checkerLocationName || "Metro Manila"}</p>
          </div>

          <button onClick={() => router.push("/advisor?id=" + checkerCommodity.id + "&quote=" + quotedPrice)} className="w-full bg-primary text-white font-bold text-sm py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
            <Navigation size={16}/>{t.checker.viewActionBtn}
          </button>
          
          <button onClick={onReset} className="w-full bg-card border border-border text-foreground font-semibold text-sm py-4 rounded-full active:bg-muted transition-colors">{t.checker.checkAgainBtn}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <QuoteCheckerWalkthrough />
      <PageHeader title={t.checker.title} subtitle={t.checker.subtitle} onBack={() => router.push("/")} />
      <div className="px-4 pt-5 space-y-5 pb-6">
        <div>
          <SL>{t.checker.selectCommodity}</SL>
          <div className="commodity-picker-grid">
            {dynamicCommodities.map((c: any) => {
              return (
                <button key={c.id} onClick={() => setCheckerCommodity(c)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border transition-all active:scale-[0.99] text-left ${
                    checkerCommodity?.id === c.id ? "bg-primary text-white border-primary" : "bg-card border-border text-foreground"
                  }`}>
                  <CommodityImage commodity={c} size="md"/>
                  <div className="flex-1">
                    <p className="font-semibold text-sm leading-tight">{lang === 'tl' ? c.tagalog : c.name}</p>
                    <p className={`text-xs ${checkerCommodity?.id === c.id ? "text-white/70" : "text-muted-foreground"}`}>{t.checker.baseline}: ₱{c.baseline}/kg</p>
                  </div>
                  {checkerCommodity?.id === c.id && <Check size={16} className="text-white shrink-0"/>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <SL>{t.checker.pricePerKilo}</SL>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₱</span>
            <input type="text" inputMode="decimal" value={quotedPrice} onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) {
                setQuotedPrice(val);
              }
            }} placeholder="0.00"
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-4 text-xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"/>
          </div>
          {checkerCommodity && quotedPrice && (() => {
            return (
              <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                {t.checker.baseline}: ₱{checkerCommodity.baseline}/kg ·{" "}
                {parseFloat(quotedPrice) > checkerCommodity.baseline * 1.15
                  ? <span className="text-red-600 font-semibold">{t.checker.higherThanBaseline}</span>
                  : <span className="text-green-700 font-semibold">{t.checker.withinRange}</span>}
              </p>
            );
          })()}
        </div>

        <div>
          <SL>{t.checker.currentLocation}</SL>
          <div className="relative">
            <button onClick={() => setLocationOpen(!locationOpen)}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-4 text-left active:bg-muted transition-colors">
              <MapPin size={16} className="text-muted-foreground shrink-0"/>
              <span className={`flex-1 text-sm font-medium ${checkerMarketId !== "" ? "text-foreground" : "text-muted-foreground/60"}`}>
                {checkerLocationName || t.checker.selectMarket}
              </span>
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${locationOpen ? "rotate-180" : ""}`}/>
            </button>
            {locationOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                {markets.map((m: any) => (
                  <button key={m.id} onClick={() => { setCheckerMarketId(m.id); setLocationOpen(false); }}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-muted transition-colors border-b border-border last:border-0 font-medium">{m.name}</button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={onCheck} disabled={!canSubmit}
          className="w-full bg-primary text-white font-bold text-base py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-primary/20">
          <Search size={18}/>{t.checker.checkPriceBtn}
        </button>
      </div>
    </div>
  );
}
