import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTodayInsight } from "@/hooks/useDailyInsights";
import { Sparkles, Play } from "lucide-react";
import { useState } from "react";

const priorityColors: Record<string, string> = {
  normal: "bg-info/10 text-info",
  important: "bg-warning/10 text-warning",
  mandatory: "bg-destructive/10 text-destructive",
};

export function TodayInsightWidget() {
  const { insight, loading } = useTodayInsight();
  const [expanded, setExpanded] = useState(false);

  if (loading || !insight) return null;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Today's Insight</span>
          <Badge className={`ml-auto text-[10px] ${priorityColors[insight.priority_level] || ""}`}>{insight.priority_level}</Badge>
        </div>
        <h4 className="font-semibold text-sm">{insight.title}</h4>
        {insight.message && <p className="text-xs text-muted-foreground line-clamp-2">{insight.message}</p>}
        {insight.video_url && !expanded && (
          <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={() => setExpanded(true)}>
            <Play className="h-3.5 w-3.5" /> Watch Insight
          </Button>
        )}
        {expanded && insight.video_url && (
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              src={(() => {
                const url = insight.video_url!;
                const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
                if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
                const vm = url.match(/vimeo\.com\/(\d+)/);
                if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
                return url;
              })()}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
