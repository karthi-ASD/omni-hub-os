import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface ThemeConfig {
  id: string;
  name: string;
  primary: string;
  accent: string;
  neonPurple: string;
  neonBlue: string;
  neonGreen: string;
  neonOrange: string;
  neonPink: string;
  sidebarBg: string;
  sidebarFg: string;
  sidebarPrimary: string;
  sidebarAccent: string;
  sidebarBorder: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: "royal-blue",
    name: "Royal Blue Executive",
    primary: "224 76% 48%",
    accent: "199 89% 48%",
    neonPurple: "224 76% 55%",
    neonBlue: "199 89% 52%",
    neonGreen: "152 60% 42%",
    neonOrange: "24 95% 58%",
    neonPink: "330 80% 60%",
    sidebarBg: "222 30% 8%",
    sidebarFg: "220 14% 70%",
    sidebarPrimary: "224 76% 55%",
    sidebarAccent: "222 24% 14%",
    sidebarBorder: "222 24% 14%",
  },
  {
    id: "emerald",
    name: "Emerald Business",
    primary: "152 60% 42%",
    accent: "175 65% 40%",
    neonPurple: "175 65% 50%",
    neonBlue: "190 70% 45%",
    neonGreen: "152 72% 50%",
    neonOrange: "38 92% 50%",
    neonPink: "330 60% 55%",
    sidebarBg: "160 25% 7%",
    sidebarFg: "152 14% 65%",
    sidebarPrimary: "152 60% 48%",
    sidebarAccent: "160 20% 12%",
    sidebarBorder: "160 20% 13%",
  },
  {
    id: "sunset",
    name: "Sunset Orange",
    primary: "24 95% 53%",
    accent: "38 92% 50%",
    neonPurple: "350 75% 58%",
    neonBlue: "24 90% 55%",
    neonGreen: "38 92% 50%",
    neonOrange: "14 100% 57%",
    neonPink: "350 80% 60%",
    sidebarBg: "20 25% 7%",
    sidebarFg: "24 14% 65%",
    sidebarPrimary: "24 95% 55%",
    sidebarAccent: "20 20% 12%",
    sidebarBorder: "20 20% 13%",
  },
  {
    id: "purple-innovation",
    name: "Purple Innovation",
    primary: "252 85% 60%",
    accent: "280 65% 55%",
    neonPurple: "252 85% 65%",
    neonBlue: "280 70% 58%",
    neonGreen: "152 60% 42%",
    neonOrange: "24 95% 58%",
    neonPink: "310 80% 60%",
    sidebarBg: "250 25% 8%",
    sidebarFg: "252 14% 65%",
    sidebarPrimary: "252 85% 62%",
    sidebarAccent: "250 22% 13%",
    sidebarBorder: "250 22% 14%",
  },
  {
    id: "midnight",
    name: "Midnight Dark Mode",
    primary: "210 100% 56%",
    accent: "199 89% 48%",
    neonPurple: "240 70% 62%",
    neonBlue: "210 100% 60%",
    neonGreen: "152 72% 50%",
    neonOrange: "24 95% 58%",
    neonPink: "330 80% 60%",
    sidebarBg: "225 25% 5%",
    sidebarFg: "220 14% 60%",
    sidebarPrimary: "210 100% 58%",
    sidebarAccent: "225 20% 10%",
    sidebarBorder: "225 20% 11%",
  },
  {
    id: "platinum",
    name: "Platinum Corporate",
    primary: "220 14% 40%",
    accent: "220 20% 55%",
    neonPurple: "240 30% 55%",
    neonBlue: "210 40% 55%",
    neonGreen: "152 40% 45%",
    neonOrange: "24 60% 55%",
    neonPink: "330 40% 55%",
    sidebarBg: "220 16% 8%",
    sidebarFg: "220 10% 60%",
    sidebarPrimary: "220 20% 50%",
    sidebarAccent: "220 14% 12%",
    sidebarBorder: "220 14% 14%",
  },
  // 6 NEW THEMES
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    primary: "218 80% 46%",
    accent: "210 90% 52%",
    neonPurple: "230 70% 58%",
    neonBlue: "218 85% 55%",
    neonGreen: "160 55% 45%",
    neonOrange: "30 85% 55%",
    neonPink: "340 70% 58%",
    sidebarBg: "220 35% 6%",
    sidebarFg: "218 15% 65%",
    sidebarPrimary: "218 80% 52%",
    sidebarAccent: "220 28% 12%",
    sidebarBorder: "220 28% 13%",
  },
  {
    id: "cyber-purple",
    name: "Cyber Purple",
    primary: "270 75% 55%",
    accent: "290 70% 50%",
    neonPurple: "270 80% 62%",
    neonBlue: "260 75% 58%",
    neonGreen: "165 60% 45%",
    neonOrange: "35 90% 55%",
    neonPink: "315 85% 60%",
    sidebarBg: "268 30% 7%",
    sidebarFg: "270 12% 65%",
    sidebarPrimary: "270 75% 58%",
    sidebarAccent: "268 24% 13%",
    sidebarBorder: "268 24% 14%",
  },
  {
    id: "ocean-teal",
    name: "Ocean Teal",
    primary: "180 65% 40%",
    accent: "195 70% 45%",
    neonPurple: "200 55% 52%",
    neonBlue: "185 70% 48%",
    neonGreen: "170 65% 45%",
    neonOrange: "28 85% 55%",
    neonPink: "335 65% 55%",
    sidebarBg: "182 28% 7%",
    sidebarFg: "180 14% 62%",
    sidebarPrimary: "180 65% 46%",
    sidebarAccent: "182 22% 12%",
    sidebarBorder: "182 22% 13%",
  },
  {
    id: "dark-emerald",
    name: "Dark Emerald",
    primary: "145 70% 38%",
    accent: "158 60% 42%",
    neonPurple: "160 50% 50%",
    neonBlue: "175 60% 44%",
    neonGreen: "145 75% 48%",
    neonOrange: "32 88% 52%",
    neonPink: "345 65% 55%",
    sidebarBg: "148 30% 6%",
    sidebarFg: "145 12% 60%",
    sidebarPrimary: "145 70% 44%",
    sidebarAccent: "148 24% 11%",
    sidebarBorder: "148 24% 12%",
  },
  {
    id: "graphite-black",
    name: "Graphite Black",
    primary: "0 0% 45%",
    accent: "210 10% 50%",
    neonPurple: "240 15% 52%",
    neonBlue: "210 20% 50%",
    neonGreen: "150 30% 45%",
    neonOrange: "25 50% 52%",
    neonPink: "330 30% 52%",
    sidebarBg: "0 0% 6%",
    sidebarFg: "0 0% 55%",
    sidebarPrimary: "0 0% 50%",
    sidebarAccent: "0 0% 11%",
    sidebarBorder: "0 0% 13%",
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    primary: "42 85% 48%",
    accent: "36 90% 50%",
    neonPurple: "45 70% 55%",
    neonBlue: "38 80% 52%",
    neonGreen: "55 60% 45%",
    neonOrange: "30 95% 55%",
    neonPink: "350 70% 55%",
    sidebarBg: "40 25% 7%",
    sidebarFg: "42 14% 62%",
    sidebarPrimary: "42 85% 52%",
    sidebarAccent: "40 22% 12%",
    sidebarBorder: "40 22% 13%",
  },
];

