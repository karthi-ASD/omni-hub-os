import { useEffect, useState } from "react";
import { Moon, Sun, Monitor, Palette, Lock, Unlock, Timer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeEngine } from "@/contexts/ThemeEngine";

type DarkMode = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyDarkMode(mode: DarkMode) {
  const root = document.documentElement;
  const resolved = mode === "system" ? getSystemTheme() : mode;
  root.classList.toggle("dark", resolved === "dark");
}

export function ThemeToggle() {
  const [darkMode, setDarkMode] = useState<DarkMode>(() => {
    return (localStorage.getItem("nextweb-theme") as DarkMode) || "system";
  });
  const { currentTheme, setThemeById, isLocked, lockTheme, allThemes, rotateMode, setRotateMode } = useThemeEngine();

  useEffect(() => {
    applyDarkMode(darkMode);
    localStorage.setItem("nextweb-theme", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (darkMode === "system") applyDarkMode("system"); };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [darkMode]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[70vh] overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Appearance</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setDarkMode("light")} className="gap-2">
          <Sun className="h-4 w-4" /> Light
          {darkMode === "light" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDarkMode("dark")} className="gap-2">
          <Moon className="h-4 w-4" /> Dark
          {darkMode === "dark" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setDarkMode("system")} className="gap-2">
          <Monitor className="h-4 w-4" /> System
          {darkMode === "system" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">Theme Rotation</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setRotateMode("off")} className="gap-2">
          <Lock className="h-3 w-3" /> Manual (locked)
          {rotateMode === "off" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRotateMode("daily")} className="gap-2">
          <RotateCcw className="h-3 w-3" /> Daily rotation
          {rotateMode === "daily" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setRotateMode("timed")} className="gap-2">
          <Timer className="h-3 w-3" /> Every 10 min
          {rotateMode === "timed" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Color Theme ({allThemes.length})
        </DropdownMenuLabel>

        {allThemes.map(theme => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => setThemeById(theme.id)}
            className="gap-2"
          >
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ background: `hsl(${theme.primary})` }}
            />
            <span className="truncate">{theme.name}</span>
            {currentTheme.id === theme.id && <span className="ml-auto text-xs text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
