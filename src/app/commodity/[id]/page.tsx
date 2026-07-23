"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Navigation } from "lucide-react";
import { COMMODITIES } from "@/lib/data";
import { PageHeader, SL, TrendBadge, KalagayanChip } from "@/components/ui";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "@/components/Charts";
import { useTranslation } from "@/context/LanguageContext";

function gen7Day(base: number, trend: "up"|"down"|"stable") {
  const d = [];
  let curr = trend==="up" ? base*0.8 : trend==="down" ? base*1.2 : base;
  for(let i=0; i<7; i++) {
    d.push({ day: `Jul ${4+i}`, presyo: Math.round(curr) });
    if(trend==="up") curr += base*0.04;
    else if(trend==="down") curr -= base*0.04;
    else curr += (Math.random()-0.5)*5;
  }
  return d;
}

export default function CommodityPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { t, lang } = useTranslation();
  const commodity = COMMODITIES.find((c) => c.id === id) || COMMODITIES[0];
  
  const [range, setRange] = useState<"7d"|"30d">("7d");

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
              {(["7d","30d"] as const).map((r)=>(
                <button key={r} onClick={()=>setRange(r)} className={`px-3 py-1 text-xs font-semibold transition-colors ${range===r?"bg-primary text-white":"text-muted-foreground"}`}>
                  {r==="7d"?t.commodity.days7:t.commodity.days30}
                </button>
              ))}
            </div>
          </div>
          <div className="px-2 pt-2 pb-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={gen7Day(commodity.baseline,commodity.trend)}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(114,121,110,0.15)"/>
                <XAxis dataKey="day" tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:10,fill:"#72796e"}} axisLine={false} tickLine={false} width={36} tickFormatter={(v: any)=>`₱${v}`} domain={["auto","auto"]}/>
                <Tooltip contentStyle={{background:"#fcf9f8",border:"1px solid rgba(114,121,110,0.22)",borderRadius:8,fontSize:12}} formatter={(v:number)=>[`₱${v}/kg`,t.commodity.price]}/>
                <Line type="monotone" dataKey="presyo" stroke="#154212" strokeWidth={2.5} dot={{fill:"#154212",r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <SL>{t.commodity.marketPrices}</SL>
          <div className="space-y-2">
            {commodity.sources.map((src,i)=>(
              <div key={src.name} className={`flex items-center justify-between bg-card rounded-xl px-4 py-3 border ${i===0?"border-green-200 bg-green-50":"border-border"}`}>
                <div className="flex items-center gap-2">
                  {i===0 && <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">{t.commodity.cheapest}</span>}
                  <div>
                    <p className="text-sm font-semibold text-foreground">{src.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Navigation size={10}/>{src.distance}</p>
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
