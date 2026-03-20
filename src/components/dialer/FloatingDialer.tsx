import { useNavigate, useLocation } from "react-router-dom";
import { useDialerAccess } from "@/hooks/useDialerAccess";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Sales-context route prefixes where the floating dialer is shown
const SALES_ROUTES = ["/sales", "/sales-dashboard", "/sales-command-center", "/leads", "/deals", "/cold-calling", "/prospect-finder"];

export function FloatingDialer() {
  const { canAccessDialer } = useDialerAccess();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Only show in sales module context
  const isInSalesContext = SALES_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  if (!canAccessDialer || !isInSalesContext) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 transition-transform"
            onClick={() => navigate("/sales/dialer")}
          >
            <Phone className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Open Dialer</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
