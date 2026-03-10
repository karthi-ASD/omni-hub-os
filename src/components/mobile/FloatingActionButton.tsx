import { useState } from "react";
import { Plus, Target, ClipboardList, Users, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "New Lead", icon: Target, action: "lead" },
  { label: "New Task", icon: ClipboardList, action: "task" },
  { label: "New Client", icon: Users, action: "client" },
  { label: "New Inquiry", icon: MessageSquare, action: "inquiry" },
];

interface FABProps {
  onAction?: (action: string) => void;
}

export function FloatingActionButton({ onAction }: FABProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (action: string) => {
    setOpen(false);
    if (onAction) {
      onAction(action);
    } else {
      const routes: Record<string, string> = {
        lead: "/leads",
        task: "/tasks",
        client: "/clients",
        inquiry: "/inquiries",
      };
      navigate(routes[action] || "/dashboard");
    }
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-2.5">
        {open &&
          actions.map((item, i) => (
            <button
              key={item.action}
              onClick={() => handleAction(item.action)}
              className={cn(
                "flex items-center gap-3 rounded-xl glass-strong px-4 py-2.5 transition-all hover-lift",
                "animate-in slide-in-from-bottom-2 fade-in duration-200"
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-sm font-medium">{item.label}</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <item.icon className="h-4 w-4 text-primary" />
              </div>
            </button>
          ))}
      </div>

      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-20 right-4 z-50 h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
          open
            ? "bg-muted rotate-45 shadow-elevated"
            : "gradient-primary shadow-glow animate-glow"
        )}
      >
        {open ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <Plus className="h-6 w-6 text-primary-foreground" />
        )}
      </button>
    </>
  );
}
