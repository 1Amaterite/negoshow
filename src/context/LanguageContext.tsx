"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { en, TranslationKeys } from "@/locales/en";
import { tl } from "@/locales/tl";

type Language = "en" | "tl";

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const dictionaries: Record<Language, TranslationKeys> = { en, tl };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en"); // Default primary: English
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("app_lang") as Language;
    if (saved === "en" || saved === "tl") {
      setLang(saved);
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  // Prevent hydration mismatch by returning a placeholder or not rendering translations until mounted,
  // but for SEO/first render, we can just return English and let it swap to Tagalog if that was saved.
  const currentLang = mounted ? lang : "en";

  return (
    <LanguageContext.Provider value={{ lang: currentLang, setLanguage, t: dictionaries[currentLang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useTranslation must be used within LanguageProvider");
  return context;
}
