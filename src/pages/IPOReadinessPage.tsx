import { useState } from "react";
import { useIPOReadiness } from "@/hooks/useIPOReadiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, Plus, CheckCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const IPOReadinessPage = () => {
  const { assessments, loading, assess } = useIPOReadiness();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ governance_score: "", revenue_stability_score: "", audit_compliance_score: "", scalability_score: "", board_independence_score: "" });

  const handleAssess = async () => {
    const ok = await assess({
      governance_score: Number(form.governance_score),
      revenue_stability_score: Number(form.revenue_stability_score),
      audit_compliance_score: Number(form.audit_compliance_score),
      scalability_score: Number(form.scalability_score),
      board_independence_score: Number(form.board_independence_score),
    });
    if (ok) { setOpen(false); setForm({ governance_score: "", revenue_stability_score: "", audit_compliance_score: "", scalability_score: "", board_independence_score: "" }); }
  };

  const latest = assessments[0];
  const readinessColor = (score: number) => score >= 80 ? "text-accent" : score >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">IPO Readiness</h1><p className="text-muted-foreground">Public company readiness simulation</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Assessment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>IPO Readiness Assessment</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input type="number" placeholder="Governance (0-100)" value={form.governance_score} onChange={e => setForm(p => ({ ...p, governance_score: e.target.value }))} />
              <Input type="number" placeholder="Revenue Stability (0-100)" value={form.revenue_stability_score} onChange={e => setForm(p => ({ ...p, revenue_stability_score: e.target.value }))} />
              <Input type="number" placeholder="Audit Compliance (0-100)" value={form.audit_compliance_score} onChange={e => setForm(p => ({ ...p, audit_compliance_score: e.target.value }))} />
              <Input type="number" placeholder="Scalability (0-100)" value={form.scalability_score} onChange={e => setForm(p => ({ ...p, scalability_score: e.target.value }))} />
              <Input type="number" placeholder="Board Independence (0-100)" value={form.board_independence_score} onChange={e => setForm(p => ({ ...p, board_independence_score: e.target.value }))} />
              <Button onClick={handleAssess} className="w-full">Submit Assessment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {latest && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">
            {latest.overall_readiness_score >= 80 ? <CheckCircle className="h-5 w-5 text-accent" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
            Overall Readiness: <span className={readinessColor(latest.overall_readiness_score)}>{latest.overall_readiness_score}%</span>
          </CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Governance", value: latest.governance_score },
              { label: "Revenue Stability", value: latest.revenue_stability_score },
              { label: "Audit Compliance", value: latest.audit_compliance_score },
              { label: "Scalability", value: latest.scalability_score },
              { label: "Board Independence", value: latest.board_independence_score },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{item.label}</span><span className={readinessColor(item.value)}>{item.value}%</span></div>
                <Progress value={item.value} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
        assessments.length <= 1 ? null :
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Assessment History</h2>
          {assessments.slice(1).map(a => (
            <Card key={a.id}><CardContent className="flex items-center justify-between py-4">
              <span className="text-sm text-muted-foreground">{new Date(a.assessed_at).toLocaleDateString()}</span>
              <Badge variant={a.overall_readiness_score >= 80 ? "default" : "secondary"}>{a.overall_readiness_score}% Ready</Badge>
            </CardContent></Card>
          ))}
        </div>
      }
    </div>
  );
};

export default IPOReadinessPage;
