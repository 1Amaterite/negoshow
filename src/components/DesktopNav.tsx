"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";

export function DesktopNav() {
  const pathname = usePathname();
  const { t } = useTranslation();
  
  const links = [
    { id: "home", label: t.nav.home, href: "/" },
    { id: "checker", label: t.nav.checker, href: "/checker" },
    { id: "trends", label: t.nav.trends, href: "/dashboard" },
    { id: "procurement", label: t.nav.procurement, href: "/procurement" },
    { id: "more", label: t.nav.more, href: "/more" },
  ];

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="w-full px-8 lg:px-12 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 text-left">
          <img src="/images/negoshow-logo.svg" alt="NegoShow Talipapa Utility" className="h-12 w-auto" />
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {links.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                pathname === link.href ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
