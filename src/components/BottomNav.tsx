"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, TrendingUp, Navigation, MoreHorizontal } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export function BottomNav() {
  const pathname = usePathname();

  const { t } = useTranslation();

  const tabs = [
    { id: "home", label: t.nav.home, icon: Home, href: "/" },
    { id: "checker", label: t.nav.checker, icon: Search, href: "/checker" },
    { id: "trends", label: t.nav.trends, icon: TrendingUp, href: "/dashboard" },
    { id: "procurement", label: t.nav.procurement, icon: Navigation, href: "/procurement" },
    { id: "more", label: t.nav.more, icon: MoreHorizontal, href: "/more" },
  ];

  if (pathname?.startsWith("/admin")) return null;

  return (
    <div className="fixed md:hidden bottom-0 left-0 w-full bg-background/95 backdrop-blur-md border-t border-border z-50">
      <div className="flex items-center justify-around px-2 pb-safe">
        {tabs.map(({ id, label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={id}
              href={href}
              className="flex flex-col items-center gap-0.5 py-3 px-4 min-w-0 flex-1 active:scale-90 transition-transform"
            >
              <div
                className={`w-10 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  active ? "bg-primary" : ""
                }`}
              >
                <Icon size={18} className={active ? "text-white" : "text-muted-foreground"} />
              </div>
              <span
                className={`text-[10px] font-semibold leading-tight ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
