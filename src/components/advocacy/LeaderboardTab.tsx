import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import type { EmployeePoints, AdvocacyBadge } from "@/hooks/useAdvocacy";

interface Props {
  leaderboard: (EmployeePoints & { full_name?: string })[];
  badges: AdvocacyBadge[];
}

export function LeaderboardTab({ leaderboard, badges }: Props) {
  const [filter, setFilter] = useState("all_time");

  const getBadgesForUser = (userId: string) =>
    badges.filter((b) => b.user_id === userId);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" /> Advocacy Leaderboard
        </CardTitle>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all_time">All Time</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {leaderboard.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No points earned yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Badges</TableHead>
                <TableHead className="text-right">Points</TableHead>
                <TableHead className="text-right">Shares</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Sales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((emp, i) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-bold">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </TableCell>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {getBadgesForUser(emp.user_id).map((b) => (
                        <Badge key={b.id} variant="secondary" className="text-[10px]">{b.badge_label}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{emp.points_total}</TableCell>
                  <TableCell className="text-right">{emp.shares_count}</TableCell>
                  <TableCell className="text-right">{emp.leads_generated}</TableCell>
                  <TableCell className="text-right">{emp.sales_generated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
