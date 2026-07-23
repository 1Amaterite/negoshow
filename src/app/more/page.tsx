"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Settings, User, BookOpen, Shield, ChevronRight, LogOut, Database, Lock } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { useTranslation } from "@/context/LanguageContext";

export default function MorePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = !!session;
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title={t.more.title} />
      <div className="px-4 pt-5 pb-6 space-y-2">
        <button onClick={() => router.push("/transparency")}
          className="w-full flex items-center gap-3 bg-card rounded-xl px-4 py-3.5 border border-border active:bg-muted transition-colors text-left">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><Shield size={16} className="text-primary"/></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t.more.transparencyBtn}</p>
            <p className="text-xs text-muted-foreground">{t.more.transparencyDesc}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground"/>
        </button>

        <button 
          onClick={() => {
            if (isAdmin) router.push("/admin");
            else router.push("/admin/login");
          }}
          className="w-full flex items-center gap-3 bg-card rounded-xl px-4 py-3.5 border border-border transition-colors hover:border-primary/30 text-left active:scale-[0.98]"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isAdmin?"bg-green-100 border border-green-200":"bg-amber-50 border border-amber-200"}`}>
            {isAdmin?<Database size={16} className="text-green-700"/>:<Lock size={16} className="text-amber-700"/>}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-foreground">{t.more.adminBtn}</p>
              {isAdmin && <span className="text-[9px] uppercase tracking-wider font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>}
            </div>
            <p className="text-xs text-muted-foreground">{isAdmin ? t.more.adminDesc : t.more.adminRestricted}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground"/>
        </button>

        <button className="w-full flex items-center gap-3 bg-card rounded-xl px-4 py-3.5 border border-border transition-colors text-left opacity-50 pointer-events-none">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0"><BookOpen size={16} className="text-primary"/></div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">{t.more.aboutBtn}</p>
            <p className="text-xs text-muted-foreground">{t.more.aboutDesc}</p>
          </div>
          <ChevronRight size={14} className="text-muted-foreground"/>
        </button>

        <div className="pt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/images/negoshow-logo.svg" alt="NegoShow" className="h-9 w-auto" />
          </div>
          <p className="text-xs text-muted-foreground">{t.more.version}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t.more.footer}</p>
        </div>
      </div>
    </div>
  );
}
