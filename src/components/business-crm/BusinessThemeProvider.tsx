import { useEffect } from "react";
import { useBusinessCRM } from "@/hooks/useBusinessCRM";

/**
 * Applies per-business custom theme CSS variables when a business 
 * has a custom theme configured. Wraps the app shell.
 */
export function BusinessThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useBusinessCRM();

  useEffect(() => {
    if (!theme?.custom_colors_json) return;
    const root = document.documentElement;
    const colors = theme.custom_colors_json;
    
    // Apply each custom color as a CSS variable
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    return () => {
      // Clean up - remove custom properties
      Object.keys(colors).forEach((key) => {
        root.style.removeProperty(`--${key}`);
      });
    };
  }, [theme]);

  return <>{children}</>;
}
