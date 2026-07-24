"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Check, Clock, Info } from "lucide-react";
import { PageHeader, CommodityImage } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer,
  Tooltip, CartesianGrid, ReferenceLine
} from "@/components/Charts";

export default function TransparencyPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const [predCId, setPredCId] = useState<string | null>(null);

  // Fetch Bulletins
  const { data: bulletins = [], isLoading: isBulletinsLoading } = useQuery({
    queryKey: ['bulletins'],
    queryFn: async () => {
      const res = await fetch('/api/bulletins');
      return await res.json();
    }
  });

  // Fetch Commodities for Chart
  const { data: dynamicCommodities = [], isLoading: isCommsLoading } = useQuery({
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
    <div>
      <PageHeader title={t.transparency.title} subtitle={t.transparency.subtitle} onBack={() => router.push("/")} />
      <div className="px-4 pt-4 pb-6 space-y-6">
        
        {/* Info Box */}
        <div className="bg-card rounded-xl border border-border px-4 py-3 flex items-start gap-3">
          <Shield size={16} className="text-primary mt-0.5 shrink-0"/>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.transparency.infoText}
          </p>
        </div>

        {/* Historical Price Trend Chart */}
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-foreground mb-1">Historical Price Baselines</h2>
            <p className="text-xs text-muted-foreground">Monitor the actual baseline prices extracted from bulletins over the last 30 days.</p>
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
            <div className="px-2 pt-4 pb-3">
              {isTrendLoading || isCommsLoading ? (
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
        </section>

        {/* Bulletins List */}
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-bold text-foreground mb-1">Recent DA/LGU Bulletins</h2>
            <p className="text-xs text-muted-foreground">Source documents parsed by the AI to form the baselines.</p>
          </div>
          
          <div className="space-y-2">
            {isBulletinsLoading ? (
              <div className="text-center py-4 text-xs text-muted-foreground">Loading bulletins...</div>
            ) : bulletins.length === 0 ? (
              <div className="text-center py-4 text-xs text-muted-foreground">No bulletins uploaded yet.</div>
            ) : (
              bulletins.map((b: any)=>(
                <div key={b.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="flex items-start gap-3 px-4 py-4">
                    <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold ${b.type==="PDF"?"bg-red-600":"bg-blue-600"}`}>{b.type}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold text-foreground">{b.source}</p>
                        {b.verified
                          ? <span className="flex items-center gap-0.5 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold"><Check size={10}/>{t.transparency.verified}</span>
                          : <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">{t.transparency.waiting}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5"><Clock size={10}/>{b.date} · {b.location}</p>
                      <div className="flex flex-wrap gap-1">
                        {b.commodities.map((c: string)=><span key={c} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{c}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
