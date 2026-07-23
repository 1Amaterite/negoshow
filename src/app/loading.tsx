"use client";

import { useTranslation } from "@/context/LanguageContext";

export default function Loading() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-semibold text-muted-foreground animate-pulse">
        {t.loading.message}
      </p>
    </div>
  );
}
