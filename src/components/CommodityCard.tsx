import React from "react";
import { CommodityImage } from "./ui";
import { Commodity } from "@/lib/types";
import { useTranslation } from "@/context/LanguageContext";

interface CommodityCardProps {
  commodity: Commodity;
  label: string;
  changeText: string;
  changeColor: string;
}

export function CommodityCard({ commodity, label, changeText, changeColor }: CommodityCardProps) {
  const { lang, t } = useTranslation();
  return (
    <div className="bg-card rounded-xl p-3 border border-border">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <CommodityImage commodity={commodity} size="sm" />
        <p className="text-lg font-bold text-foreground">{lang === 'tl' ? (t.commodities as any)[commodity.name] || commodity.name : commodity.name}</p>
      </div>
      <p className={`text-xs ${changeColor} font-semibold mt-0.5 flex justify-between items-center`}>
        <span>{changeText}</span>
        {(commodity as any).isMock && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold">Mock Data</span>}
      </p>
    </div>
  );
}
