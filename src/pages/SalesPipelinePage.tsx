import { useMemo } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useDeals } from "@/hooks/useDeals";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderKanban, Target, Briefcase } from "lucide-react";

const STAGES = [
  { key: "new", label: "New Lead", color: "bg-blue-500" },
  { key: "contacted", label: "Contacted", color: "bg-cyan-500" },
  { key: "meeting_booked", label: "Meeting Booked", color: "bg-indigo-500" },
  { key: "proposal_requested", label: "Proposal Requested", color: "bg-violet-500" },
  { key: "negotiation", label: "Negotiation", color: "bg-amber-500" },
  { key: "conversion_requested", label: "Conversion Requested", color: "bg-orange-500" },
  { key: "won", label: "Closed Won", color: "bg-green-500" },
  { key: "lost", label: "Closed Lost", color: "bg-red-500" },
];

const stageMap: Record<string, string> = {
  new: "new", prospect: "new", open: "new",
  contacted: "contacted", qualified: "contacted",
  meeting_booked: "meeting_booked", follow_up: "meeting_booked",
  proposal_sent: "proposal_requested", proposal_requested: "proposal_requested",
  negotiation: "negotiation",
  conversion_requested: "conversion_requested",
  won: "won", closed_won: "won",
  lost: "lost", closed_lost: "lost",
};

interface PipelineItem {
  id: string;
  name: string;
  company?: string;
  type: "lead" | "deal";
  value?: number;
  stage: string;
}

export default function SalesPipelinePage() {
  usePageTitle("Pipeline");
  const { leads, loading: ll } = useLeads();
  const { deals, loading: dl } = useDeals();
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const isAdmin = isSuperAdmin || isBusinessAdmin;
  const userId = profile?.user_id;

  const items = useMemo(() => {
    const result: PipelineItem[] = [];
    const filteredLeads = isAdmin ? (leads || []) : (leads || []).filter(l => l.assigned_to_user_id === userId);
    const filteredDeals = isAdmin ? (deals || []) : (deals || []).filter(d => d.owner_user_id === userId);

    filteredLeads.forEach(l => {
      result.push({
        id: l.id,
        name: l.name || l.company_name || "Unnamed Lead",
        company: l.company_name || undefined,
        type: "lead",
        value: l.estimated_value ? Number(l.estimated_value) : undefined,
        stage: stageMap[l.status?.toLowerCase() || "new"] || "new",
      });
    });

    filteredDeals.forEach(d => {
      result.push({
        id: d.id,
        name: d.title || "Unnamed Deal",
        company: d.company_name || undefined,
        type: "deal",
        value: d.value ? Number(d.value) : undefined,
        stage: stageMap[d.status?.toLowerCase() || "new"] || "new",
      });
    });

    return result;
  }, [leads, deals, isAdmin, userId]);

  if (ll || dl) return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Sales Pipeline" subtitle="Unified view of all leads and deals across stages" icon={FolderKanban} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map(stage => {
          const stageItems = items.filter(i => i.stage === stage.key);
          const totalValue = stageItems.reduce((s, i) => s + (i.value || 0), 0);
          return (
            <Card key={stage.key} className="border-t-4 rounded-xl" style={{ borderTopColor: `var(--${stage.color})` }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{stage.label}</CardTitle>
                  <Badge variant="secondary" className="text-xs">{stageItems.length}</Badge>
                </div>
                {totalValue > 0 && (
                  <p className="text-xs text-muted-foreground">${totalValue.toLocaleString()}</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {stageItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No items</p>
                )}
                {stageItems.map(item => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors space-y-1">
                    <div className="flex items-center gap-1.5">
                      {item.type === "lead" ? <Target className="h-3 w-3 text-primary" /> : <Briefcase className="h-3 w-3 text-accent" />}
                      <span className="text-sm font-medium truncate">{item.name}</span>
                    </div>
                    {item.company && <p className="text-xs text-muted-foreground truncate">{item.company}</p>}
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                      {item.value != null && item.value > 0 && (
                        <span className="text-xs font-semibold text-foreground">${item.value.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
