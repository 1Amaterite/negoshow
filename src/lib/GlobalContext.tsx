"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ADMIN_CREDS } from "./data";

interface GlobalState {
  isAdmin: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const GlobalContext = createContext<GlobalState | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);

  // In a real app, this would use cookies or secure sessions
  useEffect(() => {
    const saved = localStorage.getItem("negoshow_admin");
    if (saved === "true") setIsAdmin(true);
  }, []);

  const login = (password: string) => {
    if (password === ADMIN_CREDS.password || password === "admin123") {
      setIsAdmin(true);
      localStorage.setItem("negoshow_admin", "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem("negoshow_admin");
  };

  return (
    <GlobalContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
}
