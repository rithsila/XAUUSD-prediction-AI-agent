/**
 * iOS 26 Glass Design Tokens (TypeScript)
 *
 * Mirrors the CSS variables defined in index.css and provides a typed object for
 * components or utilities that need programmatic access to tokens (e.g., inline styles,
 * dynamic styling, tests, or documentation generators).
 */

export type Mode = "light" | "dark";

function cssVar(name: string) {
  return `var(${name})` as const;
}

export interface IOS26ThemeTokens {
  mode: Mode;
  palette: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    sidebar: string;
    sidebarForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    chart: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
    };
  };
  glass: {
    bg: string; // translucent background
    border: string; // soft border color
    highlight: string; // subtle highlight overlay
    backdrop: string; // backdrop-filter value
    shadowMd: string; // default elevation
    shadowLg: string; // hover elevation
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  depth: {
    z: {
      header: number;
      sidebar: number;
      dialog: number;
      toast: number;
      popover: number;
    };
  };
  blur: {
    surface: string; // mirrors --glass-backdrop
  };
  motion: {
    durations: {
      fast: number; // ms
      normal: number;
      slow: number;
    };
    easings: {
      standard: string;
      emphasized: string;
    };
  };
  typography: {
    fontWeight: {
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    tracking: {
      tight: string;
      normal: string;
    };
  };
}

/**
 * Resolve current mode by checking the document root.
 */
export function getCurrentMode(): Mode {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/**
 * Read-only tokens mapped to CSS variables. Use in inline styles like:
 *   style={{ background: ios26Theme.glass.bg }}
 */
export const ios26Theme: IOS26ThemeTokens = {
  mode: getCurrentMode(),
  palette: {
    background: cssVar("--background"),
    foreground: cssVar("--foreground"),
    card: cssVar("--card"),
    cardForeground: cssVar("--card-foreground"),
    primary: cssVar("--primary"),
    primaryForeground: cssVar("--primary-foreground"),
    secondary: cssVar("--secondary"),
    secondaryForeground: cssVar("--secondary-foreground"),
    muted: cssVar("--muted"),
    mutedForeground: cssVar("--muted-foreground"),
    accent: cssVar("--accent"),
    accentForeground: cssVar("--accent-foreground"),
    destructive: cssVar("--destructive"),
    destructiveForeground: cssVar("--destructive-foreground"),
    border: cssVar("--border"),
    input: cssVar("--input"),
    ring: cssVar("--ring"),
    sidebar: cssVar("--sidebar"),
    sidebarForeground: cssVar("--sidebar-foreground"),
    sidebarAccent: cssVar("--sidebar-accent"),
    sidebarAccentForeground: cssVar("--sidebar-accent-foreground"),
    sidebarBorder: cssVar("--sidebar-border"),
    sidebarRing: cssVar("--sidebar-ring"),
    chart: {
      1: cssVar("--chart-1"),
      2: cssVar("--chart-2"),
      3: cssVar("--chart-3"),
      4: cssVar("--chart-4"),
      5: cssVar("--chart-5"),
    },
  },
  glass: {
    bg: cssVar("--glass-bg"),
    border: cssVar("--glass-border"),
    highlight: cssVar("--glass-highlight"),
    backdrop: cssVar("--glass-backdrop"),
    shadowMd: cssVar("--glass-shadow-md"),
    shadowLg: cssVar("--glass-shadow-lg"),
  },
  radii: {
    sm: cssVar("--radius-sm"),
    md: cssVar("--radius-md"),
    lg: cssVar("--radius-lg"),
    xl: cssVar("--radius-xl"),
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  depth: {
    z: {
      header: 50,
      sidebar: 40,
      dialog: 100,
      toast: 110,
      popover: 60,
    },
  },
  blur: {
    surface: cssVar("--glass-backdrop"),
  },
  motion: {
    durations: {
      fast: 150,
      normal: 250,
      slow: 550,
    },
    easings: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      // Slight overshoot for liquid feel
      emphasized: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    },
  },
  typography: {
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    tracking: {
      tight: "-0.01em",
      normal: "0",
    },
  },
};

/**
 * Utility to apply inline glass styles to any element via style prop.
 */
export function glassStyle(overrides?: Partial<CSSStyleDeclaration>): React.CSSProperties {
  return {
    background: ios26Theme.glass.bg,
    backdropFilter: ios26Theme.glass.backdrop,
    WebkitBackdropFilter: ios26Theme.glass.backdrop,
    border: `1px solid ${ios26Theme.glass.border}`,
    boxShadow: ios26Theme.glass.shadowMd,
    ...(overrides as React.CSSProperties),
  };
}