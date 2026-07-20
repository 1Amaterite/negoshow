"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { DesktopNav } from "./DesktopNav";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminFlow = pathname?.startsWith("/admin");

  return (
    <div className="app-root bg-background" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <div className="app-shell bg-background">
        {!isAdminFlow && <DesktopNav />}
        <main id="main-content" className={`app-main ${isAdminFlow ? "" : "pb-20 md:pb-0"}`}>
          <div className="page-transition min-h-full">{children}</div>
        </main>
        {!isAdminFlow && <BottomNav />}
      </div>
    </div>
  );
}
