import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type ThemeCategory = "light" | "dark";

export interface ThemeConfig {
  id: string;
  name: string;
  category: ThemeCategory;
  primary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
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

// ─── 20 LIGHT COLORFUL THEMES ──────────────────────────
const LIGHT_THEMES: ThemeConfig[] = [
  {
    id: "sky-blue", name: "Sky Blue", category: "light",
    primary: "210 90% 52%", accent: "195 85% 48%",
    background: "210 30% 97%", foreground: "215 28% 12%",
    card: "0 0% 100%", cardForeground: "215 28% 12%",
    popover: "0 0% 100%", popoverForeground: "215 28% 12%",
    secondary: "210 20% 93%", secondaryForeground: "215 28% 12%",
    muted: "210 18% 94%", mutedForeground: "210 12% 46%",
    border: "210 18% 90%", input: "210 18% 90%",
    neonPurple: "230 70% 58%", neonBlue: "210 90% 56%",
    neonGreen: "155 60% 44%", neonOrange: "28 90% 55%", neonPink: "335 75% 58%",
    sidebarBg: "210 25% 96%", sidebarFg: "210 14% 35%",
    sidebarPrimary: "210 90% 52%", sidebarAccent: "210 20% 92%", sidebarBorder: "210 18% 88%",
  },
  {
    id: "soft-emerald", name: "Soft Emerald", category: "light",
    primary: "155 65% 42%", accent: "170 60% 40%",
    background: "150 20% 97%", foreground: "155 28% 12%",
    card: "0 0% 100%", cardForeground: "155 28% 12%",
    popover: "0 0% 100%", popoverForeground: "155 28% 12%",
    secondary: "150 16% 93%", secondaryForeground: "155 28% 12%",
    muted: "150 14% 94%", mutedForeground: "150 10% 46%",
    border: "150 14% 90%", input: "150 14% 90%",
    neonPurple: "170 55% 50%", neonBlue: "185 65% 46%",
    neonGreen: "155 70% 48%", neonOrange: "35 88% 52%", neonPink: "340 65% 56%",
    sidebarBg: "150 20% 96%", sidebarFg: "150 14% 35%",
    sidebarPrimary: "155 65% 42%", sidebarAccent: "150 16% 92%", sidebarBorder: "150 14% 88%",
  },
  {
    id: "aqua-fresh", name: "Aqua Fresh", category: "light",
    primary: "185 80% 42%", accent: "195 75% 45%",
    background: "185 22% 97%", foreground: "190 28% 12%",
    card: "0 0% 100%", cardForeground: "190 28% 12%",
    popover: "0 0% 100%", popoverForeground: "190 28% 12%",
    secondary: "185 16% 93%", secondaryForeground: "190 28% 12%",
    muted: "185 14% 94%", mutedForeground: "185 10% 46%",
    border: "185 14% 90%", input: "185 14% 90%",
    neonPurple: "200 60% 52%", neonBlue: "185 80% 48%",
    neonGreen: "165 65% 44%", neonOrange: "30 85% 54%", neonPink: "330 70% 56%",
    sidebarBg: "185 20% 96%", sidebarFg: "185 14% 35%",
    sidebarPrimary: "185 80% 42%", sidebarAccent: "185 16% 92%", sidebarBorder: "185 14% 88%",
  },
  {
    id: "coral-sunset", name: "Coral Sunset", category: "light",
    primary: "12 85% 55%", accent: "25 80% 52%",
    background: "15 25% 97%", foreground: "15 28% 12%",
    card: "0 0% 100%", cardForeground: "15 28% 12%",
    popover: "0 0% 100%", popoverForeground: "15 28% 12%",
    secondary: "15 18% 93%", secondaryForeground: "15 28% 12%",
    muted: "15 14% 94%", mutedForeground: "15 10% 46%",
    border: "15 14% 90%", input: "15 14% 90%",
    neonPurple: "350 70% 58%", neonBlue: "12 85% 58%",
    neonGreen: "155 55% 44%", neonOrange: "25 90% 55%", neonPink: "345 75% 58%",
    sidebarBg: "15 20% 96%", sidebarFg: "15 14% 35%",
    sidebarPrimary: "12 85% 55%", sidebarAccent: "15 18% 92%", sidebarBorder: "15 14% 88%",
  },
  {
    id: "lavender-light", name: "Lavender Light", category: "light",
    primary: "260 70% 60%", accent: "280 60% 55%",
    background: "260 20% 97%", foreground: "260 25% 12%",
    card: "0 0% 100%", cardForeground: "260 25% 12%",
    popover: "0 0% 100%", popoverForeground: "260 25% 12%",
    secondary: "260 16% 93%", secondaryForeground: "260 25% 12%",
    muted: "260 14% 94%", mutedForeground: "260 10% 46%",
    border: "260 14% 90%", input: "260 14% 90%",
    neonPurple: "260 75% 65%", neonBlue: "240 65% 58%",
    neonGreen: "155 55% 44%", neonOrange: "30 85% 55%", neonPink: "310 70% 58%",
    sidebarBg: "260 18% 96%", sidebarFg: "260 14% 35%",
    sidebarPrimary: "260 70% 60%", sidebarAccent: "260 16% 92%", sidebarBorder: "260 14% 88%",
  },
  {
    id: "peach-glow", name: "Peach Glow", category: "light",
    primary: "20 85% 58%", accent: "35 80% 55%",
    background: "25 25% 97%", foreground: "20 28% 12%",
    card: "0 0% 100%", cardForeground: "20 28% 12%",
    popover: "0 0% 100%", popoverForeground: "20 28% 12%",
    secondary: "25 18% 93%", secondaryForeground: "20 28% 12%",
    muted: "25 14% 94%", mutedForeground: "20 10% 46%",
    border: "25 14% 90%", input: "25 14% 90%",
    neonPurple: "340 65% 58%", neonBlue: "20 80% 58%",
    neonGreen: "50 65% 48%", neonOrange: "35 90% 55%", neonPink: "350 75% 58%",
    sidebarBg: "25 20% 96%", sidebarFg: "20 14% 35%",
    sidebarPrimary: "20 85% 58%", sidebarAccent: "25 18% 92%", sidebarBorder: "25 14% 88%",
  },
  {
    id: "mint-breeze", name: "Mint Breeze", category: "light",
    primary: "168 60% 42%", accent: "180 55% 40%",
    background: "168 20% 97%", foreground: "168 28% 12%",
    card: "0 0% 100%", cardForeground: "168 28% 12%",
    popover: "0 0% 100%", popoverForeground: "168 28% 12%",
    secondary: "168 16% 93%", secondaryForeground: "168 28% 12%",
    muted: "168 14% 94%", mutedForeground: "168 10% 46%",
    border: "168 14% 90%", input: "168 14% 90%",
    neonPurple: "180 50% 50%", neonBlue: "190 60% 46%",
    neonGreen: "168 65% 46%", neonOrange: "30 80% 52%", neonPink: "330 60% 55%",
    sidebarBg: "168 18% 96%", sidebarFg: "168 14% 35%",
    sidebarPrimary: "168 60% 42%", sidebarAccent: "168 16% 92%", sidebarBorder: "168 14% 88%",
  },
  {
    id: "rose-quartz", name: "Rose Quartz", category: "light",
    primary: "340 70% 55%", accent: "355 65% 52%",
    background: "340 20% 97%", foreground: "340 25% 12%",
    card: "0 0% 100%", cardForeground: "340 25% 12%",
    popover: "0 0% 100%", popoverForeground: "340 25% 12%",
    secondary: "340 16% 93%", secondaryForeground: "340 25% 12%",
    muted: "340 14% 94%", mutedForeground: "340 10% 46%",
    border: "340 14% 90%", input: "340 14% 90%",
    neonPurple: "310 65% 58%", neonBlue: "340 70% 58%",
    neonGreen: "155 55% 44%", neonOrange: "15 85% 55%", neonPink: "340 75% 60%",
    sidebarBg: "340 18% 96%", sidebarFg: "340 14% 35%",
    sidebarPrimary: "340 70% 55%", sidebarAccent: "340 16% 92%", sidebarBorder: "340 14% 88%",
  },
  {
    id: "golden-hour", name: "Golden Hour", category: "light",
    primary: "42 85% 50%", accent: "36 80% 48%",
    background: "40 22% 97%", foreground: "40 28% 12%",
    card: "0 0% 100%", cardForeground: "40 28% 12%",
    popover: "0 0% 100%", popoverForeground: "40 28% 12%",
    secondary: "40 18% 93%", secondaryForeground: "40 28% 12%",
    muted: "40 14% 94%", mutedForeground: "40 10% 46%",
    border: "40 14% 90%", input: "40 14% 90%",
    neonPurple: "45 70% 55%", neonBlue: "38 80% 52%",
    neonGreen: "55 60% 45%", neonOrange: "30 92% 55%", neonPink: "350 65% 55%",
    sidebarBg: "40 20% 96%", sidebarFg: "40 14% 35%",
    sidebarPrimary: "42 85% 50%", sidebarAccent: "40 18% 92%", sidebarBorder: "40 14% 88%",
  },
  {
    id: "ocean-breeze", name: "Ocean Breeze", category: "light",
    primary: "200 80% 48%", accent: "215 75% 50%",
    background: "200 22% 97%", foreground: "200 28% 12%",
    card: "0 0% 100%", cardForeground: "200 28% 12%",
    popover: "0 0% 100%", popoverForeground: "200 28% 12%",
    secondary: "200 16% 93%", secondaryForeground: "200 28% 12%",
    muted: "200 14% 94%", mutedForeground: "200 10% 46%",
    border: "200 14% 90%", input: "200 14% 90%",
    neonPurple: "220 60% 55%", neonBlue: "200 80% 52%",
    neonGreen: "170 60% 44%", neonOrange: "28 85% 54%", neonPink: "330 65% 55%",
    sidebarBg: "200 20% 96%", sidebarFg: "200 14% 35%",
    sidebarPrimary: "200 80% 48%", sidebarAccent: "200 16% 92%", sidebarBorder: "200 14% 88%",
  },
  {
    id: "spring-green", name: "Spring Green", category: "light",
    primary: "135 60% 45%", accent: "150 55% 42%",
    background: "135 20% 97%", foreground: "135 28% 12%",
    card: "0 0% 100%", cardForeground: "135 28% 12%",
    popover: "0 0% 100%", popoverForeground: "135 28% 12%",
    secondary: "135 16% 93%", secondaryForeground: "135 28% 12%",
    muted: "135 14% 94%", mutedForeground: "135 10% 46%",
    border: "135 14% 90%", input: "135 14% 90%",
    neonPurple: "155 50% 50%", neonBlue: "180 60% 44%",
    neonGreen: "135 65% 48%", neonOrange: "32 85% 52%", neonPink: "335 60% 55%",
    sidebarBg: "135 18% 96%", sidebarFg: "135 14% 35%",
    sidebarPrimary: "135 60% 45%", sidebarAccent: "135 16% 92%", sidebarBorder: "135 14% 88%",
  },
  {
    id: "powder-violet", name: "Powder Violet", category: "light",
    primary: "275 65% 58%", accent: "290 55% 52%",
    background: "275 18% 97%", foreground: "275 25% 12%",
    card: "0 0% 100%", cardForeground: "275 25% 12%",
    popover: "0 0% 100%", popoverForeground: "275 25% 12%",
    secondary: "275 14% 93%", secondaryForeground: "275 25% 12%",
    muted: "275 12% 94%", mutedForeground: "275 10% 46%",
    border: "275 12% 90%", input: "275 12% 90%",
    neonPurple: "275 70% 62%", neonBlue: "255 60% 56%",
    neonGreen: "155 55% 44%", neonOrange: "28 85% 55%", neonPink: "315 70% 58%",
    sidebarBg: "275 16% 96%", sidebarFg: "275 14% 35%",
    sidebarPrimary: "275 65% 58%", sidebarAccent: "275 14% 92%", sidebarBorder: "275 12% 88%",
  },
  {
    id: "warm-sand", name: "Warm Sand", category: "light",
    primary: "32 70% 50%", accent: "24 65% 48%",
    background: "35 22% 97%", foreground: "30 28% 12%",
    card: "0 0% 100%", cardForeground: "30 28% 12%",
    popover: "0 0% 100%", popoverForeground: "30 28% 12%",
    secondary: "35 18% 93%", secondaryForeground: "30 28% 12%",
    muted: "35 14% 94%", mutedForeground: "30 10% 46%",
    border: "35 14% 90%", input: "35 14% 90%",
    neonPurple: "20 60% 55%", neonBlue: "32 70% 54%",
    neonGreen: "50 55% 45%", neonOrange: "24 85% 55%", neonPink: "350 65% 55%",
    sidebarBg: "35 18% 96%", sidebarFg: "30 14% 35%",
    sidebarPrimary: "32 70% 50%", sidebarAccent: "35 18% 92%", sidebarBorder: "35 14% 88%",
  },
  {
    id: "cherry-blossom", name: "Cherry Blossom", category: "light",
    primary: "330 65% 55%", accent: "345 60% 52%",
    background: "330 18% 97%", foreground: "330 25% 12%",
    card: "0 0% 100%", cardForeground: "330 25% 12%",
    popover: "0 0% 100%", popoverForeground: "330 25% 12%",
    secondary: "330 14% 93%", secondaryForeground: "330 25% 12%",
    muted: "330 12% 94%", mutedForeground: "330 10% 46%",
    border: "330 12% 90%", input: "330 12% 90%",
    neonPurple: "300 60% 56%", neonBlue: "330 65% 58%",
    neonGreen: "155 55% 44%", neonOrange: "15 80% 55%", neonPink: "330 70% 58%",
    sidebarBg: "330 16% 96%", sidebarFg: "330 14% 35%",
    sidebarPrimary: "330 65% 55%", sidebarAccent: "330 14% 92%", sidebarBorder: "330 12% 88%",
  },
  {
    id: "frost-blue", name: "Frost Blue", category: "light",
    primary: "225 75% 55%", accent: "240 65% 52%",
    background: "225 20% 97%", foreground: "225 25% 12%",
    card: "0 0% 100%", cardForeground: "225 25% 12%",
    popover: "0 0% 100%", popoverForeground: "225 25% 12%",
    secondary: "225 16% 93%", secondaryForeground: "225 25% 12%",
    muted: "225 14% 94%", mutedForeground: "225 10% 46%",
    border: "225 14% 90%", input: "225 14% 90%",
    neonPurple: "240 65% 58%", neonBlue: "225 75% 58%",
    neonGreen: "160 55% 44%", neonOrange: "30 85% 55%", neonPink: "335 65% 56%",
    sidebarBg: "225 18% 96%", sidebarFg: "225 14% 35%",
    sidebarPrimary: "225 75% 55%", sidebarAccent: "225 16% 92%", sidebarBorder: "225 14% 88%",
  },
  {
    id: "lime-zest", name: "Lime Zest", category: "light",
    primary: "85 65% 42%", accent: "100 55% 40%",
    background: "85 18% 97%", foreground: "85 28% 12%",
    card: "0 0% 100%", cardForeground: "85 28% 12%",
    popover: "0 0% 100%", popoverForeground: "85 28% 12%",
    secondary: "85 14% 93%", secondaryForeground: "85 28% 12%",
    muted: "85 12% 94%", mutedForeground: "85 10% 46%",
    border: "85 12% 90%", input: "85 12% 90%",
    neonPurple: "100 50% 50%", neonBlue: "120 55% 44%",
    neonGreen: "85 70% 48%", neonOrange: "45 85% 52%", neonPink: "340 60% 55%",
    sidebarBg: "85 16% 96%", sidebarFg: "85 14% 35%",
    sidebarPrimary: "85 65% 42%", sidebarAccent: "85 14% 92%", sidebarBorder: "85 12% 88%",
  },
  {
    id: "cotton-candy", name: "Cotton Candy", category: "light",
    primary: "305 60% 58%", accent: "320 55% 55%",
    background: "305 18% 97%", foreground: "305 25% 12%",
    card: "0 0% 100%", cardForeground: "305 25% 12%",
    popover: "0 0% 100%", popoverForeground: "305 25% 12%",
    secondary: "305 14% 93%", secondaryForeground: "305 25% 12%",
    muted: "305 12% 94%", mutedForeground: "305 10% 46%",
    border: "305 12% 90%", input: "305 12% 90%",
    neonPurple: "285 60% 58%", neonBlue: "305 60% 58%",
    neonGreen: "155 55% 44%", neonOrange: "25 80% 55%", neonPink: "320 70% 58%",
    sidebarBg: "305 16% 96%", sidebarFg: "305 14% 35%",
    sidebarPrimary: "305 60% 58%", sidebarAccent: "305 14% 92%", sidebarBorder: "305 12% 88%",
  },
  {
    id: "sage-green", name: "Sage Green", category: "light",
    primary: "142 40% 45%", accent: "155 35% 42%",
    background: "142 16% 97%", foreground: "142 25% 12%",
    card: "0 0% 100%", cardForeground: "142 25% 12%",
    popover: "0 0% 100%", popoverForeground: "142 25% 12%",
    secondary: "142 12% 93%", secondaryForeground: "142 25% 12%",
    muted: "142 10% 94%", mutedForeground: "142 8% 46%",
    border: "142 10% 90%", input: "142 10% 90%",
    neonPurple: "155 40% 50%", neonBlue: "170 45% 44%",
    neonGreen: "142 50% 48%", neonOrange: "30 75% 52%", neonPink: "335 55% 55%",
    sidebarBg: "142 14% 96%", sidebarFg: "142 12% 35%",
    sidebarPrimary: "142 40% 45%", sidebarAccent: "142 12% 92%", sidebarBorder: "142 10% 88%",
  },
  {
    id: "electric-indigo", name: "Electric Indigo", category: "light",
    primary: "245 80% 60%", accent: "255 70% 56%",
    background: "245 18% 97%", foreground: "245 25% 12%",
    card: "0 0% 100%", cardForeground: "245 25% 12%",
    popover: "0 0% 100%", popoverForeground: "245 25% 12%",
    secondary: "245 14% 93%", secondaryForeground: "245 25% 12%",
    muted: "245 12% 94%", mutedForeground: "245 10% 46%",
    border: "245 12% 90%", input: "245 12% 90%",
    neonPurple: "245 80% 65%", neonBlue: "230 70% 58%",
    neonGreen: "155 55% 44%", neonOrange: "28 85% 55%", neonPink: "315 70% 58%",
    sidebarBg: "245 16% 96%", sidebarFg: "245 14% 35%",
    sidebarPrimary: "245 80% 60%", sidebarAccent: "245 14% 92%", sidebarBorder: "245 12% 88%",
  },
  {
    id: "tangerine", name: "Tangerine", category: "light",
    primary: "24 90% 52%", accent: "16 85% 50%",
    background: "24 22% 97%", foreground: "24 28% 12%",
    card: "0 0% 100%", cardForeground: "24 28% 12%",
    popover: "0 0% 100%", popoverForeground: "24 28% 12%",
    secondary: "24 18% 93%", secondaryForeground: "24 28% 12%",
    muted: "24 14% 94%", mutedForeground: "24 10% 46%",
    border: "24 14% 90%", input: "24 14% 90%",
    neonPurple: "350 70% 55%", neonBlue: "24 85% 55%",
    neonGreen: "155 55% 44%", neonOrange: "16 92% 55%", neonPink: "345 75% 55%",
    sidebarBg: "24 18% 96%", sidebarFg: "24 14% 35%",
    sidebarPrimary: "24 90% 52%", sidebarAccent: "24 18% 92%", sidebarBorder: "24 14% 88%",
  },
];

// ─── 20 DARK COLORFUL THEMES ───────────────────────────
const DARK_THEMES: ThemeConfig[] = [
  {
    id: "midnight-blue", name: "Midnight Blue", category: "dark",
    primary: "218 80% 52%", accent: "210 90% 55%",
    background: "222 30% 6%", foreground: "220 14% 92%",
    card: "222 25% 10%", cardForeground: "220 14% 92%",
    popover: "222 25% 10%", popoverForeground: "220 14% 92%",
    secondary: "222 20% 14%", secondaryForeground: "220 14% 92%",
    muted: "222 18% 13%", mutedForeground: "220 10% 50%",
    border: "222 18% 16%", input: "222 18% 16%",
    neonPurple: "230 70% 58%", neonBlue: "218 85% 58%",
    neonGreen: "160 55% 48%", neonOrange: "30 85% 55%", neonPink: "340 70% 58%",
    sidebarBg: "222 32% 5%", sidebarFg: "218 14% 65%",
    sidebarPrimary: "218 80% 55%", sidebarAccent: "222 24% 12%", sidebarBorder: "222 24% 14%",
  },
  {
    id: "neon-purple", name: "Neon Purple", category: "dark",
    primary: "270 80% 60%", accent: "290 75% 55%",
    background: "268 30% 6%", foreground: "270 14% 92%",
    card: "268 25% 10%", cardForeground: "270 14% 92%",
    popover: "268 25% 10%", popoverForeground: "270 14% 92%",
    secondary: "268 20% 14%", secondaryForeground: "270 14% 92%",
    muted: "268 18% 13%", mutedForeground: "270 10% 50%",
    border: "268 18% 16%", input: "268 18% 16%",
    neonPurple: "270 85% 65%", neonBlue: "260 75% 58%",
    neonGreen: "165 60% 48%", neonOrange: "35 90% 55%", neonPink: "315 85% 60%",
    sidebarBg: "268 32% 5%", sidebarFg: "270 12% 65%",
    sidebarPrimary: "270 80% 62%", sidebarAccent: "268 22% 12%", sidebarBorder: "268 22% 14%",
  },
  {
    id: "cyber-blue", name: "Cyber Blue", category: "dark",
    primary: "200 90% 50%", accent: "210 85% 52%",
    background: "205 30% 6%", foreground: "200 14% 92%",
    card: "205 25% 10%", cardForeground: "200 14% 92%",
    popover: "205 25% 10%", popoverForeground: "200 14% 92%",
    secondary: "205 20% 14%", secondaryForeground: "200 14% 92%",
    muted: "205 18% 13%", mutedForeground: "200 10% 50%",
    border: "205 18% 16%", input: "205 18% 16%",
    neonPurple: "220 65% 58%", neonBlue: "200 90% 55%",
    neonGreen: "170 60% 48%", neonOrange: "28 85% 55%", neonPink: "335 70% 58%",
    sidebarBg: "205 32% 5%", sidebarFg: "200 14% 65%",
    sidebarPrimary: "200 90% 52%", sidebarAccent: "205 24% 12%", sidebarBorder: "205 24% 14%",
  },
  {
    id: "graphite-dark", name: "Graphite Dark", category: "dark",
    primary: "0 0% 50%", accent: "210 10% 52%",
    background: "0 0% 6%", foreground: "0 0% 90%",
    card: "0 0% 10%", cardForeground: "0 0% 90%",
    popover: "0 0% 10%", popoverForeground: "0 0% 90%",
    secondary: "0 0% 14%", secondaryForeground: "0 0% 90%",
    muted: "0 0% 13%", mutedForeground: "0 0% 50%",
    border: "0 0% 16%", input: "0 0% 16%",
    neonPurple: "240 15% 55%", neonBlue: "210 20% 52%",
    neonGreen: "150 30% 48%", neonOrange: "25 50% 55%", neonPink: "330 30% 55%",
    sidebarBg: "0 0% 5%", sidebarFg: "0 0% 55%",
    sidebarPrimary: "0 0% 52%", sidebarAccent: "0 0% 11%", sidebarBorder: "0 0% 14%",
  },
  {
    id: "dark-emerald", name: "Dark Emerald", category: "dark",
    primary: "145 70% 42%", accent: "158 60% 45%",
    background: "148 30% 6%", foreground: "145 14% 92%",
    card: "148 25% 10%", cardForeground: "145 14% 92%",
    popover: "148 25% 10%", popoverForeground: "145 14% 92%",
    secondary: "148 20% 14%", secondaryForeground: "145 14% 92%",
    muted: "148 18% 13%", mutedForeground: "145 10% 50%",
    border: "148 18% 16%", input: "148 18% 16%",
    neonPurple: "160 50% 52%", neonBlue: "175 60% 48%",
    neonGreen: "145 75% 50%", neonOrange: "32 88% 55%", neonPink: "345 65% 58%",
    sidebarBg: "148 32% 5%", sidebarFg: "145 12% 60%",
    sidebarPrimary: "145 70% 46%", sidebarAccent: "148 22% 11%", sidebarBorder: "148 22% 13%",
  },
  {
    id: "deep-violet", name: "Deep Violet", category: "dark",
    primary: "285 75% 58%", accent: "300 65% 52%",
    background: "285 28% 6%", foreground: "285 14% 92%",
    card: "285 22% 10%", cardForeground: "285 14% 92%",
    popover: "285 22% 10%", popoverForeground: "285 14% 92%",
    secondary: "285 18% 14%", secondaryForeground: "285 14% 92%",
    muted: "285 16% 13%", mutedForeground: "285 10% 50%",
    border: "285 16% 16%", input: "285 16% 16%",
    neonPurple: "285 80% 62%", neonBlue: "265 70% 58%",
    neonGreen: "160 55% 48%", neonOrange: "30 85% 55%", neonPink: "320 80% 60%",
    sidebarBg: "285 30% 5%", sidebarFg: "285 12% 60%",
    sidebarPrimary: "285 75% 60%", sidebarAccent: "285 20% 11%", sidebarBorder: "285 20% 13%",
  },
  {
    id: "royal-blue-dark", name: "Royal Blue", category: "dark",
    primary: "224 76% 52%", accent: "199 89% 50%",
    background: "225 28% 6%", foreground: "220 14% 92%",
    card: "225 22% 10%", cardForeground: "220 14% 92%",
    popover: "225 22% 10%", popoverForeground: "220 14% 92%",
    secondary: "225 18% 14%", secondaryForeground: "220 14% 92%",
    muted: "225 16% 13%", mutedForeground: "220 10% 50%",
    border: "225 16% 16%", input: "225 16% 16%",
    neonPurple: "224 76% 58%", neonBlue: "199 89% 55%",
    neonGreen: "152 60% 46%", neonOrange: "24 95% 58%", neonPink: "330 80% 60%",
    sidebarBg: "225 30% 5%", sidebarFg: "220 14% 65%",
    sidebarPrimary: "224 76% 55%", sidebarAccent: "225 20% 12%", sidebarBorder: "225 20% 14%",
  },
  {
    id: "sunset-dark", name: "Dark Sunset", category: "dark",
    primary: "24 95% 55%", accent: "38 92% 52%",
    background: "20 25% 6%", foreground: "24 14% 92%",
    card: "20 20% 10%", cardForeground: "24 14% 92%",
    popover: "20 20% 10%", popoverForeground: "24 14% 92%",
    secondary: "20 16% 14%", secondaryForeground: "24 14% 92%",
    muted: "20 14% 13%", mutedForeground: "24 10% 50%",
    border: "20 14% 16%", input: "20 14% 16%",
    neonPurple: "350 75% 58%", neonBlue: "24 90% 58%",
    neonGreen: "38 92% 52%", neonOrange: "14 100% 58%", neonPink: "350 80% 60%",
    sidebarBg: "20 28% 5%", sidebarFg: "24 14% 65%",
    sidebarPrimary: "24 95% 58%", sidebarAccent: "20 18% 12%", sidebarBorder: "20 18% 14%",
  },
  {
    id: "midnight-teal", name: "Midnight Teal", category: "dark",
    primary: "180 65% 44%", accent: "195 70% 48%",
    background: "182 28% 6%", foreground: "180 14% 92%",
    card: "182 22% 10%", cardForeground: "180 14% 92%",
    popover: "182 22% 10%", popoverForeground: "180 14% 92%",
    secondary: "182 18% 14%", secondaryForeground: "180 14% 92%",
    muted: "182 16% 13%", mutedForeground: "180 10% 50%",
    border: "182 16% 16%", input: "182 16% 16%",
    neonPurple: "200 55% 55%", neonBlue: "185 70% 50%",
    neonGreen: "170 65% 48%", neonOrange: "28 85% 55%", neonPink: "335 65% 58%",
    sidebarBg: "182 30% 5%", sidebarFg: "180 14% 62%",
    sidebarPrimary: "180 65% 48%", sidebarAccent: "182 20% 11%", sidebarBorder: "182 20% 13%",
  },
  {
    id: "platinum-dark", name: "Platinum", category: "dark",
    primary: "220 14% 48%", accent: "220 20% 55%",
    background: "220 16% 7%", foreground: "220 10% 90%",
    card: "220 14% 11%", cardForeground: "220 10% 90%",
    popover: "220 14% 11%", popoverForeground: "220 10% 90%",
    secondary: "220 12% 15%", secondaryForeground: "220 10% 90%",
    muted: "220 10% 14%", mutedForeground: "220 8% 50%",
    border: "220 10% 17%", input: "220 10% 17%",
    neonPurple: "240 30% 55%", neonBlue: "210 40% 55%",
    neonGreen: "152 40% 48%", neonOrange: "24 60% 55%", neonPink: "330 40% 55%",
    sidebarBg: "220 18% 5%", sidebarFg: "220 10% 60%",
    sidebarPrimary: "220 20% 52%", sidebarAccent: "220 14% 12%", sidebarBorder: "220 14% 14%",
  },
  {
    id: "royal-gold-dark", name: "Royal Gold", category: "dark",
    primary: "42 85% 52%", accent: "36 90% 52%",
    background: "40 25% 6%", foreground: "42 14% 92%",
    card: "40 20% 10%", cardForeground: "42 14% 92%",
    popover: "40 20% 10%", popoverForeground: "42 14% 92%",
    secondary: "40 16% 14%", secondaryForeground: "42 14% 92%",
    muted: "40 14% 13%", mutedForeground: "42 10% 50%",
    border: "40 14% 16%", input: "40 14% 16%",
    neonPurple: "45 70% 55%", neonBlue: "38 80% 55%",
    neonGreen: "55 60% 48%", neonOrange: "30 95% 55%", neonPink: "350 70% 55%",
    sidebarBg: "40 28% 5%", sidebarFg: "42 14% 62%",
    sidebarPrimary: "42 85% 55%", sidebarAccent: "40 20% 11%", sidebarBorder: "40 20% 13%",
  },
  {
    id: "crimson-night", name: "Crimson Night", category: "dark",
    primary: "0 75% 52%", accent: "350 70% 50%",
    background: "0 25% 6%", foreground: "0 10% 92%",
    card: "0 20% 10%", cardForeground: "0 10% 92%",
    popover: "0 20% 10%", popoverForeground: "0 10% 92%",
    secondary: "0 16% 14%", secondaryForeground: "0 10% 92%",
    muted: "0 14% 13%", mutedForeground: "0 8% 50%",
    border: "0 14% 16%", input: "0 14% 16%",
    neonPurple: "340 65% 58%", neonBlue: "0 75% 55%",
    neonGreen: "155 55% 48%", neonOrange: "20 90% 55%", neonPink: "350 80% 60%",
    sidebarBg: "0 28% 5%", sidebarFg: "0 10% 60%",
    sidebarPrimary: "0 75% 55%", sidebarAccent: "0 20% 11%", sidebarBorder: "0 20% 13%",
  },
  {
    id: "aurora-green", name: "Aurora Green", category: "dark",
    primary: "135 70% 48%", accent: "150 65% 45%",
    background: "138 28% 6%", foreground: "135 14% 92%",
    card: "138 22% 10%", cardForeground: "135 14% 92%",
    popover: "138 22% 10%", popoverForeground: "135 14% 92%",
    secondary: "138 18% 14%", secondaryForeground: "135 14% 92%",
    muted: "138 16% 13%", mutedForeground: "135 10% 50%",
    border: "138 16% 16%", input: "138 16% 16%",
    neonPurple: "155 55% 52%", neonBlue: "170 60% 48%",
    neonGreen: "135 75% 52%", neonOrange: "32 85% 55%", neonPink: "340 60% 58%",
    sidebarBg: "138 30% 5%", sidebarFg: "135 12% 60%",
    sidebarPrimary: "135 70% 50%", sidebarAccent: "138 20% 11%", sidebarBorder: "138 20% 13%",
  },
  {
    id: "electric-pink", name: "Electric Pink", category: "dark",
    primary: "330 85% 58%", accent: "345 80% 55%",
    background: "332 28% 6%", foreground: "330 14% 92%",
    card: "332 22% 10%", cardForeground: "330 14% 92%",
    popover: "332 22% 10%", popoverForeground: "330 14% 92%",
    secondary: "332 18% 14%", secondaryForeground: "330 14% 92%",
    muted: "332 16% 13%", mutedForeground: "330 10% 50%",
    border: "332 16% 16%", input: "332 16% 16%",
    neonPurple: "310 75% 60%", neonBlue: "330 85% 60%",
    neonGreen: "155 55% 48%", neonOrange: "15 85% 55%", neonPink: "330 90% 62%",
    sidebarBg: "332 30% 5%", sidebarFg: "330 12% 60%",
    sidebarPrimary: "330 85% 60%", sidebarAccent: "332 20% 11%", sidebarBorder: "332 20% 13%",
  },
  {
    id: "dark-ocean", name: "Dark Ocean", category: "dark",
    primary: "200 80% 50%", accent: "215 75% 52%",
    background: "202 28% 6%", foreground: "200 14% 92%",
    card: "202 22% 10%", cardForeground: "200 14% 92%",
    popover: "202 22% 10%", popoverForeground: "200 14% 92%",
    secondary: "202 18% 14%", secondaryForeground: "200 14% 92%",
    muted: "202 16% 13%", mutedForeground: "200 10% 50%",
    border: "202 16% 16%", input: "202 16% 16%",
    neonPurple: "220 60% 58%", neonBlue: "200 80% 55%",
    neonGreen: "170 60% 48%", neonOrange: "28 85% 55%", neonPink: "330 65% 58%",
    sidebarBg: "202 30% 5%", sidebarFg: "200 14% 62%",
    sidebarPrimary: "200 80% 52%", sidebarAccent: "202 20% 11%", sidebarBorder: "202 20% 13%",
  },
  {
    id: "obsidian", name: "Obsidian", category: "dark",
    primary: "252 85% 62%", accent: "280 65% 58%",
    background: "250 25% 6%", foreground: "252 14% 92%",
    card: "250 20% 10%", cardForeground: "252 14% 92%",
    popover: "250 20% 10%", popoverForeground: "252 14% 92%",
    secondary: "250 16% 14%", secondaryForeground: "252 14% 92%",
    muted: "250 14% 13%", mutedForeground: "252 10% 50%",
    border: "250 14% 16%", input: "250 14% 16%",
    neonPurple: "252 85% 66%", neonBlue: "280 70% 60%",
    neonGreen: "152 60% 46%", neonOrange: "24 95% 58%", neonPink: "310 80% 60%",
    sidebarBg: "250 28% 5%", sidebarFg: "252 14% 65%",
    sidebarPrimary: "252 85% 64%", sidebarAccent: "250 18% 12%", sidebarBorder: "250 18% 14%",
  },
  {
    id: "steel-blue", name: "Steel Blue", category: "dark",
    primary: "210 55% 50%", accent: "220 50% 52%",
    background: "212 22% 7%", foreground: "210 14% 90%",
    card: "212 18% 11%", cardForeground: "210 14% 90%",
    popover: "212 18% 11%", popoverForeground: "210 14% 90%",
    secondary: "212 14% 15%", secondaryForeground: "210 14% 90%",
    muted: "212 12% 14%", mutedForeground: "210 8% 50%",
    border: "212 12% 17%", input: "212 12% 17%",
    neonPurple: "230 50% 55%", neonBlue: "210 55% 55%",
    neonGreen: "155 45% 48%", neonOrange: "28 75% 55%", neonPink: "335 55% 55%",
    sidebarBg: "212 24% 5%", sidebarFg: "210 12% 60%",
    sidebarPrimary: "210 55% 52%", sidebarAccent: "212 16% 12%", sidebarBorder: "212 16% 14%",
  },
  {
    id: "dark-amber", name: "Dark Amber", category: "dark",
    primary: "35 85% 50%", accent: "28 80% 48%",
    background: "32 25% 6%", foreground: "35 14% 92%",
    card: "32 20% 10%", cardForeground: "35 14% 92%",
    popover: "32 20% 10%", popoverForeground: "35 14% 92%",
    secondary: "32 16% 14%", secondaryForeground: "35 14% 92%",
    muted: "32 14% 13%", mutedForeground: "35 10% 50%",
    border: "32 14% 16%", input: "32 14% 16%",
    neonPurple: "20 60% 55%", neonBlue: "35 85% 55%",
    neonGreen: "50 55% 48%", neonOrange: "28 90% 55%", neonPink: "350 65% 55%",
    sidebarBg: "32 28% 5%", sidebarFg: "35 14% 62%",
    sidebarPrimary: "35 85% 52%", sidebarAccent: "32 20% 11%", sidebarBorder: "32 20% 13%",
  },
  {
    id: "matrix-green", name: "Matrix Green", category: "dark",
    primary: "120 70% 42%", accent: "135 65% 40%",
    background: "125 30% 5%", foreground: "120 14% 90%",
    card: "125 24% 9%", cardForeground: "120 14% 90%",
    popover: "125 24% 9%", popoverForeground: "120 14% 90%",
    secondary: "125 20% 13%", secondaryForeground: "120 14% 90%",
    muted: "125 18% 12%", mutedForeground: "120 10% 48%",
    border: "125 18% 15%", input: "125 18% 15%",
    neonPurple: "140 50% 50%", neonBlue: "160 55% 44%",
    neonGreen: "120 75% 48%", neonOrange: "40 80% 52%", neonPink: "340 55% 55%",
    sidebarBg: "125 32% 4%", sidebarFg: "120 12% 55%",
    sidebarPrimary: "120 70% 46%", sidebarAccent: "125 22% 10%", sidebarBorder: "125 22% 12%",
  },
];

export const THEMES: ThemeConfig[] = [...LIGHT_THEMES, ...DARK_THEMES];

const DEFAULT_ROTATE_MS = 10 * 60 * 1000; // 10 minutes

function applyThemeVars(theme: ThemeConfig) {
  const root = document.documentElement;
  // Core tokens
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--foreground", theme.foreground);
  root.style.setProperty("--card", theme.card);
  root.style.setProperty("--card-foreground", theme.cardForeground);
  root.style.setProperty("--popover", theme.popover);
  root.style.setProperty("--popover-foreground", theme.popoverForeground);
  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--primary-foreground", "0 0% 100%");
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--secondary-foreground", theme.secondaryForeground);
  root.style.setProperty("--muted", theme.muted);
  root.style.setProperty("--muted-foreground", theme.mutedForeground);
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-foreground", "0 0% 100%");
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--input", theme.input);
  root.style.setProperty("--ring", theme.primary);
  // Neons
  root.style.setProperty("--neon-purple", theme.neonPurple);
  root.style.setProperty("--neon-blue", theme.neonBlue);
  root.style.setProperty("--neon-green", theme.neonGreen);
  root.style.setProperty("--neon-orange", theme.neonOrange);
  root.style.setProperty("--neon-pink", theme.neonPink);
  // Sidebar
  root.style.setProperty("--sidebar-background", theme.sidebarBg);
  root.style.setProperty("--sidebar-foreground", theme.sidebarFg);
  root.style.setProperty("--sidebar-primary", theme.sidebarPrimary);
  root.style.setProperty("--sidebar-accent", theme.sidebarAccent);
  root.style.setProperty("--sidebar-border", theme.sidebarBorder);
  root.style.setProperty("--sidebar-ring", theme.sidebarPrimary);
  root.style.setProperty("--sidebar-primary-foreground", "0 0% 100%");
  root.style.setProperty("--sidebar-accent-foreground", "220 10% 90%");
  // Charts
  root.style.setProperty("--chart-1", theme.primary);
  root.style.setProperty("--chart-2", theme.neonGreen);
  root.style.setProperty("--chart-3", theme.neonOrange);
  root.style.setProperty("--chart-4", theme.neonPink);
  root.style.setProperty("--chart-5", theme.accent);
  // Semantic tokens that remain constant
  root.style.setProperty("--destructive", "0 72% 51%");
  root.style.setProperty("--destructive-foreground", "0 0% 100%");
  root.style.setProperty("--success", "152 60% 42%");
  root.style.setProperty("--success-foreground", "0 0% 100%");
  root.style.setProperty("--warning", "38 92% 50%");
  root.style.setProperty("--warning-foreground", "0 0% 100%");
  root.style.setProperty("--info", "199 89% 48%");
  root.style.setProperty("--info-foreground", "0 0% 100%");
  // Data attribute for category
  root.setAttribute("data-theme-category", theme.category);
}

function getDayThemeIndex(): number {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dayOfYear % THEMES.length;
}

export type RotateMode = "off" | "daily" | "timed";

interface ThemeContextType {
  currentTheme: ThemeConfig;
  setThemeById: (id: string) => void;
  isLocked: boolean;
  lockTheme: (locked: boolean) => void;
  allThemes: ThemeConfig[];
  lightThemes: ThemeConfig[];
  darkThemes: ThemeConfig[];
  rotateMode: RotateMode;
  setRotateMode: (mode: RotateMode) => void;
  rotateIntervalMs: number;
  setRotateIntervalMs: (ms: number) => void;
  isDarkTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem("nw-theme-locked") === "true");
  const [rotateMode, setRotateModeState] = useState<RotateMode>(() => {
    return (localStorage.getItem("nw-theme-rotate") as RotateMode) || "timed";
  });
  const [rotateIntervalMs, setRotateIntervalMsState] = useState(() => {
    const saved = localStorage.getItem("nw-theme-rotate-interval");
    return saved ? parseInt(saved, 10) : DEFAULT_ROTATE_MS;
  });
  const [themeId, setThemeId] = useState<string>(() => {
    const saved = localStorage.getItem("nw-theme-id");
    if (saved && isLocked) return saved;
    return THEMES[getDayThemeIndex()].id;
  });