const AUTO_ROTATE_INTERVAL_KEY = "nw-theme-rotate-interval";
const DEFAULT_ROTATE_MS = 20 * 60 * 1000; // 20 minutes

function getDayThemeIndex(): number {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % THEMES.length;
}

function applyThemeVars(theme: ThemeConfig) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--ring", theme.primary);
  root.style.setProperty("--neon-purple", theme.neonPurple);
  root.style.setProperty("--neon-blue", theme.neonBlue);
  root.style.setProperty("--neon-green", theme.neonGreen);
  root.style.setProperty("--neon-orange", theme.neonOrange);
  root.style.setProperty("--neon-pink", theme.neonPink);
  root.style.setProperty("--sidebar-background", theme.sidebarBg);
  root.style.setProperty("--sidebar-foreground", theme.sidebarFg);
  root.style.setProperty("--sidebar-primary", theme.sidebarPrimary);
  root.style.setProperty("--sidebar-accent", theme.sidebarAccent);
  root.style.setProperty("--sidebar-border", theme.sidebarBorder);
  root.style.setProperty("--sidebar-ring", theme.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", "0 0% 100%");
  root.style.setProperty("--sidebar-accent-foreground", "220 10% 90%");
  // Chart colors follow theme
  root.style.setProperty("--chart-1", theme.primary);
  root.style.setProperty("--chart-2", theme.neonGreen);
  root.style.setProperty("--chart-3", theme.neonOrange);
  root.style.setProperty("--chart-4", theme.neonPink);
  root.style.setProperty("--chart-5", theme.accent);
}

