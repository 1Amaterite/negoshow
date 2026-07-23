"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, ArrowRight } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function QuoteCheckerWalkthrough() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const hasSeen = localStorage.getItem("negoshow_tutorial_seen");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const closeTutorial = () => {
    setIsOpen(false);
    localStorage.setItem("negoshow_tutorial_seen", "true");
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else closeTutorial();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-border">
        <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
          <h3 className="font-bold">{t.tutorial.welcome}</h3>
          <button onClick={closeTutorial} className="text-primary-foreground/80 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? "w-6 bg-primary" : "w-1.5 bg-muted"}`} />
              ))}
            </div>
          </div>
          
          <div className="text-center min-h-[100px]">
            {step === 1 && (
              <>
                <h4 className="text-lg font-bold text-foreground mb-2">{t.tutorial.step1Title}</h4>
                <p className="text-sm text-muted-foreground">{t.tutorial.step1Desc}</p>
              </>
            )}
            {step === 2 && (
              <>
                <h4 className="text-lg font-bold text-foreground mb-2">{t.tutorial.step2Title}</h4>
                <p className="text-sm text-muted-foreground">{t.tutorial.step2Desc}</p>
              </>
            )}
            {step === 3 && (
              <>
                <div className="flex justify-center mb-3 text-green-600"><CheckCircle size={40} /></div>
                <h4 className="text-lg font-bold text-foreground mb-2">{t.tutorial.step3Title}</h4>
                <p className="text-sm text-muted-foreground">{t.tutorial.step3Desc}</p>
              </>
            )}
          </div>
          
          <button 
            onClick={nextStep}
            className="w-full mt-6 bg-primary text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            {step === 3 ? t.tutorial.finish : t.tutorial.next}
            {step !== 3 && <ArrowRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
