import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ModuleSummaryProps {
  summary: Record<string, { orphans: number; total: number }>;
}

export function ModuleSummaryView({ summary }: ModuleSummaryProps) {
  const entries = Object.entries(summary).sort((a, b) => b[1].orphans - a[1].orphans);

  if (entries.length === 0) {
    return (
      <Card className="rounded-xl">
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No module data yet. Run a scan first.
        </CardContent>
      </Card>
    );
  }

  const totalOrphans = entries.reduce((sum, [, v]) => sum + v.orphans, 0);
  const totalRecords = entries.reduce((sum, [, v]) => sum + v.total, 0);

  return (
    <Card className="rounded-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            Module-by-Module Integrity
          </CardTitle>
          <div className="flex gap-3 text-xs">
            <span className="text-muted-foreground">{totalRecords} total records</span>
            <Badge variant={totalOrphans > 0 ? "destructive" : "secondary"} className="text-[10px]">
              {totalOrphans} orphans
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Module</TableHead>
              <TableHead className="text-xs text-right">Total</TableHead>
              <TableHead className="text-xs text-right">Orphans</TableHead>
              <TableHead className="text-xs text-right">Linked %</TableHead>
              <TableHead className="text-xs text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([table, { orphans, total }]) => {
              const pct = total > 0 ? Math.round(((total - orphans) / total) * 100) : 100;
              return (
                <TableRow key={table}>
                  <TableCell className="text-xs font-medium capitalize">{table.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-xs text-right">{total}</TableCell>
                  <TableCell className="text-xs text-right">
                    {orphans > 0 ? <span className="text-destructive font-medium">{orphans}</span> : "0"}
                  </TableCell>
                  <TableCell className="text-xs text-right">{pct}%</TableCell>
                  <TableCell className="text-center">
                    {orphans === 0 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mx-auto" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
