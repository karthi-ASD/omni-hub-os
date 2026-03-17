import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Play, Eye } from "lucide-react";

interface BackfillPanelProps {
  backfillResult: {
    mode: string;
    total_matched: number;
    total_unmatched: number;
    details: any[];
  } | null;
  preReport: {
    unmatched_by_table: Record<string, number>;
    duplicate_emails: number;
    duplicate_phones: number;
    auto_linked: number;
    pending_manual: number;
  } | null;
  onDryRun: () => void;
  onApply: () => void;
  onFetchReport: () => void;
  scanning: boolean;
}

export function BackfillPanel({ backfillResult, preReport, onDryRun, onApply, onFetchReport, scanning }: BackfillPanelProps) {
  return (
    <div className="space-y-4">
      {/* Actions */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Backfill Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" size="sm" onClick={onDryRun} disabled={scanning}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Dry Run (Preview)
            </Button>
            <Button variant="default" size="sm" onClick={onApply} disabled={scanning || !backfillResult || backfillResult.mode !== "dry_run"}>
              <Play className="h-3.5 w-3.5 mr-1.5" />
              Apply Backfill
            </Button>
            <Button variant="secondary" size="sm" onClick={onFetchReport} disabled={scanning}>
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Generate Report
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Dry run previews changes without applying. Low-confidence matches are always sent to manual review.
          </p>
        </CardContent>
      </Card>

      {/* Backfill Results */}
      {backfillResult && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Backfill Results ({backfillResult.mode === "dry_run" ? "Preview" : "Applied"})
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="default" className="text-[10px]">{backfillResult.total_matched} matched</Badge>
                <Badge variant="secondary" className="text-[10px]">{backfillResult.total_unmatched} unmatched</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {backfillResult.details.length > 0 ? (
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Table</TableHead>
                      <TableHead className="text-xs">Record</TableHead>
                      <TableHead className="text-xs">Method</TableHead>
                      <TableHead className="text-xs">Confidence</TableHead>
                      <TableHead className="text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backfillResult.details.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs capitalize">{(d.source_table || "").replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-xs font-mono">{(d.source_record_id || "").slice(0, 8)}</TableCell>
                        <TableCell className="text-xs">{d.match_method}</TableCell>
                        <TableCell>
                          <Badge variant={d.confidence === "high" ? "default" : d.confidence === "medium" ? "secondary" : "destructive"} className="text-[10px]">
                            {d.confidence}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{d.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No records to backfill</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pre-Constraint Report */}
      {preReport && (
        <Card className="rounded-xl border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Pre-Constraint Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{preReport.auto_linked}</p>
                <p className="text-xs text-muted-foreground">Auto-Linked</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-destructive">{preReport.pending_manual}</p>
                <p className="text-xs text-muted-foreground">Pending Manual</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{preReport.duplicate_emails}</p>
                <p className="text-xs text-muted-foreground">Email Duplicates</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">{preReport.duplicate_phones}</p>
                <p className="text-xs text-muted-foreground">Phone Duplicates</p>
              </div>
            </div>
            {Object.keys(preReport.unmatched_by_table).length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2">Unmatched by Table</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preReport.unmatched_by_table).sort((a, b) => b[1] - a[1]).map(([table, count]) => (
                    <Badge key={table} variant="outline" className="text-xs capitalize">
                      {table.replace(/_/g, " ")}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
