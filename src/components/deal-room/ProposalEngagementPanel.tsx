import { useState, useEffect } from "react";
import { useDealRoomProposals, DealRoomProposal, ProposalEngagement } from "@/hooks/useDealRoomProposals";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Clock, FileText, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface ProposalEngagementPanelProps {
  proposal: DealRoomProposal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  proposal_opened: Eye,
  proposal_closed: FileText,
  section_viewed: BarChart3,
  reopened: Eye,
  DEFAULT: Clock,
};

export function ProposalEngagementPanel({ proposal, open, onOpenChange }: ProposalEngagementPanelProps) {
  const { getEngagement } = useDealRoomProposals();
  const [activities, setActivities] = useState<ProposalEngagement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (proposal && open) {
      setLoading(true);
      getEngagement(proposal.id).then(data => {
        setActivities(data);
        setLoading(false);
      });
    }
  }, [proposal, open]);

  if (!proposal) return null;

  const totalViews = activities.filter(a => a.activity_type === "proposal_opened").length;
  const totalTime = activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
  const firstOpen = activities.filter(a => a.activity_type === "proposal_opened").at(-1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">{proposal.proposal_title}</SheetTitle>
          <Badge variant="outline" className="w-fit text-[10px]">v{proposal.proposal_version}</Badge>
        </SheetHeader>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{totalViews}</p>
            <p className="text-[10px] text-muted-foreground">Total Views</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{Math.round(totalTime / 60)}</p>
            <p className="text-[10px] text-muted-foreground">Minutes Spent</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{firstOpen ? format(new Date(firstOpen.created_at), "dd MMM") : "—"}</p>
            <p className="text-[10px] text-muted-foreground">First Opened</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <h3 className="text-sm font-semibold mb-3">Engagement Timeline</h3>
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No engagement tracked yet.</p>
        ) : (
          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-border" />
            {activities.map(act => {
              const Icon = ACTIVITY_ICONS[act.activity_type] || ACTIVITY_ICONS.DEFAULT;
              return (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[18px] top-1.5 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <Icon className="h-2.5 w-2.5 text-primary" />
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-[10px] capitalize">{act.activity_type.replace(/_/g, " ")}</Badge>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(act.created_at), "dd MMM yyyy, HH:mm")}</span>
                      {act.device_type && <Badge variant="secondary" className="text-[9px]">{act.device_type}</Badge>}
                    </div>
                    {act.section_viewed && <p className="text-xs">Section: {act.section_viewed}</p>}
                    {act.duration_seconds > 0 && <p className="text-xs text-muted-foreground">{act.duration_seconds}s spent</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
