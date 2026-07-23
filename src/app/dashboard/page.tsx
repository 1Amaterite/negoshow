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
  const { t } = useTranslation();
  
  const [predCId, setPredCId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"7" | "30">("30");

  const { data: dynamicCommodities = [], isLoading: isCommsLoading } = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await fetch('/api/commodities');
      const data = await res.json();
      if (!predCId && data.length > 0) setPredCId(data[0].id);
      return data;
    }
  });

  const { data: predData = [], isLoading: isPredLoading } = useQuery({
    queryKey: ['trend', predCId, timeframe],
    queryFn: async () => {
      if (!predCId) return [];
      const res = await fetch(`/api/analytics/trend?commodityId=${predCId}&days=${timeframe}`);
      return await res.json();
    },
    enabled: !!predCId
  });

  const VARIANCE_DATA = dynamicCommodities.map((c: any) => ({
    name: c.shortLabel,
    "30-Araw na Karaniwan": c.baseline30d,
    "Kasalukuyan": c.baseline,
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
    const a = payload.find((p:any) => p.name === "Aktwal na Presyo");
    const h = payload.find((p:any) => p.name === "Hinulaang Presyo");
    return (
      <div className="bg-background border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
        <p className="font-bold text-foreground mb-1">{label}</p>
        {a?.value != null && <p className="text-primary font-semibold">{t.dashboard.actualPrice}: ₱{a.value}</p>}
        {h?.value != null && <p className="text-amber-600 font-semibold">Hula: ₱{h.value}</p>}
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

        {/* DESCRIPTIVE */}
        <section className="dashboard-section dashboard-overview">
          <SL>{t.dashboard.keyMetrics}</SL>
          <div className="grid grid-cols-2 gap-2 mb-5">
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">{t.dashboard.marketStability}</p>
              <p className="text-xl font-extrabold text-amber-700">Katamtaman</p>
              <div className="flex items-center gap-1 mt-1">
                <div className="flex gap-0.5">{[1,2,3].map(i=><div key={i} className={`h-1.5 w-4 rounded-full ${i<=2?"bg-amber-500":"bg-muted"}`}/>)}</div>
                <span className="text-xs text-muted-foreground">2/3</span>
              </div>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">{t.dashboard.volatileCommodities}</p>
              <p className="text-xl font-extrabold text-red-600">{volatileCount} <span className="text-sm text-muted-foreground font-normal">sa {dynamicCommodities.length}</span></p>
              <p className="text-xs text-red-600 font-semibold mt-1">Sibuyas Pula, Luya</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">{t.dashboard.avgPriceChange}</p>
              <p className={`text-xl font-extrabold ${parseFloat(avgChange)>0?"text-red-600":"text-green-700"}`}>{parseFloat(avgChange)>0?"+":""}{avgChange}%</p>
              <p className="text-xs text-muted-foreground mt-1">{t.dashboard.comparedToYesterday}</p>
            </div>
            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <p className="text-xs text-muted-foreground mb-1">{t.dashboard.risingPrices}</p>
              <p className="text-xl font-extrabold text-foreground">{risingCount} <span className="text-sm text-muted-foreground font-normal">{t.dashboard.commodities}</span></p>
              <div className="flex items-center gap-1 mt-1"><TrendingUp size={12} className="text-red-500"/><span className="text-xs text-red-600 font-semibold">{t.dashboard.buyWithCaution}</span></div>
            </div>
          </div>

          <SL>{t.dashboard.currentBaselineSummary}</SL>
          <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
            <div className="grid grid-cols-[1fr_52px_64px_56px] bg-muted px-3 py-2 border-b border-border">
              {[t.dashboard.commodity, t.dashboard.price, t.dashboard.trend, t.dashboard.status].map((h)=>(
                <p key={h} className={`text-[10px] font-bold uppercase tracking-wide text-muted-foreground ${h!==t.dashboard.commodity?"text-right":""}`}>{h}</p>
              ))}
            </div>
            {dynamicCommodities.map((c: any,i: number)=>(
              <button key={c.id} onClick={() => router.push(`/commodity/${c.id}`)}
                className={`w-full grid grid-cols-[1fr_52px_64px_56px] items-center px-3 py-3 border-b border-border last:border-0 active:bg-muted transition-colors text-left ${i%2===0?"":"bg-card/40"}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <CommodityImage commodity={c} size="sm"/>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{c.shortLabel}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{c.primarySource}</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-foreground text-right">₱{c.baseline}</p>
                <div className="flex justify-end">
                  {c.trend==="up"     && <span className="text-[10px] font-bold text-red-600   flex items-center gap-0.5"><TrendingUp size={10}/>+{c.change}%</span>}
                  {c.trend==="down"   && <span className="text-[10px] font-bold text-green-700 flex items-center gap-0.5"><TrendingDown size={10}/>{c.change}%</span>}
                  {c.trend==="stable" && <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-0.5"><Minus size={10}/>±{Math.abs(c.change)}%</span>}
                </div>
                <div className="flex justify-end"><KalagayanChip volatility={c.volatility}/></div>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1"><Info size={10}/>{t.dashboard.tapForInfo}</p>
        </section>

        {/* DIAGNOSTIC */}
        <section className="dashboard-section dashboard-variance mt-8">
          <SL>{t.dashboard.priceVariance}</SL>
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm mb-4">
            <div className="px-4 pt-4 pb-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary"/><span className="text-[10px] text-muted-foreground font-semibold">{t.dashboard.current}</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-[#c8a97a]"/><span className="text-[10px] text-muted-foreground font-semibold">{t.dashboard.avg30Day}</span></div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={VARIANCE_DATA} barCategoryGap="28%" barGap={3}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(114,121,110,0.15)" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} width={45} tickFormatter={(v: any)=>`₱${new Intl.NumberFormat('en-US').format(v)}`} domain={[0,"auto"]}/>
                  <Tooltip content={<VarTip/>}/>
                  <Bar dataKey="30-Araw na Karaniwan" fill="#c8a97a" radius={[4,4,0,0]}/>
                  <Bar dataKey="Kasalukuyan" radius={[4,4,0,0]}>
                    {VARIANCE_DATA.map((d: any,i: number)=><Cell key={i} fill={d.variancePct>10?"#c62828":d.variancePct<-10?"#2d5a27":"#154212"}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5">
            {VARIANCE_DATA.filter((d: any)=>Math.abs(d.variancePct)>10).map((d: any)=>{
              const hi = d.variancePct > 0;
              return (
                <div key={d.name} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${hi?"bg-red-50 border-red-200":"bg-green-50 border-green-200"}`}>
                  <div>
                    <p className="text-xs font-bold text-foreground">{d.name}</p>
                    <p className={`text-[10px] font-semibold ${hi?"text-red-600":"text-green-700"}`}>
                      {hi?t.dashboard.higherThan30.replace('{{amt}}', (d["Kasalukuyan"]-d["30-Araw na Karaniwan"]).toFixed(1)) : t.dashboard.lowerThan30.replace('{{amt}}', (d["30-Araw na Karaniwan"]-d["Kasalukuyan"]).toFixed(1))}
                    </p>
                  </div>
                  <span className={`text-base font-extrabold ${hi?"text-red-600":"text-green-700"}`}>{hi?"+":""}{d.variancePct}%</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* PREDICTIVE */}
        <section className="dashboard-section dashboard-forecast mt-8">
          <div className="flex items-center justify-between">
            <SL>{t.dashboard.pricePrediction}</SL>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <button onClick={() => setTimeframe("7")} className={`text-[10px] font-bold px-2 py-1 rounded ${timeframe==="7"?"bg-white shadow-sm":"text-muted-foreground"}`}>7 Araw</button>
              <button onClick={() => setTimeframe("30")} className={`text-[10px] font-bold px-2 py-1 rounded ${timeframe==="30"?"bg-white shadow-sm":"text-muted-foreground"}`}>30 Araw</button>
            </div>
          </div>
          
          <div className="flex gap-1.5 mb-3 mt-2 overflow-x-auto pb-1 scrollbar-hide">
            {dynamicCommodities.map((c: any)=>(
              <button key={c.id} onClick={()=>setPredCId(c.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-colors shrink-0 ${
                  predC?.id===c.id?"bg-primary text-white border-primary":"bg-card border-border text-foreground"
                }`}><CommodityImage commodity={c} size="sm" className="!w-6 !h-6 !rounded-md"/>{c.shortLabel}</button>
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
                    <ReferenceLine x="Jul 10" stroke="rgba(114,121,110,0.4)" strokeDasharray="4 4" label={{value:"Ngayon",position:"top",fontSize:9,fill:"#72796e"}}/>
                    <Line type="monotone" dataKey="aktwal" name="Aktwal na Presyo" stroke="#154212" strokeWidth={2.5} dot={{fill:"#154212",r:3}} connectNulls={false}/>
                    <Line type="monotone" dataKey="hula"   name="Hinulaang Presyo" stroke="#f59e0b" strokeWidth={2}   strokeDasharray="5 4" dot={{fill:"#f59e0b",r:3}} connectNulls={false}/>
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
          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{t.dashboard.lastUpdate}:</span> {new Date().toLocaleDateString()} · DA Bulletin</p>
        </div>
      </div>
    </div>
  );
}
