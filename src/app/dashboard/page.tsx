"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Info, Navigation, Shield } from "lucide-react";
import { SL, CommodityImage, KalagayanChip } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, ReferenceLine, Cell,
} from "@/components/Charts";

export default function DashboardPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  
  const [predCId, setPredCId] = useState<string | null>(null);
  const timeframe = "7";

  const [descCId, setDescCId] = useState<string | null>(null);
  const descTimeframe = "7";

  const { data: dynamicCommodities = [], isLoading: isCommsLoading } = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await fetch('/api/commodities');
      const data = await res.json();
      if (!predCId && data.length > 0) setPredCId(data[0].id);
      if (!descCId && data.length > 0) setDescCId(data[0].id);
      return data;
    },
    staleTime: 300000,
    refetchInterval: 5000
  });

  const { data: predData = [], isLoading: isPredLoading } = useQuery({
    queryKey: ['trend', predCId, timeframe],
    queryFn: async () => {
      if (!predCId) return [];
      const res = await fetch(`/api/analytics/trend?commodityId=${predCId}&days=${timeframe}`);
      return await res.json();
    },
    enabled: !!predCId,
    staleTime: 300000,
    refetchInterval: 5000
  });

  const { data: descPrices, isLoading: isDescPricesLoading } = useQuery({
    queryKey: ['desc-prices', descCId, descTimeframe],
    queryFn: async () => {
      if (!descCId) return null;
      const res = await fetch(`/api/analytics/descriptive/prices?commodityId=${descCId}&days=${descTimeframe}`);
      return await res.json();
    },
    enabled: !!descCId,
    staleTime: 300000,
    refetchInterval: 5000
  });

  const { data: descActivity, isLoading: isDescActivityLoading } = useQuery({
    queryKey: ['desc-activity', descTimeframe],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/descriptive/activity?days=${descTimeframe}`);
      return await res.json();
    },
    staleTime: 300000,
    refetchInterval: 5000
  });

  const { data: lastUpdateData } = useQuery({
    queryKey: ['lastUpdate'],
    queryFn: async () => {
      const res = await fetch('/api/system/last-update');
      return await res.json();
    },
    staleTime: 300000,
    refetchInterval: 5000
  });

  const VARIANCE_DATA = dynamicCommodities.map((c: any) => ({
    name: (t.commodities as Record<string, string>)[c.shortLabel] || c.shortLabel,
    "Middleman Asking Price": c.vendorQuoteAvg,
    "Baseline (Retail Price)": c.baseline,
    variancePct: parseFloat(c.change.toFixed(1)),
  }));

  const predC = dynamicCommodities.find((c: any) => c.id === predCId) || dynamicCommodities[0];
  const peak = predData.find((d: any) => d.isPeak);
  const volatileCount = dynamicCommodities.filter((c: any) => c.volatility === "High").length;
  const avgChange = dynamicCommodities.length > 0 ? (dynamicCommodities.reduce((s: number,c: any) => s + c.change, 0) / dynamicCommodities.length).toFixed(1) : "0.0";
  const risingCount = dynamicCommodities.filter((c: any) => c.trend === "up").length;

  const VarTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-foreground mb-1">{payload[0]?.payload?.name}</p>
        {payload.map((p: any) => <p key={p.name} style={{color:p.color}} className="font-semibold">{p.name}: ₱{p.value}</p>)}
      </div>
    );
  };

  const PredTip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const a = payload.find((p:any) => p.dataKey === "aktwal");
    const h = payload.find((p:any) => p.dataKey === "hula");
    return (
      <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {a?.value != null && <p className="text-primary font-semibold">{t.dashboard.actualPrice}: ₱{a.value}</p>}
        {h?.value != null && <p className="text-amber-600 font-semibold">{t.dashboard.predictedPrice}: ₱{h.value}</p>}
      </div>
    );
  };

  if (isCommsLoading) return <div className="p-8 text-center text-muted-foreground">Loading dashboard data...</div>;

  return (
    <div className="dashboard-page">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-5 md:px-10 lg:px-14 py-4 md:py-5">
        <h1 className="text-xl md:text-2xl font-extrabold text-foreground">{t.dashboard.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.dashboard.subtitle}</p>
      </div>
      <div className="dashboard-content px-5 md:px-10 lg:px-14 py-6 md:py-8">
        {/* DESCRIPTIVE ANALYTICS PANELS */}
        <div className="dashboard-overview mb-8">
          <div className="flex items-center justify-between mb-4">
            <SL>{t.dashboard.descriptiveAnalytics}</SL>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t.dashboard.volatileCommodities}</p>
                <p className="text-xl font-extrabold text-red-600">{volatileCount} <span className="text-sm text-muted-foreground font-normal">{t.common.of} {dynamicCommodities.length}</span></p>
              </div>
              <p className="text-xs text-red-600 font-semibold mt-2 truncate">{dynamicCommodities.filter((c: any) => c.volatility === "High").map((c: any) => (t.commodities as Record<string, string>)[c.shortLabel] || c.shortLabel).join(", ") || t.common.none}</p>
            </div>
            
            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t.dashboard.avgPriceChange}</p>
                <p className={`text-xl font-extrabold ${parseFloat(avgChange)>0?"text-red-600":"text-green-700"}`}>{parseFloat(avgChange)>0?"+":""}{avgChange}%</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{t.dashboard.fromAIBulletins}</p>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t.dashboard.risingPrices}</p>
                <p className="text-xl font-extrabold text-foreground">{risingCount} <span className="text-sm text-muted-foreground font-normal">{t.dashboard.commodities}</span></p>
              </div>
              <div className="flex items-center gap-1 mt-2"><TrendingUp size={12} className="text-red-500"/><span className="text-[10px] text-red-600 font-semibold">{t.dashboard.buyWithCaution}</span></div>
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex flex-col justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t.dashboard.vendorChecksToday}</p>
                <p className="text-xl font-extrabold text-blue-700">{isDescActivityLoading ? "..." : (descActivity?.kpi?.checksToday || 0)}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{t.dashboard.quotesSubmitted}</p>
            </div>
          </div>

          {/* Panel 1: Commodity Price Overview */}
          <section className="dashboard-section mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">{t.dashboard.commodityPriceOverview}</h2>
                <p className="text-xs text-muted-foreground">{t.dashboard.commodityPriceSub}</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <select 
                  value={descCId || ""} 
                  onChange={(e) => setDescCId(e.target.value)}
                  className="bg-card border border-border rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px] max-w-[250px] md:max-w-xs"
                >
                  {dynamicCommodities.map((c: any) => (
                    <option key={c.id} value={c.id}>{(t.commodities as Record<string, string>)[c.name] || c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">{t.dashboard.currentMedian}</p>
                <p className="text-xl font-extrabold text-foreground">
                  {isDescPricesLoading ? "..." : `₱${descPrices?.kpi?.median || 0}`}
                </p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">{t.dashboard.highestPrice}</p>
                <p className="text-xl font-extrabold text-red-600">
                  {isDescPricesLoading ? "..." : `₱${descPrices?.kpi?.highest || 0}`}
                </p>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
                <p className="text-xs text-muted-foreground mb-1">{t.dashboard.lowestPrice}</p>
                <p className="text-xl font-extrabold text-green-700">
                  {isDescPricesLoading ? "..." : `₱${descPrices?.kpi?.lowest || 0}`}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden px-2 pt-4 pb-3 shadow-sm">
              {isDescPricesLoading ? <div className="h-[240px] flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div> : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={descPrices?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(114,121,110,0.15)"/>
                    <XAxis dataKey="date" tick={{fontSize:9,fill:"#72796e"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} width={45} tickFormatter={(v: any)=>`₱${v}`}/>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                    <Line type="monotone" dataKey="price" name="Avg Baseline" stroke="#154212" strokeWidth={2.5} dot={{fill:"#154212",r:3}} connectNulls={false}/>
                    <Line type="monotone" dataKey="askingPrice" name="Avg Vendor Quote" stroke="#c8a97a" strokeWidth={2.5} dot={{fill:"#c8a97a",r:3}} connectNulls={false}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Panel 2: Vendor Check Activity Summary */}
          <section className="dashboard-section dashboard-activity">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-foreground">{t.dashboard.vendorCheckActivity}</h2>
              <p className="text-xs text-muted-foreground">{t.dashboard.vendorCheckSub}</p>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm mb-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-wide text-xs">{t.dashboard.totalChecksToday}</th>
                    <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-wide text-xs">{t.dashboard.mostCheckedCommodity}</th>
                    <th className="px-4 py-2 font-bold text-muted-foreground uppercase tracking-wide text-xs">{t.dashboard.topMarket}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-4 py-3 font-extrabold text-blue-700">{isDescActivityLoading ? "..." : (descActivity?.kpi?.checksToday || 0)}</td>
                    <td className="px-4 py-3 font-extrabold text-foreground">{isDescActivityLoading ? "..." : (descActivity?.kpi?.mostCheckedCommodity || "N/A")}</td>
                    <td className="px-4 py-3 font-extrabold text-foreground">{isDescActivityLoading ? "..." : (descActivity?.kpi?.topMarket || "N/A")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border px-4 pt-4 pb-2 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">{t.dashboard.checksPerMarket}</p>
                {isDescActivityLoading ? <div className="h-[200px] flex items-center justify-center text-xs">Loading...</div> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={descActivity?.marketBarData || []} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(114,121,110,0.15)"/>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} width={80}/>
                      <Tooltip cursor={{fill:"rgba(0,0,0,0.05)"}} contentStyle={{ borderRadius: '12px', fontSize: '12px' }}/>
                      <Bar dataKey="checks" name="Checks" fill="#2563eb" radius={[0,4,4,0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border px-4 pt-4 pb-2 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">{t.dashboard.marketsOverBaseline}</p>
                {isDescActivityLoading ? <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Loading...</div> : (
                  descActivity?.overBaselineData?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={descActivity.overBaselineData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(114,121,110,0.15)"/>
                        <XAxis dataKey="name" tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill:"rgba(0,0,0,0.05)"}} contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }}/>
                        <Bar dataKey="overCount" name="Over Baseline Quotes" fill="#dc2626" radius={[4,4,0,0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground text-center" dangerouslySetInnerHTML={{__html: t.dashboard.noQuotesOverBaseline.replace('\n', '<br/>')}}>
                    </div>
                  )
                )}
              </div>
            </div>
          </section>
        </div>

        {/* DIAGNOSTIC */}
        <section className="dashboard-section dashboard-variance mt-8">
          <div className="mb-4">
            <SL>{t.dashboard.diagnosticAnalytics}</SL>
          </div>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-4">
            <div className="px-4 pt-4 pb-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary"/><span className="text-[10px] text-muted-foreground font-semibold">{t.dashboard.baselineRetailPrice}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#c8a97a]"/><span className="text-[10px] text-muted-foreground font-semibold">{t.dashboard.middlemanAskingPrice}</span></div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={VARIANCE_DATA} barCategoryGap="28%" barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(114,121,110,0.15)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} width={45} tickFormatter={(v: any)=>`₱${new Intl.NumberFormat('en-US').format(v)}`} domain={[0,"auto"]}/>
                  <Tooltip content={<VarTip/>}/>
                  <Bar dataKey="Middleman Asking Price" fill="#c8a97a" radius={[3,3,0,0]}/>
                  <Bar dataKey="Baseline (Retail Price)" radius={[3,3,0,0]}>
                    {VARIANCE_DATA.map((d: any,i: number)=><Cell key={i} fill={d.variancePct>10?"#c62828":d.variancePct<-10?"#2d5a27":"#154212"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{t.dashboard.highlyVariant}</h3>
            
            {VARIANCE_DATA.filter((d: any)=>Math.abs(d.variancePct)>10).length > 0 ? (
              VARIANCE_DATA.filter((d: any)=>Math.abs(d.variancePct)>10).map((d: any)=>{
                const hi = d.variancePct > 0;
                return (
                  <div key={d.name} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${hi?"bg-red-50 border-red-200":"bg-green-50 border-green-200"}`}>
                    <div>
                      <p className="text-xs font-bold text-foreground">{d.name}</p>
                      <p className={`text-[10px] font-semibold ${hi?"text-red-600":"text-green-700"}`}>
                        {hi?t.dashboard.higherThanBaseline.replace('{{amt}}', (d["Middleman Asking Price"]-d["Baseline (Retail Price)"]).toFixed(1)) : t.dashboard.lowerThanBaseline.replace('{{amt}}', (d["Baseline (Retail Price)"]-d["Middleman Asking Price"]).toFixed(1))}
                      </p>
                    </div>
                    <span className={`text-base font-extrabold ${hi?"text-red-600":"text-green-700"}`}>{hi?"+":""}{d.variancePct}%</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-5 bg-card border border-border rounded-xl shadow-sm">
                <p className="text-xs text-muted-foreground">{t.dashboard.allQuotesWithin10}</p>
              </div>
            )}
          </div>
        </section>

        {/* PREDICTIVE */}
        <section className="dashboard-section dashboard-forecast mt-8">
          <div className="mb-4">
            <SL>{t.dashboard.predictiveAnalytics}</SL>
          </div>
          
          <div className="flex overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 gap-2 mb-4 scrollbar-hide">
            {dynamicCommodities.map((c: any)=>(
              <button key={c.id} onClick={()=>setPredCId(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all shrink-0 hover:shadow-sm active:scale-95 ${
                  predC?.id===c.id?"bg-primary text-white border-primary":"bg-card border-border hover:bg-muted/50 text-foreground"
                }`}><CommodityImage commodity={c} size="sm" className="!w-6 !h-6 !rounded-md"/>{(t.commodities as Record<string, string>)[c.shortLabel] || c.shortLabel}</button>
            ))}
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {peak && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-200">
                <AlertTriangle size={13} className="text-amber-600 shrink-0"/>
                <p className="text-xs font-semibold text-amber-900">{t.dashboard.expectedPeak.replace('{{price}}', (peak.hula || 0).toString()).replace('{{date}}', peak.araw)}</p>
              </div>
            )}
            <div className="px-2 pt-4 pb-3">
              <div className="flex items-center gap-4 px-2 mb-3">
                <div className="flex items-center gap-1.5"><div className="w-5 h-0.5 bg-primary rounded"/><span className="text-[10px] text-muted-foreground font-semibold">{t.dashboard.actualPrice}</span></div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-0.5 rounded" style={{backgroundImage:"repeating-linear-gradient(to right,#f59e0b 0,#f59e0b 4px,transparent 4px,transparent 7px)"}}/>
                  <span className="text-[10px] text-muted-foreground font-semibold">{t.dashboard.predictedPrice}</span>
                </div>
              </div>
              {isPredLoading ? <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div> : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={predData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(114,121,110,0.15)"/>
                    <XAxis dataKey="araw" tick={{fontSize:9,fill:"#72796e"}} axisLine={false} tickLine={false}/>
                    <YAxis tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} width={45} tickFormatter={(v: any)=>`₱${new Intl.NumberFormat('en-US').format(v)}`} domain={["auto","auto"]}/>
                    <Tooltip content={<PredTip/>}/>
                    <ReferenceLine x={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} stroke="rgba(114,121,110,0.4)" strokeDasharray="4 4" label={{value:"Today",position:"top",fontSize:9,fill:"#72796e"}}/>
                    <Line type="monotone" dataKey="aktwal" name={t.dashboard.actualPrice} stroke="#154212" strokeWidth={2.5} dot={{fill:"#154212",r:3}} connectNulls={false}/>
                    <Line type="monotone" dataKey="hula"   name={t.dashboard.predictedPrice} stroke="#f59e0b" strokeWidth={2}   strokeDasharray="5 4" dot={{fill:"#f59e0b",r:3}} connectNulls={false}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 flex items-start gap-1 leading-relaxed">
            <Info size={10} className="mt-0.5 shrink-0"/>
            {t.dashboard.predictionInfo}
          </p>
        </section>

        <section className="dashboard-section dashboard-procurement-cta mt-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary mb-2">{t.dashboard.procurementCenter}</p>
              <h2 className="text-xl font-extrabold text-foreground">{t.dashboard.makeBetterDecisions}</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{t.dashboard.compareSuppliers}</p>
            </div>
            <button onClick={() => router.push("/procurement")} className="shrink-0 bg-primary text-white font-bold text-sm px-5 py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
              <Navigation size={15}/>{t.dashboard.openProcurement}
            </button>
          </div>
        </section>

        <div className="dashboard-updated flex items-center gap-2 bg-card rounded-xl px-4 py-3 border border-border mt-8">
          <Clock size={14} className="text-muted-foreground"/>
          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{t.dashboard.lastUpdate}:</span> {lastUpdateData ? new Date(lastUpdateData.lastUpdate).toLocaleString(lang === 'tl' ? 'tl-PH' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : "Loading..."} · DA Bulletin</p>
        </div>
      </div>
    </div>
  );
}
