"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Clock, ChevronRight } from "lucide-react";
import { COMMODITIES, VENDOR_TIPS } from "@/lib/data";
import { CommodityImage } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";

export default function ProcurementPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
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
          <p className="procurement-eyebrow">{t.procurement.eyebrow}</p>
          <h1>{t.procurement.title}</h1>
          <p>{t.procurement.subtitle}</p>
        </div>
        <div className="procurement-date"><Clock size={15}/> {t.procurement.lastUpdate}: Hulyo 10, 2026 · 9:00 AM</div>
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
            <div><span>{t.procurement.kpis.volatile}</span><strong>{COMMODITIES.filter(c=>c.volatility==="High").length}</strong><small>{t.procurement.kpis.volatileDesc}</small></div>
          </div>

          <div className="procurement-grid">
            <section className="procurement-panel procurement-main-panel">
              <div className="panel-heading"><div><h2>{t.procurement.todayPlan.title}</h2><p>{t.procurement.todayPlan.subtitle}</p></div></div>
              <div className="recommendation-list">
                {COMMODITIES.map(c=>{
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
              <div className="panel-heading"><div><h2>{t.procurement.vendorTips.title}</h2><p>{t.procurement.vendorTips.subtitle}</p></div></div>
              <div className="procurement-tips">{VENDOR_TIPS.map((tip,i)=><div key={i}><span>{tip.icon}</span><div><strong>{lang === 'tl' ? tip.title : tip.titleEn}</strong><p>{lang === 'tl' ? tip.body : tip.bodyEn}</p></div></div>)}</div>
            </aside>
          </div>
        </>}

        {tab==="prices" && <section className="procurement-panel">
          <div className="panel-heading"><div><h2>{t.procurement.priceComparison.title}</h2><p>{t.procurement.priceComparison.subtitle}</p></div></div>
          <div className="price-table-wrap"><table className="price-table"><thead><tr><th>{t.procurement.priceComparison.commodity}</th><th>{t.procurement.priceComparison.currentBaseline}</th><th>{t.procurement.priceComparison.lowestOffer}</th><th>{t.procurement.priceComparison.avg30Day}</th><th>{t.procurement.priceComparison.difference}</th><th>{t.procurement.priceComparison.market}</th></tr></thead><tbody>
            {COMMODITIES.map(c=><tr key={c.id}><td><CommodityImage commodity={c} size="sm"/><strong>{lang === 'tl' ? c.tagalog : c.name}</strong></td><td>₱{c.baseline}/kg</td><td className="price-good">₱{c.sources[0].price}/kg</td><td>₱{c.baseline30d}/kg</td><td className={c.sources[0].price<c.baseline?"price-good":""}>{t.procurement.priceComparison.lower.replace('{{amt}}', Math.abs(c.baseline-c.sources[0].price).toString())}</td><td>{c.sources[0].name}<small>{c.sources[0].distance}</small></td></tr>)}
          </tbody></table></div>
        </section>}

        {tab==="recommendations" && <div className="recommendation-cards">
          {COMMODITIES.map(c=>{ const rising=c.trend==="up"; return <article key={c.id} className="procurement-panel recommendation-card">
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
