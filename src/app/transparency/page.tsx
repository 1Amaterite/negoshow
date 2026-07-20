"use client";

import { useRouter } from "next/navigation";
import { Shield, Check, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui";

// Mock data (in the original app it was likely in data.ts or a state, but for now we'll inline or fetch)
const INITIAL_BULLETINS = [
  { id: "b1", type: "PDF", source: "DA Bantay Presyo (NCR)", date: "Jul 10, 2026", location: "Metro Manila", commodities: ["Sibuyas Pula", "Bawang", "Luya"], verified: true },
  { id: "b2", type: "IMG", source: "QC Public Market Update", date: "Jul 9, 2026", location: "Quezon City", commodities: ["Kamatis", "Siling Labuyo"], verified: true },
  { id: "b3", type: "XLS", source: "LGU Price Monitoring", date: "Jul 9, 2026", location: "Makati City", commodities: ["Lahat ng Gulay"], verified: false },
];

export default function TransparencyPage() {
  const router = useRouter();

  return (
    <div>
      <PageHeader title="Source Transparency" subtitle="Mga opisyal na bulletin na pinagkukunan" onBack={() => router.push("/")} />
      <div className="px-4 pt-4 pb-6 space-y-4">
        <div className="bg-card rounded-xl border border-border px-4 py-3 flex items-start gap-3">
          <Shield size={16} className="text-primary mt-0.5 shrink-0"/>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lahat ng baseline presyo ay nagmumula sa mga opisyal na DA at LGU price bulletin na na-upload ng admin team at nire-review bago i-publish.
          </p>
        </div>
        <div className="space-y-2">
          {INITIAL_BULLETINS.map((b)=>(
            <div key={b.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-4">
                <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold ${b.type==="PDF"?"bg-red-600":"bg-blue-600"}`}>{b.type}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-sm font-bold text-foreground">{b.source}</p>
                    {b.verified
                      ? <span className="flex items-center gap-0.5 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-semibold"><Check size={10}/>Beripikado</span>
                      : <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">Naghihintay</span>}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1.5"><Clock size={10}/>{b.date} · {b.location}</p>
                  <div className="flex flex-wrap gap-1">
                    {b.commodities.map((c)=><span key={c} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{c}</span>)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
