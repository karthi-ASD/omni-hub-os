/**
 * Persistent mini call bar — visible across all routes when a call is active.
 * Fed from global BrowserDialerProvider, NOT page state.
 *
 * BUILD: stability-v16
 */

import { useDialerContext } from "@/contexts/BrowserDialerContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff, Mic, MicOff, Maximize2 } from "lucide-react";

export function ActiveCallBar() {
  const dialer = useDialerContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!dialer) return null;

  const isActive = ["dialing", "ringing", "connected", "ending"].includes(dialer.callStatus);
  if (!isActive) return null;

  // Don't show on the dialer page itself — full controls are already there
  const isOnDialerPage = pathname === "/sales/dialer" || pathname === "/dialer";
  if (isOnDialerPage) return null;

  const statusLabel =
    dialer.callStatus === "connected"
      ? `Connected ${dialer.formattedTimer}`
      : dialer.callStatus === "ringing"
        ? "Ringing..."
        : dialer.callStatus === "ending"
          ? "Ending..."
          : "Dialing...";

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-3 px-4 py-2 bg-emerald-600 text-white shadow-lg animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3 min-w-0">
        <Phone className="h-4 w-4 shrink-0 animate-pulse" />
        <div className="min-w-0">
          <span className="text-sm font-medium truncate block">
            {dialer.session?.phone_number || "Active Call"}
          </span>
          <span className="text-xs opacity-80">{statusLabel}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {dialer.callStatus === "connected" && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-white hover:bg-white/20"
            onClick={dialer.toggleMute}
          >
            {dialer.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-white hover:bg-white/20"
          onClick={() => navigate("/sales/dialer")}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-white hover:bg-red-500/80 bg-red-500/50"
          onClick={dialer.endCall}
          disabled={dialer.callStatus === "ending"}
        >
          <PhoneOff className="h-4 w-4 mr-1" />
          End
        </Button>
      </div>
    </div>
  );
}
