"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, ShoppingCart, MapPin, Handshake, Clock, CheckCircle, Eye, Lightbulb, AlertTriangle, HelpCircle } from "lucide-react";
import { Commodity } from "@/lib/types";

import { useTranslation } from "@/context/LanguageContext";

export function DynamicIcon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  switch (name) {
    case "ShoppingCart": return <ShoppingCart size={size} className={className} />;
    case "MapPin": return <MapPin size={size} className={className} />;
    case "Handshake": return <Handshake size={size} className={className} />;
    case "Clock": return <Clock size={size} className={className} />;
    case "CheckCircle": return <CheckCircle size={size} className={className} />;
    case "Eye": return <Eye size={size} className={className} />;
    case "Lightbulb": return <Lightbulb size={size} className={className} />;
    case "AlertTriangle": return <AlertTriangle size={size} className={className} />;
    default: return <HelpCircle size={size} className={className} />;
  }
}

export function KalagayanChip({ volatility }: { volatility: string }) {
  const { t } = useTranslation();
  
  const s: Record<string, string> = {
    High: "bg-red-100 text-red-700 border border-red-200",
    Medium: "bg-amber-100 text-amber-700 border border-amber-200",
    Low: "bg-green-100 text-green-700 border border-green-200",
    // Fallbacks just in case
    Mataas: "bg-red-100 text-red-700 border border-red-200",
    Katamtaman: "bg-amber-100 text-amber-700 border border-amber-200",
    Mababa: "bg-green-100 text-green-700 border border-green-200",
  };
  
  // Resolve localized label based on the underlying value
  let label = volatility;
  if (volatility === "High" || volatility === "Mataas") label = t.ui.high;
  else if (volatility === "Medium" || volatility === "Katamtaman") label = t.ui.medium;
  else if (volatility === "Low" || volatility === "Mababa") label = t.ui.low;

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s[volatility] || s.Low}`}>
      {label}
    </span>
  );
}

export function TrendBadge({ trend, change, changeAbs }: { trend: string; change: number; changeAbs: number }) {
  if (trend === "up")
    return (
      <span className="flex items-center gap-0.5 text-sm font-semibold text-red-600">
        <TrendingUp size={14} /> +₱{changeAbs} ({change}%)
      </span>
    );
  if (trend === "down")
    return (
      <span className="flex items-center gap-0.5 text-sm font-semibold text-green-700">
        <TrendingDown size={14} /> -₱{Math.abs(changeAbs)} ({Math.abs(change)}%)
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-sm font-semibold text-[#72796e]">
      <Minus size={14} /> ±₱{Math.abs(changeAbs)} ({Math.abs(change)}%)
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  
  const handleBack = onBack || (() => router.back());

  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 md:px-8 py-3 md:py-4">
      <div className="flex items-center gap-3">
        {handleBack && (
          <button
            type="button"
            aria-label={t.ui.back}
            onClick={handleBack}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform shrink-0"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg md:text-xl font-extrabold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
    </div>
  );
}

export function SL({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 ${className}`}>{children}</h3>;
}

export function CommodityImage({
  commodity,
  size = "md",
  className = "",
}: {
  commodity: Commodity;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { lang } = useTranslation();
  const sizes = { sm: "w-8 h-8", md: "w-11 h-11", lg: "w-14 h-14" };
  return (
    <img
      src={commodity.image}
      alt={lang === 'tl' ? commodity.tagalog : commodity.name}
      loading="lazy"
      className={`${sizes[size]} rounded-xl object-contain p-1 border border-border/70 bg-[#faf8f3] shrink-0 ${className}`}
    />
  );
}

export function TierBadge({ tier, icon: Icon, color }: { tier: string; icon: React.ElementType; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border w-fit mb-3 ${color}`}>
      <Icon size={11} />
      <span className="text-[10px] font-bold uppercase tracking-widest">{tier}</span>
    </div>
  );
}
