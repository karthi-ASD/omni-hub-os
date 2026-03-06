import { useState } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThumbsUp, MessageSquare, Star, Plus, BarChart3, TrendingUp } from "lucide-react";
import { useSatisfactionSurveys, useSurveyResponses } from "@/hooks/useSatisfactionSurveys";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SatisfactionSurveysPage = () => {
  usePageTitle("Satisfaction Surveys");
  const { surveys, loading, create } = useSatisfactionSurveys();
  const { responses, loading: respLoading } = useSurveyResponses();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", survey_type: "csat", trigger_event: "ticket_resolved" });

  const handleCreate = async () => {
    if (!form.name) return;
    await create(form);
    toast({ title: "Survey created" });
    setOpen(false);
    setForm({ name: "", survey_type: "csat", trigger_event: "ticket_resolved" });
  };

  const avgScore = responses.length > 0
    ? (responses.reduce((s: number, r: any) => s + (r.score || 0), 0) / responses.length).toFixed(1)
    : "—";

  // NPS calculation
  const npsResponses = responses.filter((r: any) => r.score !== null);
  const promoters = npsResponses.filter((r: any) => r.score >= 4).length;
  const detractors = npsResponses.filter((r: any) => r.score <= 2).length;
  const nps = npsResponses.length > 0
    ? Math.round(((promoters - detractors) / npsResponses.length) * 100)
    : null;

  // Score distribution
  const scoreDistribution = [1, 2, 3, 4, 5].map(score => ({
    score: `${score}★`,
    count: responses.filter((r: any) => r.score === score).length,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center">
            <ThumbsUp className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Satisfaction Surveys</h1>
            <p className="text-xs text-muted-foreground">CSAT, NPS, and customer feedback</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Survey</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Survey</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.survey_type} onValueChange={v => setForm(f => ({ ...f, survey_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csat">CSAT</SelectItem>
                    <SelectItem value="nps">NPS</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Auto-Trigger</Label>
                <Select value={form.trigger_event} onValueChange={v => setForm(f => ({ ...f, trigger_event: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ticket_resolved">Ticket Resolved</SelectItem>
                    <SelectItem value="ticket_closed">Ticket Closed</SelectItem>
                    <SelectItem value="project_complete">Project Complete</SelectItem>
                    <SelectItem value="onboarding">Onboarding Complete</SelectItem>
                    <SelectItem value="manual">Manual Send</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Create Survey</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          {loading ? <Skeleton className="h-5 w-10 mx-auto" /> : <p className="text-lg font-bold text-foreground">{avgScore}</p>}
          <p className="text-[9px] text-muted-foreground">Avg Score</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-primary">{responses.length}</p>
          <p className="text-[9px] text-muted-foreground">Responses</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{nps !== null ? nps : "—"}</p>
          <p className="text-[9px] text-muted-foreground">NPS Score</p>
        </CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{surveys.length}</p>
          <p className="text-[9px] text-muted-foreground">Surveys</p>
        </CardContent></Card>
      </div>

      {/* Score Distribution Chart */}
      {responses.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Score Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={scoreDistribution}>
                <XAxis dataKey="score" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="surveys">
        <TabsList className="w-full grid grid-cols-2 h-8">
          <TabsTrigger value="surveys" className="text-xs">Surveys</TabsTrigger>
          <TabsTrigger value="feedback" className="text-xs">Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="surveys" className="mt-3">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : surveys.length === 0 ? (
                <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No surveys yet</p></div>
              ) : (
                <div className="divide-y divide-border">
                  {surveys.map((s: any) => (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.survey_type?.toUpperCase()} · Auto-trigger: {s.trigger_event}</p>
                      </div>
                      <Badge className={`text-[10px] border-0 ${s.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Recent Feedback</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {respLoading ? (
                <div className="p-4 space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
              ) : responses.length === 0 ? (
                <div className="p-8 text-center"><p className="text-sm text-muted-foreground">No feedback yet</p></div>
              ) : (
                <div className="divide-y divide-border">
                  {responses.slice(0, 10).map((f: any) => (
                    <div key={f.id} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{f.customer_name || f.customer_email || "Anonymous"}</span>
                        {f.score && <span className="text-warning text-xs">{"★".repeat(f.score)}{"☆".repeat(5 - f.score)}</span>}
                      </div>
                      {f.comment && <p className="text-[11px] text-muted-foreground">{f.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SatisfactionSurveysPage;