type RotateMode = "off" | "daily" | "timed";

interface ThemeContextType {
  currentTheme: ThemeConfig;
  setThemeById: (id: string) => void;
  isLocked: boolean;
  lockTheme: (locked: boolean) => void;
  allThemes: ThemeConfig[];
  rotateMode: RotateMode;
  setRotateMode: (mode: RotateMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem("nw-theme-locked") === "true");
  const [rotateMode, setRotateModeState] = useState<RotateMode>(() => {
    return (localStorage.getItem("nw-theme-rotate") as RotateMode) || "daily";
  });
  const [themeId, setThemeId] = useState<string>(() => {
    const saved = localStorage.getItem("nw-theme-id");
    if (saved && isLocked) return saved;
    return THEMES[getDayThemeIndex()].id;
  });

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    applyThemeVars(currentTheme);
  }, [currentTheme]);

  // 20-minute auto-rotation
  useEffect(() => {
    if (rotateMode !== "timed" || isLocked) return;
    const rotate = () => {
      setThemeId(prev => {
        const idx = THEMES.findIndex(t => t.id === prev);
        return THEMES[(idx + 1) % THEMES.length].id;
      });
    };
    const interval = setInterval(rotate, DEFAULT_ROTATE_MS);
    return () => clearInterval(interval);
  }, [rotateMode, isLocked]);

  const setThemeById = useCallback((id: string) => {
    setThemeId(id);
    setIsLocked(true);
    setRotateModeState("off");
    localStorage.setItem("nw-theme-id", id);
    localStorage.setItem("nw-theme-locked", "true");
    localStorage.setItem("nw-theme-rotate", "off");
  }, []);

  const lockTheme = useCallback((locked: boolean) => {
    setIsLocked(locked);
    localStorage.setItem("nw-theme-locked", String(locked));
    if (!locked) {
      const autoId = THEMES[getDayThemeIndex()].id;
      setThemeId(autoId);
      localStorage.removeItem("nw-theme-id");
      setRotateModeState("daily");
      localStorage.setItem("nw-theme-rotate", "daily");
    }
  }, []);

  const setRotateMode = useCallback((mode: RotateMode) => {
    setRotateModeState(mode);
    localStorage.setItem("nw-theme-rotate", mode);
    if (mode === "timed") {
      setIsLocked(false);
      localStorage.setItem("nw-theme-locked", "false");
    } else if (mode === "off") {
      setIsLocked(true);
      localStorage.setItem("nw-theme-locked", "true");
    } else {
      // daily
      setIsLocked(false);
      localStorage.setItem("nw-theme-locked", "false");
      const autoId = THEMES[getDayThemeIndex()].id;
      setThemeId(autoId);
      localStorage.removeItem("nw-theme-id");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setThemeById, isLocked, lockTheme, allThemes: THEMES, rotateMode, setRotateMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeEngine() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeEngine must be used within ThemeProvider");
  return ctx;
}
