"use client";

import { useTranslation } from "@/context/LanguageContext";

export function LanguageToggle() {
  const { lang, setLanguage } = useTranslation();

  return (
    <button
      onClick={() => setLanguage(lang === "en" ? "tl" : "en")}
      className="px-3 py-1.5 text-xs font-bold rounded-full bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors"
      title="Toggle Language"
    >
      {lang === "en" ? "FIL" : "EN"}
    </button>
  );
}
