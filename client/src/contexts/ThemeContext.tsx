import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "amoled";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  setTheme?: (theme: Theme) => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setInternalTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;

    // Apply classes for theme variants.
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("amoled");
    } else if (theme === "amoled") {
      // AMOLED is a dark-derived theme, so ensure dark is set as well for base tokens.
      root.classList.add("dark");
      root.classList.add("amoled");
    } else {
      root.classList.remove("dark");
      root.classList.remove("amoled");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setInternalTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  const setTheme = switchable
    ? (t: Theme) => {
        setInternalTheme(t);
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
