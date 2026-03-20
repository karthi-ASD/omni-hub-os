import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHRPerformance } from "@/hooks/useHRPerformance";
import { Star, TrendingUp } from "lucide-react";
import { format } from "date-fns";

const RESULT_COLORS: Record<string, string> = {
  excellent: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  good: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  needs_improvement: "bg-amber-500/10 text-amber-600 border-amber-500/30",
};

export function PerformanceTab() {
  const { reviews, loading } = useHRPerformance();

  const excellent = reviews.filter((r: any) => r.result === "excellent").length;
  const good = reviews.filter((r: any) => r.result === "good").length;
  const needsImprovement = reviews.filter((r: any) => r.result === "needs_improvement").length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Excellent", value: excellent, color: "text-emerald-500" },
          { label: "Good", value: good, color: "text-blue-500" },
          { label: "Needs Improvement", value: needsImprovement, color: "text-amber-500" },
        ].map(k => (
          <Card key={k.label} className="rounded-xl border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-xl border-0 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Employee</TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Period</TableHead>
                <TableHead className="text-xs">Rating</TableHead>
                <TableHead className="text-xs">Result</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">Loading...</TableCell></TableRow>
              ) : reviews.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />No performance reviews
                </TableCell></TableRow>
              ) : reviews.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-medium">{r.hr_employees?.full_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.hr_employees?.departments?.name || "—"}</TableCell>
                  <TableCell className="text-xs">{r.review_period}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs font-semibold">
                      <Star className="h-3.5 w-3.5 text-amber-500" /> {r.overall_rating}/10
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] border capitalize ${RESULT_COLORS[r.result] || ""}`}>
                      {(r.result || "").replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {r.created_at ? format(new Date(r.created_at), "dd MMM yyyy") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
