"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Navigation } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader, SL, TrendBadge, KalagayanChip } from "@/components/ui";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "@/components/Charts";
import { useTranslation } from "@/context/LanguageContext";


export default function CommodityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { t, lang } = useTranslation();
  const { data: dynamicCommodities = [], isLoading } = useQuery({
    queryKey: ['commodities'],
    queryFn: async () => {
      const res = await fetch('/api/commodities');
      return await res.json();
    }
  });

  const commodity = dynamicCommodities.find((c: any) => c.id === id) || dynamicCommodities[0];

  const [range, setRange] = useState<"7"|"30">("7");

  // Fetch true historical trend data
  const { data: trendData = [], isLoading: isTrendLoading } = useQuery({
    queryKey: ['trend', commodity?.id, range],
    queryFn: async () => {
      if (!commodity?.id) return [];
      const res = await fetch(`/api/analytics/trend?commodityId=${commodity.id}&days=${range}`);
      return await res.json();
    },
    enabled: !!commodity?.id
  });

  if (isLoading || !commodity) return <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>;

  return (
    <div>
      <PageHeader title={lang === 'tl' ? commodity.tagalog : commodity.name} subtitle={commodity.name} onBack={() => router.back()}/>
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="bg-primary rounded-2xl px-5 py-5 text-white">
          <p className="text-xs text-white/60 uppercase tracking-widest font-semibold mb-1">{t.commodity.currentBaseline}</p>
          <p className="text-4xl font-extrabold">₱{commodity.baseline}<span className="text-xl font-medium text-white/60">/kg</span></p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <TrendBadge trend={commodity.trend} change={commodity.change} changeAbs={commodity.changeAbs}/>
            <KalagayanChip volatility={commodity.volatility}/>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{t.commodity.priceMovement}</p>
            <div className="flex bg-muted rounded-full overflow-hidden">
              {(["7","30"] as const).map((r)=>(
                <button key={r} onClick={()=>setRange(r)} className={`px-3 py-1 text-xs font-semibold transition-colors ${range===r?"bg-primary text-white":"text-muted-foreground"}`}>
                  {r==="7"?t.commodity.days7:t.commodity.days30}
                </button>
              ))}
            </div>
          </div>
          <div className="px-2 pt-2 pb-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(114,121,110,0.15)"/>
                <XAxis dataKey="araw" tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} width={45} tickFormatter={(v: any)=>`₱${new Intl.NumberFormat('en-US').format(v)}`} domain={["auto","auto"]}/>
                <Tooltip contentStyle={{background:"#fcf9f8",border:"1px solid rgba(114,121,110,0.22)",borderRadius:8,fontSize:12}} formatter={(v:number)=>[`₱${v}/kg`,t.commodity.price]} labelFormatter={(label) => `${label}`}/>
                <Line type="monotone" dataKey="aktwal" name={t.commodity.price} stroke="#154212" strokeWidth={2.5} dot={{fill:"#154212",r:3}} connectNulls={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <SL>{t.commodity.marketPrices}</SL>
          <div className="space-y-2">
            {commodity.sources.map((src: any, i: number)=>(
              <div key={src.name} className={`flex items-center justify-between bg-card rounded-xl px-4 py-3 border ${i===0?"border-green-200 bg-green-50":"border-border"}`}>
                <div className="flex items-center gap-2">
                  {i===0 && <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{t.commodity.cheapest}</span>}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{src.name}</p>
                  </div>
                </div>
                <p className={`text-lg font-extrabold ${i===0?"text-green-700":"text-foreground"}`}>₱{src.price}</p>
              </div>
            ))}
          </div>
        </div>
        <button onClick={() => router.push(`/advisor?id=${commodity.id}`)} className="w-full bg-primary text-white font-bold text-sm py-4 rounded-full active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <Navigation size={16}/>{t.commodity.viewAdvisor}
        </button>
      </div>
    </div>
  );
}
