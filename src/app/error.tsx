"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <div className="bg-red-50 p-4 rounded-full mb-4">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-xl font-extrabold text-foreground mb-2">{t.error.title}</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {t.error.message}
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
      >
        <RefreshCw size={16} />
        {t.error.retry}
      </button>
    </div>
  );
}
