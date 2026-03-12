import React from "react";
import { useThemeEngine, THEMES, type ThemeConfig, type RotateMode } from "@/contexts/ThemeEngine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Palette, Lock, Unlock, RotateCcw, Sun, Moon } from "lucide-react";

const INTERVAL_OPTIONS = [
  { label: "5 minutes", value: 5 * 60 * 1000 },
  { label: "10 minutes", value: 10 * 60 * 1000 },
  { label: "15 minutes", value: 15 * 60 * 1000 },
  { label: "20 minutes", value: 20 * 60 * 1000 },
  { label: "30 minutes", value: 30 * 60 * 1000 },
  { label: "1 hour", value: 60 * 60 * 1000 },
];

function ThemeSwatch({ theme, isActive, onClick }: { theme: ThemeConfig; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative rounded-xl p-3 border-2 transition-all duration-300 text-left ${
        isActive
          ? "border-[hsl(var(--primary))] shadow-glow-sm scale-[1.02]"
          : "border-border hover:border-[hsl(var(--primary))/0.4] hover:shadow-md"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="h-4 w-4 rounded-full border"
          style={{ backgroundColor: `hsl(${theme.primary})` }}
        />
        <div
          className="h-4 w-4 rounded-full border"
          style={{ backgroundColor: `hsl(${theme.accent})` }}
        />
        <div
          className="h-3 w-3 rounded-full border"
          style={{ backgroundColor: `hsl(${theme.background})` }}
        />
      </div>
      <p className="text-xs font-medium text-foreground truncate">{theme.name}</p>
      <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0">
        {theme.category === "light" ? <Sun className="h-2.5 w-2.5 mr-0.5" /> : <Moon className="h-2.5 w-2.5 mr-0.5" />}
        {theme.category}
      </Badge>
      {isActive && (
        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
      )}
    </button>
  );
}

const ThemeManagementPanel: React.FC = () => {
  const {
    currentTheme, setThemeById, isLocked, lockTheme,
    lightThemes, darkThemes,
    rotateMode, setRotateMode,
    rotateIntervalMs, setRotateIntervalMs,
  } = useThemeEngine();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Theme Rotation Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto-Rotate Themes</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically cycle through all 40 themes
              </p>
            </div>
            <Switch
              checked={rotateMode === "timed"}
              onCheckedChange={(on) => setRotateMode(on ? "timed" : "off")}
            />
          </div>

          {rotateMode === "timed" && (
            <div className="flex items-center justify-between">
              <Label className="font-medium">Rotation Interval</Label>
              <Select
                value={String(rotateIntervalMs)}
                onValueChange={(v) => setRotateIntervalMs(parseInt(v))}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Lock Current Theme</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Prevent auto-rotation from changing themes
              </p>
            </div>
            <Button
              variant={isLocked ? "default" : "outline"}
              size="sm"
              onClick={() => lockTheme(!isLocked)}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5 mr-1" /> : <Unlock className="h-3.5 w-3.5 mr-1" />}
              {isLocked ? "Locked" : "Unlocked"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Rotate Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                How themes should rotate
              </p>
            </div>
            <Select value={rotateMode} onValueChange={(v) => setRotateMode(v as RotateMode)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Manual Only</SelectItem>
                <SelectItem value="daily">Daily Change</SelectItem>
                <SelectItem value="timed">Timed Rotation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: `hsl(${currentTheme.primary})` }} />
            Active: <span className="font-semibold text-foreground">{currentTheme.name}</span>
            <Badge variant="outline" className="text-[10px]">{currentTheme.category}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Light Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-4 w-4" />
            Light Colorful Themes ({lightThemes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {lightThemes.map((theme) => (
              <ThemeSwatch
                key={theme.id}
                theme={theme}
                isActive={currentTheme.id === theme.id}
                onClick={() => setThemeById(theme.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dark Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-4 w-4" />
            Dark Colorful Themes ({darkThemes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {darkThemes.map((theme) => (
              <ThemeSwatch
                key={theme.id}
                theme={theme}
                isActive={currentTheme.id === theme.id}
                onClick={() => setThemeById(theme.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeManagementPanel;
