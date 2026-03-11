import { useAIReports } from "@/hooks/useAIReports";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText, Sparkles, Loader2, Trash2, Calendar, Clock, Eye,
  BarChart3, TrendingUp, Users, DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const AIReportsPage = () => {
  usePageTitle("AI Reports");
  const { reports, loading, generating, generateReport, deleteReport } = useAIReports();

  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [period, setPeriod] = useState(defaultPeriod);
  const [viewReport, setViewReport] = useState<any>(null);

  const handleGenerate = async () => {
    const report = await generateReport(period);
    if (report) setViewReport(report);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Reports</h1>
          <p className="text-muted-foreground">
            AI-generated business performance summaries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Period</Label>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-44"
            />
          </div>
          <Button onClick={handleGenerate} disabled={generating || !period} className="mt-5">
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            Generate Report
          </Button>
        </div>
      </div>

      {/* Reports list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="font-medium text-muted-foreground">No reports yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select a month and click "Generate Report" to create your first AI summary
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => {
            const snapshot = report.data_snapshot_json || {};
            return (
              <Card key={report.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            {format(new Date(report.report_period + "-01"), "MMMM yyyy")} Report
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {report.report_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(report.created_at), "dd MMM yyyy HH:mm")}
                          </span>
                          {snapshot.analytics && (
                            <>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {snapshot.analytics.totalUsers} users
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {snapshot.analytics.totalGscClicks} clicks
                              </span>
                            </>
                          )}
                          {snapshot.revenue && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${snapshot.revenue.totalRevenue?.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Report Dialog */}
      <Dialog open={!!viewReport} onOpenChange={(o) => { if (!o) setViewReport(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewReport && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {format(new Date(viewReport.report_period + "-01"), "MMMM yyyy")} Report
                </DialogTitle>
              </DialogHeader>

              {/* Data snapshot summary */}
              {viewReport.data_snapshot_json && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Sessions", value: viewReport.data_snapshot_json.analytics?.totalSessions, icon: BarChart3 },
                    { label: "Users", value: viewReport.data_snapshot_json.analytics?.totalUsers, icon: Users },
                    { label: "Leads", value: viewReport.data_snapshot_json.leads?.totalFactLeads, icon: TrendingUp },
                    { label: "Revenue", value: `$${viewReport.data_snapshot_json.revenue?.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="p-3 bg-muted/50 rounded-lg text-center">
                      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold">{value || 0}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* AI Summary rendered as prose */}
              <div className="prose prose-sm dark:prose-invert max-w-none mt-4">
                {viewReport.summary_text?.split("\n").map((line: string, i: number) => {
                  if (!line.trim()) return <br key={i} />;
                  if (line.startsWith("# ")) return <h1 key={i} className="text-lg font-bold mt-4">{line.slice(2)}</h1>;
                  if (line.startsWith("## ")) return <h2 key={i} className="text-base font-semibold mt-3">{line.slice(3)}</h2>;
                  if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold mt-2">{line.slice(4)}</h3>;
                  if (line.startsWith("- ") || line.startsWith("* ")) {
                    return (
                      <div key={i} className="flex gap-2 ml-2 my-0.5">
                        <span className="text-primary mt-1">•</span>
                        <span>{line.slice(2)}</span>
                      </div>
                    );
                  }
                  if (/^\d+\.\s/.test(line)) {
                    const match = line.match(/^(\d+)\.\s(.*)$/);
                    return (
                      <div key={i} className="flex gap-2 ml-2 my-0.5">
                        <span className="font-semibold text-primary">{match?.[1]}.</span>
                        <span>{match?.[2]}</span>
                      </div>
                    );
                  }
                  // Bold text
                  const rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                  return <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: rendered }} />;
                })}
              </div>

              <Separator className="mt-4" />
              <p className="text-xs text-muted-foreground text-center">
                Generated by {viewReport.model_used || "AI"} on{" "}
                {format(new Date(viewReport.created_at), "dd MMM yyyy 'at' HH:mm")}
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIReportsPage;
