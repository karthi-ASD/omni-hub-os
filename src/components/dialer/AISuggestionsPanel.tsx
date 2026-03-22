import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Sparkles, MessageSquare, ShieldQuestion, Target, HelpCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { AISuggestion, AIAssistStatus } from "@/hooks/useAICallAssistant";

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  reply: { icon: MessageSquare, label: "Reply", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
  objection: { icon: ShieldQuestion, label: "Objection", color: "bg-amber-500/10 text-amber-700 border-amber-200" },
  close: { icon: Target, label: "Close", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
  question: { icon: HelpCircle, label: "Question", color: "bg-purple-500/10 text-purple-700 border-purple-200" },
  follow_up: { icon: ArrowRight, label: "Follow-up", color: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
};

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  status: AIAssistStatus;
  onCopy: (id: string) => void;
  onRefresh: () => void;
}

export function AISuggestionsPanel({ suggestions, status, onCopy, onRefresh }: AISuggestionsPanelProps) {
  const handleCopy = (suggestion: AISuggestion) => {
    navigator.clipboard.writeText(suggestion.text);
    onCopy(suggestion.id);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> AI Suggestions
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge className={`text-[10px] ${
              status === "active" ? "bg-emerald-500/20 text-emerald-700" :
              status === "processing" ? "bg-amber-500/20 text-amber-700" :
              status === "failed" ? "bg-destructive/20 text-destructive" :
              "bg-muted text-muted-foreground"
            }`}>
              {status === "active" ? "Active" : status === "processing" ? "Thinking..." : status === "failed" ? "Failed" : "Idle"}
            </Badge>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onRefresh}>
              <RefreshCw className={`h-3 w-3 ${status === "processing" ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1 overflow-y-auto space-y-2">
        {suggestions.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            <p>{status === "processing" ? "Generating suggestions..." : "Suggestions appear during calls"}</p>
          </div>
        ) : (
          suggestions.map((s) => {
            const config = TYPE_CONFIG[s.type] || TYPE_CONFIG.reply;
            const Icon = config.icon;
            return (
              <div
                key={s.id}
                className={`p-2.5 rounded-lg border ${config.color} space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] gap-1 h-5">
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => handleCopy(s)}
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy
                  </Button>
                </div>
                <p className="text-xs leading-relaxed">{s.text}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
