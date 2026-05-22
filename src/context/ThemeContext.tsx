"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Determine the active theme based on route
  const isLightForcedRoute = pathname === "/login" || pathname?.startsWith("/portal");
  const activeTheme = isLightForcedRoute ? "light" : theme;

  useEffect(() => {
    // 1. Check local storage
    const savedTheme = localStorage.getItem("app-theme") as Theme;
    
    // 2. Set theme if saved, otherwise default to "light" (handled by initial state)
    if (savedTheme) {
      setThemeState(savedTheme);
    }
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Save to local storage only if it's the actual state theme
    localStorage.setItem("app-theme", theme);
    
    // Update data-theme attribute on <html> element for CSS variables based on activeTheme
    document.documentElement.setAttribute("data-theme", activeTheme);
    
    // Change body background color to prevent flash
    document.body.style.backgroundColor = activeTheme === "dark" ? "#000000" : "#ffffff";
  }, [theme, activeTheme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
