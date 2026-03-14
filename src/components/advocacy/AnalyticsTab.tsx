import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { AdvocacyCampaign } from "@/hooks/useAdvocacy";

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  expired: "bg-muted text-muted-foreground",
  draft: "bg-yellow-500/10 text-yellow-600",
  paused: "bg-orange-500/10 text-orange-600",
};

interface Props {
  campaigns: AdvocacyCampaign[];
  getCampaignStats: (id: string) => { shares: number; clicks: number; leads: number; conversions: number };
  platformBreakdown: { platform: string; shares: number; clicks: number; leads: number }[];
}

export function AnalyticsTab({ campaigns, getCampaignStats, platformBreakdown }: Props) {
  const maxShares = Math.max(...platformBreakdown.map((p) => p.shares), 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Campaign Performance</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Clicks</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((camp) => {
                const stats = getCampaignStats(camp.id);
                return (
                  <TableRow key={camp.id}>
                    <TableCell className="font-medium">{camp.title}</TableCell>
                    <TableCell><Badge className={statusColors[camp.status] || ""}>{camp.status}</Badge></TableCell>
                    <TableCell className="text-right">{stats.shares}</TableCell>
                    <TableCell className="text-right">{stats.clicks}</TableCell>
                    <TableCell className="text-right">{stats.leads}</TableCell>
                    <TableCell className="text-right">{stats.conversions}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Platform Performance Heatmap</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {platformBreakdown.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No platform data yet.</p>
          ) : (
            platformBreakdown.map((p) => (
              <div key={p.platform} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize font-medium">{p.platform}</span>
                  <span className="text-muted-foreground">{p.shares} shares · {p.clicks} clicks · {p.leads} leads</span>
                </div>
                <Progress value={(p.shares / maxShares) * 100} className="h-2" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
