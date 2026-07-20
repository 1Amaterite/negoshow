import React from "react";
import { CommodityImage } from "./ui";
import { Commodity } from "@/lib/types";

interface CommodityCardProps {
  commodity: Commodity;
  label: string;
  changeText: string;
  changeColor: string;
}

export function CommodityCard({ commodity, label, changeText, changeColor }: CommodityCardProps) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <CommodityImage commodity={commodity} size="sm" />
        <p className="text-lg font-bold text-foreground">{commodity.tagalog}</p>
      </div>
      <p className={`text-xs ${changeColor} font-semibold mt-0.5`}>{changeText}</p>
    </div>
  );
}
