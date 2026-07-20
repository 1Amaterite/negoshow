"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Clock, ChevronRight } from "lucide-react";
import { COMMODITIES, VENDOR_TIPS } from "@/lib/data";
import { CommodityImage } from "@/components/ui";

export default function ProcurementPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"overview"|"prices"|"recommendations">("overview");
  
  const totalSavings = COMMODITIES.reduce((sum,c)=>sum + Math.max(0,c.baseline-c.sources[0].price)*10,0);
  const buyNow = COMMODITIES.filter(c=>c.trend!=="up").length;
  const markets = new Set(COMMODITIES.flatMap(c=>c.sources.map(s=>s.name))).size;

  const onOpenAdvisor = (c: any) => {
    router.push(`/advisor?id=${c.id}`);
  };

  return (
    <div className="procurement-page">
      <div className="procurement-hero">
        <div>
          <p className="procurement-eyebrow">Matalinong Pagpaplano sa Pagbili</p>
          <h1>Tagapayo sa Pagbili</h1>
          <p>Planuhin ang pagbili gamit ang kasalukuyang presyo sa merkado, malalapit na supplier, at malinaw na rekomendasyon.</p>
        </div>
        <div className="procurement-date"><Clock size={15}/> Huling update: Hulyo 10, 2026 · 9:00 AM</div>
      </div>

      <div className="procurement-tabs">
        {[{id:"overview",label:"Pangkalahatan"},{id:"prices",label:"Pagsubaybay sa Presyo"},{id:"recommendations",label:"Mga Rekomendasyon"}].map(item=>(
          <button key={item.id} onClick={()=>setTab(item.id as typeof tab)} className={tab===item.id?"active":""}>{item.label}</button>
        ))}
      </div>

      <div className="procurement-content">
        <div key={tab} className="tab-transition">
        {tab==="overview" && <>
          <div className="procurement-kpis">
            <div><span>Posibleng matipid</span><strong>₱{totalSavings.toLocaleString()}</strong><small>sa bawat 10 kg ng bawat kalakal</small></div>
            <div><span>Handa nang bilhin</span><strong>{buyNow}</strong><small>matatag o bumababang presyo</small></div>
            <div><span>Mga palengke na inihambing</span><strong>{markets}</strong><small>malalapit at beripikadong pinagmulan</small></div>
            <div><span>Mga lubhang pabago-bagong kalakal</span><strong>{COMMODITIES.filter(c=>c.volatility==="Mataas").length}</strong><small>kailangang masusing bantayan</small></div>
          </div>

          <div className="procurement-grid">
            <section className="procurement-panel procurement-main-panel">
              <div className="panel-heading"><div><h2>Plano sa Pagbili Ngayong Araw</h2><p>Mga pangunahing hakbang batay sa galaw ng presyo at paghahambing ng mga supplier.</p></div></div>
              <div className="recommendation-list">
                {COMMODITIES.map(c=>{
                  const rising=c.trend==="up";
                  const action=rising?"Makipagtawaran / Maghintay":"Bilhin na";
                  return <button key={c.id} onClick={()=>onOpenAdvisor(c)} className="recommendation-row">
                    <div className="commodity-cell"><CommodityImage commodity={c} size="sm"/><div><strong>{c.tagalog}</strong><small>{c.name}</small></div></div>
                    <div><small>Pinakamababang presyo</small><strong className="price-good">₱{c.sources[0].price}/kg</strong></div>
                    <div><small>Pinakamainam na pinagmulan</small><strong>{c.sources[0].name}</strong></div>
                    <div className={`action-pill ${rising?"wait":"buy"}`}>{action}</div>
                    <ChevronRight size={17}/>
                  </button>
                })}
              </div>
            </section>

            <aside className="procurement-panel tips-panel">
              <div className="panel-heading"><div><h2>Mga Payo para sa Vendor</h2><p>Mabilis na gabay para ngayong araw.</p></div></div>
              <div className="procurement-tips">{VENDOR_TIPS.map((tip,i)=><div key={i}><span>{tip.icon}</span><div><strong>{tip.title}</strong><p>{tip.body}</p></div></div>)}</div>
            </aside>
          </div>
        </>}

        {tab==="prices" && <section className="procurement-panel">
          <div className="panel-heading"><div><h2>Paghahambing ng Presyo sa Merkado</h2><p>Batayang presyo, pinakamababang alok, at 30-araw na karaniwan para sa bawat kalakal.</p></div></div>
          <div className="price-table-wrap"><table className="price-table"><thead><tr><th>Kalakal</th><th>Kasalukuyang batayan</th><th>Pinakamababang alok</th><th>30-araw na karaniwan</th><th>Pagkakaiba</th><th>Palengke</th></tr></thead><tbody>
            {COMMODITIES.map(c=><tr key={c.id}><td><CommodityImage commodity={c} size="sm"/><strong>{c.tagalog}</strong></td><td>₱{c.baseline}/kg</td><td className="price-good">₱{c.sources[0].price}/kg</td><td>₱{c.baseline30d}/kg</td><td className={c.sources[0].price<c.baseline?"price-good":""}>₱{Math.abs(c.baseline-c.sources[0].price)}/kg na mas mababa</td><td>{c.sources[0].name}<small>{c.sources[0].distance}</small></td></tr>)}
          </tbody></table></div>
        </section>}

        {tab==="recommendations" && <div className="recommendation-cards">
          {COMMODITIES.map(c=>{ const rising=c.trend==="up"; return <article key={c.id} className="procurement-panel recommendation-card">
            <div className="recommendation-card-top"><CommodityImage commodity={c} size="lg" className="commodity-photo"/><div><h2>{c.tagalog}</h2><p>{c.name}</p></div><div className={`action-pill ${rising?"wait":"buy"}`}>{rising?"Makipagtawaran / Maghintay":"Bilhin na"}</div></div>
            <p className="recommendation-reason">{rising?`Ang presyo ay ${c.change}% na mas mataas at maaaring patuloy pang tumaas. Ihambing ang mga alok at makipagtawaran bago bumili.`:`Ang galaw ng presyo ay ${c.trend==="down"?"bumababa":"matatag"}, kaya mainam bumili sa panahong ito.`}</p>
            <div className="recommendation-metrics"><div><small>Pinakamurang pinagmulan</small><strong>{c.sources[0].name}</strong></div><div><small>Pinakamababang presyo</small><strong className="price-good">₱{c.sources[0].price}/kg</strong></div><div><small>Posibleng matipid / 10 kg</small><strong>₱{Math.max(0,(c.baseline-c.sources[0].price)*10)}</strong></div></div>
            <button onClick={()=>onOpenAdvisor(c)}>Tingnan ang detalyadong payo <ChevronRight size={15}/></button>
          </article>})}
        </div>}
        </div>
      </div>
    </div>
  );
}
