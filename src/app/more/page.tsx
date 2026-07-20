"use client";

import { useRouter } from "next/navigation";
import { Shield, Database, Lock, BookOpen, ChevronRight } from "lucide-react";
import { useGlobal } from "@/lib/GlobalContext";

export default function MorePage() {
  const router = useRouter();
  const { isAdmin } = useGlobal();

  return (
    <div>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <h1 className="text-base font-bold text-foreground">Dagdag</h1>
      </div>
      <div className="px-4 pt-5 pb-6 space-y-2">
        <button onClick={() => router.push("/transparency")}
          className="w-full flex items-center gap-3 bg-card rounded-xl px-4 py-3.5 border border-border active:bg-muted transition-colors text-left">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><Shield size={16} className="text-primary"/></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Source Transparency</p>
            <p className="text-xs text-muted-foreground">Mga DA/LGU bulletin na pinagkukunan</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground"/>
        </button>

        <button onClick={() => router.push(isAdmin ? "/admin" : "/admin/login")}
          className="w-full flex items-center gap-3 bg-card rounded-xl px-4 py-3.5 border border-border active:bg-muted transition-colors text-left">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isAdmin?"bg-green-100 border border-green-200":"bg-amber-50 border border-amber-200"}`}>
            {isAdmin?<Database size={16} className="text-green-700"/>:<Lock size={16} className="text-amber-700"/>}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">Dashboard ng Admin</p>
              {isAdmin && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Logged in</span>}
            </div>
            <p className="text-xs text-muted-foreground">{isAdmin?"Upload documents & validate records":"Restricted — login required"}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground"/>
        </button>

        <button className="w-full flex items-center gap-3 bg-card rounded-xl px-4 py-3.5 border border-border transition-colors text-left opacity-50 pointer-events-none">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><BookOpen size={16} className="text-primary"/></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Tungkol sa NegoShow</p>
            <p className="text-xs text-muted-foreground">Layunin, team, at source ng datos</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground"/>
        </button>

        <div className="pt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/images/negoshow-logo.svg" alt="NegoShow" className="h-9 w-auto" />
          </div>
          <p className="text-xs text-muted-foreground">Talipapa Utility v1.0 MVP</p>
          <p className="text-xs text-muted-foreground mt-0.5">ITISDEV Group 6 · Pasay City, 2026</p>
        </div>
      </div>
    </div>
  );
}
