import React from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Dev-only floating panel showing auth state.
 * Rendered only when import.meta.env.DEV is true.
 * Remove this component when no longer needed.
 */
const AuthDiagnostics: React.FC<{ securityCheck?: string }> = ({ securityCheck }) => {
  const { session, user, loading, roles, profile } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  if (!import.meta.env.DEV) return null;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-3 left-3 z-[9999] h-8 w-8 rounded-full bg-destructive text-destructive-foreground text-xs font-bold shadow-lg flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
        title="Auth Diagnostics"
      >
        🔒
      </button>
    );
  }

  const rows: [string, string][] = [
    ["loading", String(loading)],
    ["session", session ? "✅ active" : "❌ null"],
    ["user", user ? `✅ ${user.id.slice(0, 8)}…` : "❌ null"],
    ["roles", roles.length ? roles.join(", ") : "—"],
    ["profile", profile ? `✅ ${profile.full_name || profile.email}` : "❌ null"],
    ["biz_id", profile?.business_id?.slice(0, 8) ?? "—"],
  ];

  if (securityCheck !== undefined) {
    rows.push(["secCheck", securityCheck]);
  }

  return (
    <div className="fixed bottom-3 left-3 z-[9999] w-64 rounded-lg border border-border bg-popover/95 backdrop-blur-md shadow-xl text-xs font-mono p-3 space-y-1">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-destructive uppercase tracking-wider text-[10px]">
          🔒 Auth Diagnostics
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-muted-foreground hover:text-foreground text-sm leading-none"
        >
          ✕
        </button>
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-2">
          <span className="text-muted-foreground">{label}</span>
          <span
            className={
              value.startsWith("✅")
                ? "text-success"
                : value.startsWith("❌")
                ? "text-destructive"
                : "text-foreground"
            }
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default AuthDiagnostics;
