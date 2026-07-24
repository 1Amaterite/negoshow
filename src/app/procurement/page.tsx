"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Clock, ChevronRight, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { VENDOR_TIPS } from "@/lib/constants";
import { CommodityImage, DynamicIcon } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, ReferenceLine
} from "@/components/Charts";

export default function ProcurementPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [tab, setTab] = useState<"overview"|"prices"|"recommendations">("overview");
  const [predCId, setPredCId] = useState<string | null>(null);

  const { data: dynamicCommodities = [], isLoading } = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await fetch('/api/commodities');
      const data = await res.json();
      if (!predCId && data.length > 0) setPredCId(data[0].id);
      return data;
    }
  });

  // Fetch Historical Trend Data
  const { data: trendData = [], isLoading: isTrendLoading } = useQuery({
    queryKey: ['trend', predCId, "30"],
    queryFn: async () => {
      if (!predCId) return [];
      const res = await fetch(`/api/analytics/trend?commodityId=${predCId}&days=30`);
      return await res.json();
    },
    enabled: !!predCId
  });

  const { data: lastUpdateData } = useQuery({
    queryKey: ['lastUpdate'],
    queryFn: async () => {
      const res = await fetch('/api/system/last-update');
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

  if (isLoading) return <div className="p-8 text-center text-muted-foreground text-sm">Loading procurement data...</div>;

  const totalSavings = dynamicCommodities.reduce((sum: number,c: any)=>sum + Math.max(0,c.baseline-c.sources[0].price)*10,0);
  const buyNow = dynamicCommodities.filter((c: any)=>c.trend!=="up").length;
  const markets = new Set(dynamicCommodities.flatMap((c: any)=>c.sources.map((s: any)=>s.name))).size;

  const onOpenAdvisor = (c: any) => {
    router.push(`/advisor?id=${c.id}`);
  };
  
  const predC = dynamicCommodities.find((c: any) => c.id === predCId) || dynamicCommodities[0];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        <p className="text-primary font-semibold">{t.dashboard?.actualPrice || "Baseline Price"}: ₱{payload[0].value}</p>
      </div>
    );
  };

  return (
    <div className="procurement-page">
      <div className="procurement-hero">
        <div>
          <p className="procurement-eyebrow">{t.procurement.eyebrow}</p>
          <h1>{t.procurement.title}</h1>
          <p>{t.procurement.subtitle}</p>
        </div>
        <div className="procurement-date"><Clock size={15}/> {t.procurement.lastUpdate}: {lastUpdateData ? new Date(lastUpdateData.lastUpdate).toLocaleString(lang === 'tl' ? 'tl-PH' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : "Loading..."}</div>
      </div>

      <div className="procurement-tabs">
        {[{id:"overview",label:t.procurement.tabs.overview},{id:"prices",label:t.procurement.tabs.prices},{id:"recommendations",label:t.procurement.tabs.recommendations}].map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id as typeof tab)} className={tab===item.id?"active":""}>{item.label}</button>
        ))}
      </div>

      <div className="procurement-content">
        <div key={tab} className="tab-transition">
        {tab==="overview" && <>
          <div className="procurement-kpis">
            <div><span>{t.procurement.kpis.savings}</span><strong>₱{totalSavings.toLocaleString()}</strong><small>{t.procurement.kpis.savingsDesc}</small></div>
            <div><span>{t.procurement.kpis.buyNow}</span><strong>{buyNow}</strong><small>{t.procurement.kpis.buyNowDesc}</small></div>
            <div><span>{t.procurement.kpis.markets}</span><strong>{markets}</strong><small>{t.procurement.kpis.marketsDesc}</small></div>
            <div><span>{t.procurement.kpis.volatile}</span><strong>{dynamicCommodities.filter((c: any)=>c.volatility==="High").length}</strong><small>{t.procurement.kpis.volatileDesc}</small></div>
          </div>

          <div className="procurement-grid">
            <section className="procurement-panel procurement-main-panel">
              <div className="panel-heading"><div><h2>{t.procurement.todayPlan.title}</h2><p>{t.procurement.todayPlan.subtitle}</p></div></div>
              <div className="recommendation-list">
                {dynamicCommodities.map((c: any)=>{
                  const rising=c.trend==="up";
                  const action=rising?t.procurement.todayPlan.wait:t.procurement.todayPlan.buy;
                  return <button key={c.id} onClick={()=>onOpenAdvisor(c)} className="recommendation-row">
                    <div className="commodity-cell"><CommodityImage commodity={c} size="sm"/><div><strong>{lang === 'tl' ? c.tagalog : c.name}</strong><small>{c.name}</small></div></div>
                    <div><small>{t.procurement.todayPlan.lowestPrice}</small><strong className="price-good">₱{c.sources[0].price}/kg</strong></div>
                    <div><small>{t.procurement.todayPlan.bestSource}</small><strong>{c.sources[0].name}</strong></div>
                    <div className={`action-pill ${rising?"wait":"buy"}`}>{action}</div>
                    <ChevronRight size={17}/>
                  </button>
                })}
              </div>
            </section>

            <aside className="procurement-panel tips-panel">
            <div className="procurement-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="mb-0">{t.procurement.dailyTips}</h3>
                <button onClick={() => refetchTips()} disabled={isTipsFetching} className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50">
                  <Sparkles size={13} className={isTipsFetching ? "animate-spin" : ""} />
                  {isTipsFetching ? (lang === 'tl' ? "Nag-iisip..." : "Thinking...") : (lang === 'tl' ? "Bagong Tips" : "New Tips")}
                </button>
              </div>
              <div className="flex flex-col gap-3 mt-3">
                {isTipsLoading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground bg-muted/50 rounded-xl flex items-center justify-center min-h-[150px]">
                    <Sparkles size={16} className="animate-spin mr-2 text-amber-500" />
                    {lang === 'tl' ? "Bumubuo ng mga tip mula sa AI..." : "Generating AI tips..."}
                  </div>
                ) : (aiTips.length > 0 ? aiTips : VENDOR_TIPS).map((tip: any, i: number) => {
                  
                  // Map specific icons to specific colors for visual pop
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
                    <div key={i} className="group flex items-start gap-3.5 hover:bg-slate-50/80 transition-all duration-300 rounded-lg px-3 py-3 cursor-default border-b border-border/40 last:border-0">
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
            </div>
            </aside>
          </div>
        </>}

        {tab==="prices" && <section className="space-y-6">
          <div className="procurement-panel">
            <div className="panel-heading mb-4">
              <div>
                <h2>Historical Price Trends</h2>
                <p>Analyze how the baseline prices have changed over the last 30 days to optimize your procurement strategy.</p>
              </div>
            </div>
            
            <div className="flex gap-1.5 mb-3 mt-2 overflow-x-auto pb-1 scrollbar-hide px-4">
              {dynamicCommodities.map((c: any)=>(
                <button key={c.id} onClick={()=>setPredCId(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors shrink-0 ${
                    predC?.id===c.id?"bg-primary text-white border-primary":"bg-card border-border text-foreground"
                  }`}><CommodityImage commodity={c} size="sm" className="!w-6 !h-6 !rounded-md"/>{c.shortLabel}</button>
              ))}
            </div>

            <div className="px-4 pb-4">
              {isTrendLoading ? (
                <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(114,121,110,0.15)"/>
                    <XAxis dataKey="araw" tick={{fontSize:9,fill:"#72796e"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} width={45} tickFormatter={(v: any)=>`₱${v}`}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Line type="monotone" dataKey="aktwal" stroke="#154212" strokeWidth={2.5} dot={{fill:"#154212",r:3}} connectNulls={false}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          <div className="procurement-panel">
            <div className="panel-heading"><div><h2>{t.procurement.priceComparison.title}</h2><p>{t.procurement.priceComparison.subtitle}</p></div></div>
            <div className="price-table-wrap"><table className="price-table"><thead><tr><th>{t.procurement.priceComparison.commodity}</th><th>{t.procurement.priceComparison.currentBaseline}</th><th>{t.procurement.priceComparison.lowestOffer}</th><th>{t.procurement.priceComparison.avg30Day}</th><th>{t.procurement.priceComparison.difference}</th><th>{t.procurement.priceComparison.market}</th></tr></thead><tbody>
              {dynamicCommodities.map((c: any)=><tr key={c.id}><td><CommodityImage commodity={c} size="sm"/><strong>{lang === 'tl' ? c.tagalog : c.name}</strong></td><td>₱{c.baseline}/kg</td><td className="price-good">₱{c.sources[0].price}/kg</td><td>₱{c.baseline30d}/kg</td><td className={c.sources[0].price<c.baseline?"price-good":""}>{t.procurement.priceComparison.lower.replace('{{amt}}', Math.abs(c.baseline-c.sources[0].price).toString())}</td><td>{c.sources[0].name}<small>{c.sources[0].distance}</small></td></tr>)}
            </tbody></table></div>
          </div>
        </section>}

        {tab==="recommendations" && <div className="recommendation-cards">
          {dynamicCommodities.map((c: any)=>{ const rising=c.trend==="up"; return <article key={c.id} className="procurement-panel recommendation-card">
            <div className="recommendation-card-top"><CommodityImage commodity={c} size="lg" className="commodity-photo"/><div><h2>{lang === 'tl' ? c.tagalog : c.name}</h2><p>{c.name}</p></div><div className={`action-pill ${rising?"wait":"buy"}`}>{rising?t.procurement.todayPlan.wait:t.procurement.todayPlan.buy}</div></div>
            <p className="recommendation-reason">{rising?t.procurement.recommendationCard.waitReason.replace('{{change}}', c.change.toString()):t.procurement.recommendationCard.buyReason.replace('{{trend}}', c.trend==="down"?t.procurement.recommendationCard.down:t.procurement.recommendationCard.stable)}</p>
            <div className="recommendation-metrics"><div><small>{t.procurement.recommendationCard.cheapestSource}</small><strong>{c.sources[0].name}</strong></div><div><small>{t.procurement.recommendationCard.lowestPrice}</small><strong className="price-good">₱{c.sources[0].price}/kg</strong></div><div><small>{t.procurement.recommendationCard.potentialSavings}</small><strong>₱{Math.max(0,(c.baseline-c.sources[0].price)*10)}</strong></div></div>
            <button onClick={()=>onOpenAdvisor(c)}>{t.procurement.recommendationCard.viewDetails} <ChevronRight size={15}/></button>
          </article>})}
        </div>}
        </div>
      </div>
    </div>
  );
}
