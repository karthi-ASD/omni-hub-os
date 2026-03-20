import { useNavigate } from "react-router-dom";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ClickToCallButtonProps {
  phone: string;
  leadId?: string;
  leadName?: string;
  company?: string;
  size?: "sm" | "default" | "icon";
  variant?: "ghost" | "outline" | "default";
}

export function ClickToCallButton({ phone, leadId, leadName, company, size = "icon", variant = "ghost" }: ClickToCallButtonProps) {
  const navigate = useNavigate();

  if (!phone) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const params = new URLSearchParams({ phone });
    if (leadId) params.set("leadId", leadId);
    if (leadName) params.set("name", leadName);
    if (company) params.set("company", company);
    navigate(`/dialer?${params.toString()}`);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant={variant} size={size} onClick={handleClick} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
          <Phone className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Call {phone}</TooltipContent>
    </Tooltip>
  );
}
