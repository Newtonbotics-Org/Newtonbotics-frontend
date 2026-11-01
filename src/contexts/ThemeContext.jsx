"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "nb_theme";

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function applyThemeClass(theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("theme-light", theme === "light");
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // The site is dark-only now; an old saved "light" preference would paint pages light grey
    const next = "dark";
    setThemeState(next);
    applyThemeClass(next);
    setReady(true);
  }, []);

  const setTheme = useCallback((next) => {
    const value = next === "light" ? "light" : "dark";
    setThemeState(value);
    applyThemeClass(value);
    localStorage.setItem(STORAGE_KEY, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [setTheme, theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}
