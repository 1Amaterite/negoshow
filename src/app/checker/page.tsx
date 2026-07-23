"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ChevronDown, Check, CheckCircle, AlertTriangle, Navigation, Shield } from "lucide-react";
import { COMMODITIES, LOCATIONS } from "@/lib/data";
import { Commodity } from "@/lib/types";
import { PageHeader, SL, CommodityImage } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";

export default function CheckerPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [checkerStep, setCheckerStep] = useState<"input" | "result">("input");
  const [checkerCommodity, setCheckerCommodity] = useState<Commodity | null>(null);
  const [quotedPrice, setQuotedPrice] = useState("");
  const [checkerLocation, setCheckerLocation] = useState("");
  const [checkResult, setCheckResult] = useState<"fair" | "flagged" | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [liveBaselines, setLiveBaselines] = useState<any[]>([]);
  const [varianceData, setVarianceData] = useState<{variancePercentage: number, recommendation: string} | null>(null);

  useEffect(() => {
    fetch('/api/baselines')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setLiveBaselines(data);
      })
      .catch(err => console.error("Failed to fetch baselines:", err));
  }, []);

  const onCheck = async () => {
    if (!checkerCommodity || !quotedPrice || !checkerLocation) return;
    
    // Find the live baseline for the selected commodity
    const dbCommodity = liveBaselines.find(b => b.commodity.name.startsWith(checkerCommodity.name))?.commodity;
    const dbLocation = liveBaselines.find(b => b.market.name === checkerLocation)?.market;
    
    // For MVP, default to IDs if not found perfectly
    const commodityId = dbCommodity?.id || COMMODITIES.indexOf(checkerCommodity) + 1;
    const marketId = dbLocation?.id || 1;

    try {
      const res = await fetch("/api/check-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commodityId: commodityId,
          location: marketId,
          quotedPrice: parseFloat(quotedPrice),
        }),
      });
      
      const data = await res.json();
      setCheckResult(data.status.toLowerCase());
      setVarianceData({
        variancePercentage: data.variancePercentage,
        recommendation: data.recommendation
      });
      setCheckerStep("result");
    } catch (err) {
      console.error("Failed to save price check:", err);
      // Fallback
      const variance = (parseFloat(quotedPrice) - checkerCommodity.baseline) / checkerCommodity.baseline;
      setCheckResult(variance > 0.15 ? "flagged" : "fair");
      setCheckerStep("result");
    }
  };

  const onReset = () => {
    setCheckerStep("input");
    setCheckResult(null);
    setQuotedPrice("");
  };

  const canSubmit = checkerCommodity && quotedPrice && parseFloat(quotedPrice) > 0 && checkerLocation;

  if (checkerStep === "result" && checkResult && checkerCommodity) {
    const isFair = checkResult === "fair";
    const quoted = parseFloat(quotedPrice);
    
    const liveData = liveBaselines.find(b => b.commodity.name.startsWith(checkerCommodity.name));
    const currentBaseline = liveData ? liveData.price : checkerCommodity.baseline;
    
    // Use API variance if available, else fallback
    const variancePct = varianceData?.variancePercentage ?? (((quoted - currentBaseline) / currentBaseline) * 100);
    const cheapest = checkerCommodity.sources[0];

    return (
      <div>
        <PageHeader title={t.checker.resultTitle} subtitle={`${lang === 'tl' ? checkerCommodity.tagalog : checkerCommodity.name} · ${checkerLocation}`} />
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
              { label:t.checker.quotedPrice,      value:`₱${quoted}/kg`,          highlight:!isFair },
              { label:t.checker.currentBaseline, value:`₱${currentBaseline}/kg`,   highlight:false },
              { label:t.checker.difference,            value:`${variancePct>0?"+":""}${variancePct.toFixed(1)}%`, highlight:!isFair },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className={`text-sm font-bold ${highlight ? "text-red-600" : "text-foreground"}`}>{value}</p>
              </div>
            ))}
          </div>

          {!isFair && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-amber-200 bg-amber-50">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">{t.checker.cheaperSource}</p>
              </div>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-foreground">{cheapest.name}</p>
                  <p className="text-lg font-extrabold text-green-700">₱{cheapest.price}/kg</p>
                </div>

                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-green-700">{t.checker.saveMoney.replace('{amt}', (quoted - cheapest.price).toFixed(0))}</p>
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-updated flex items-center gap-2 bg-card rounded-xl px-4 py-3 border border-border">
            <Shield size={14} className="text-primary shrink-0"/>
            <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{t.checker.source}: </span>DA Bulletin, Jul 10, 2026 · Metro Manila</p>
          </div>

          {!isFair && (
            <button onClick={() => router.push("/advisor?id=" + checkerCommodity.id + "&quote=" + quotedPrice)} className="w-full bg-primary text-white font-bold text-sm py-4 rounded-full flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
              <Navigation size={16}/>{t.checker.viewActionBtn}
            </button>
          )}
          <button onClick={onReset} className="w-full bg-card border border-border text-foreground font-semibold text-sm py-4 rounded-full active:bg-muted transition-colors">{t.checker.checkAgainBtn}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={t.checker.title} subtitle={t.checker.subtitle} onBack={() => router.push("/")} />
      <div className="px-4 pt-5 space-y-5 pb-6">
        <div>
          <SL>{t.checker.selectCommodity}</SL>
          <div className="commodity-picker-grid">
            {COMMODITIES.map((c) => {
              const liveData = liveBaselines.find(b => b.commodity.name.startsWith(c.name));
              const currentBaseline = liveData ? liveData.price : c.baseline;
              
              return (
                <button key={c.id} onClick={() => setCheckerCommodity(c)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 border transition-all active:scale-[0.99] text-left ${
                    checkerCommodity?.id === c.id ? "bg-primary text-white border-primary" : "bg-card border-border text-foreground"
                  }`}>
                  <CommodityImage commodity={c} size="md"/>
                  <div className="flex-1">
                    <p className="font-semibold text-sm leading-tight">{lang === 'tl' ? c.tagalog : c.name}</p>
                    <p className={`text-xs ${checkerCommodity?.id === c.id ? "text-white/70" : "text-muted-foreground"}`}>{t.checker.baseline}: ₱{currentBaseline}/kg</p>
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
            const liveData = liveBaselines.find(b => b.commodity.name.startsWith(checkerCommodity.name));
            const currentBaseline = liveData ? liveData.price : checkerCommodity.baseline;
            return (
              <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                {t.checker.baseline}: ₱{currentBaseline}/kg ·{" "}
                {parseFloat(quotedPrice) > currentBaseline * 1.15
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
              <span className={`flex-1 text-sm font-medium ${checkerLocation ? "text-foreground" : "text-muted-foreground/60"}`}>
                {checkerLocation || t.checker.selectMarket}
              </span>
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${locationOpen ? "rotate-180" : ""}`}/>
            </button>
            {locationOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                {LOCATIONS.map((loc) => (
                  <button key={loc} onClick={() => { setCheckerLocation(loc); setLocationOpen(false); }}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-muted transition-colors border-b border-border last:border-0 font-medium">{loc}</button>
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
