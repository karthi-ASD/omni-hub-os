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

export function ThemeToggle() {
  const {
    currentTheme, setThemeById, allThemes,
    lightThemes, darkThemes,
    rotateMode, setRotateMode, isDarkTheme,
  } = useThemeEngine();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-[70vh] overflow-y-auto">
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
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
          <Sun className="h-3 w-3" /> Light Themes ({lightThemes.length})
        </DropdownMenuLabel>
        {lightThemes.map(theme => (
          <DropdownMenuItem key={theme.id} onClick={() => setThemeById(theme.id)} className="gap-2">
            <span className="h-3 w-3 rounded-full shrink-0 border" style={{ background: `hsl(${theme.primary})` }} />
            <span className="truncate text-xs">{theme.name}</span>
            {currentTheme.id === theme.id && <span className="ml-auto text-xs text-primary">✓</span>}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
          <Moon className="h-3 w-3" /> Dark Themes ({darkThemes.length})
        </DropdownMenuLabel>
        {darkThemes.map(theme => (
          <DropdownMenuItem key={theme.id} onClick={() => setThemeById(theme.id)} className="gap-2">
            <span className="h-3 w-3 rounded-full shrink-0 border" style={{ background: `hsl(${theme.primary})` }} />
            <span className="truncate text-xs">{theme.name}</span>
            {currentTheme.id === theme.id && <span className="ml-auto text-xs text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