  const currentTheme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const isDarkTheme = currentTheme.category === "dark";

  useEffect(() => {
    applyThemeVars(currentTheme);
  }, [currentTheme]);

  // Timed auto-rotation
  useEffect(() => {
    if (rotateMode !== "timed" || isLocked) return;
    const rotate = () => {
      setThemeId(prev => {
        const idx = THEMES.findIndex(t => t.id === prev);
        return THEMES[(idx + 1) % THEMES.length].id;
      });
    };
    const interval = setInterval(rotate, rotateIntervalMs);
    return () => clearInterval(interval);
  }, [rotateMode, isLocked, rotateIntervalMs]);

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
      setRotateModeState("timed");
      localStorage.setItem("nw-theme-rotate", "timed");
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
      setIsLocked(false);
      localStorage.setItem("nw-theme-locked", "false");
      const autoId = THEMES[getDayThemeIndex()].id;
      setThemeId(autoId);
      localStorage.removeItem("nw-theme-id");
    }
  }, []);

  const setRotateIntervalMs = useCallback((ms: number) => {
    setRotateIntervalMsState(ms);
    localStorage.setItem("nw-theme-rotate-interval", String(ms));
  }, []);

  const lightThemes = useMemo(() => THEMES.filter(t => t.category === "light"), []);
  const darkThemes = useMemo(() => THEMES.filter(t => t.category === "dark"), []);

  return (
    <ThemeContext.Provider value={{
      currentTheme, setThemeById, isLocked, lockTheme,
      allThemes: THEMES, lightThemes, darkThemes,
      rotateMode, setRotateMode,
      rotateIntervalMs, setRotateIntervalMs,
      isDarkTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeEngine() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeEngine must be used within ThemeProvider");
  return ctx;
}
