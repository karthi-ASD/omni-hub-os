import { useThemeEngine } from "@/contexts/ThemeEngine";
import nextwebLogoPng from "@/assets/nextweb-logo-new.png";

interface NWLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function NWLogo({ size = "md", showText = true }: NWLogoProps) {
  const themeEngine = (() => {
    try {
      return useThemeEngine();
    } catch {
      return null;
    }
  })();

  const isDark = themeEngine?.isDarkTheme ?? true;

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  // Adaptive text color based on theme category
  const textColor = isDark
    ? "text-[hsl(var(--primary-foreground))]"
    : "text-[hsl(var(--foreground))]";

  return (
    <div className="flex items-center gap-3 transition-colors duration-500">
      <img
        src={nextwebLogoPng}
        alt="NextWeb OS"
        className={`${sizeClasses[size]} rounded-lg object-contain transition-all duration-500`}
        style={{
          filter: isDark ? "brightness(1.2) drop-shadow(0 0 6px hsl(var(--primary) / 0.4))" : "none",
        }}
      />
      {showText && (
        <span className={`${textClasses[size]} font-bold ${textColor} transition-colors duration-500`}>
          NextWeb OS
        </span>
      )}
    </div>
  );
}
