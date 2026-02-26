import { useActivityTimeline } from "@/hooks/useActivityTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Shield, FileText, Users, Briefcase, Globe, MessageSquare, DollarSign, Bot, Clock } from "lucide-react";

const MODULE_ICONS: Record<string, any> = {
  LEADS: Users, SYSTEM: Shield, inquiry: MessageSquare, lead: Users,
  business: Briefcase, client: Users, invoice: FileText, payment: DollarSign,
  project: Briefcase, seo: Globe, ai: Bot, DEFAULT: Clock,
};

const ActivityTimelinePage = () => {
  const { events, loading } = useActivityTimeline();
  const [search, setSearch] = useState("");

  const filtered = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    e.module?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activity Timeline</h1>
          <p className="text-muted-foreground">Unified cross-system event stream</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No events found</p>
          ) : (
            <div className="relative border-l-2 border-muted ml-4 space-y-6">
              {filtered.slice(0, 100).map(e => {
                const Icon = MODULE_ICONS[e.module] || MODULE_ICONS.DEFAULT;
                return (
                  <div key={e.id} className="relative pl-8">
                    <div className="absolute -left-[13px] top-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{e.title.replace(/_/g, " ")}</p>
                        {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs">{e.module}</Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTimelinePage;
