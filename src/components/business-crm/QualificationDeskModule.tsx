import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { calculateLeadScore } from "./lead-engine/LeadEngineTypes";
import {
  Filter, CheckCircle, XCircle, Clock, Zap, Phone,
  DollarSign, MapPin, Calendar, ArrowRight,
} from "lucide-react";

export function QualificationDeskModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const bid = profile?.business_id;

  const { data: leads = [] } = useQuery({
    queryKey: ["qual-desk-leads", bid],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("business_id", bid!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid,
  });

  const pending = leads.filter((l: any) => l.qualification_status === "pending" || !l.qualification_status);
  const qualified = leads.filter((l: any) => l.qualification_status === "qualified");
  const disqualified = leads.filter((l: any) => l.qualification_status === "disqualified" || l.stage === "invalid");
  const contacted = leads.filter((l: any) => l.stage === "contacted");

  const stats = [
    { label: "Pending Qualification", value: pending.length, icon: Clock, color: "text-primary" },
    { label: "Contacted", value: contacted.length, icon: Phone, color: "text-blue-500" },
    { label: "Qualified", value: qualified.length, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Disqualified", value: disqualified.length, icon: XCircle, color: "text-destructive" },
  ];

  const handleQualify = async (id: string) => {
    const lead = leads.find((l: any) => l.id === id);
    if (!lead) return;
    const { score, temperature } = calculateLeadScore(lead);
    await supabase.from("crm_leads").update({
      qualification_status: "qualified",
      stage: "qualified",
      lead_score: score,
      lead_temperature: temperature,
      auto_scored: true,
      updated_at: new Date().toISOString(),
    } as any).eq("id", id);
    toast.success(`Qualified → ${temperature.toUpperCase()} (${score}pts)`);
    qc.invalidateQueries({ queryKey: ["qual-desk-leads"] });
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  const handleDisqualify = async (id: string) => {
    await supabase.from("crm_leads").update({
      qualification_status: "disqualified",
      stage: "disqualified",
      updated_at: new Date().toISOString(),
    } as any).eq("id", id);
    toast.success("Lead disqualified");
    qc.invalidateQueries({ queryKey: ["qual-desk-leads"] });
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  const handleBulkScore = async () => {
    let count = 0;
    for (const lead of pending) {
      const { score, temperature } = calculateLeadScore(lead as any);
      await supabase.from("crm_leads").update({
        lead_score: score,
        lead_temperature: temperature,
        auto_scored: true,
        updated_at: new Date().toISOString(),
      } as any).eq("id", lead.id);
      count++;
    }
    toast.success(`${count} leads auto-scored`);
    qc.invalidateQueries({ queryKey: ["qual-desk-leads"] });
    qc.invalidateQueries({ queryKey: ["crm-leads"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Qualification Desk</h2>
          <p className="text-xs text-muted-foreground">Score, qualify, and route incoming leads</p>
        </div>
        {pending.length > 0 && (
          <Button size="sm" onClick={handleBulkScore} className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />Auto-Score All ({pending.length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10"><Icon className={`h-4 w-4 ${s.color}`} /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Leads Pending Qualification</CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">All leads have been qualified ✓</p>
          ) : (
            <div className="space-y-2">
              {pending.slice(0, 15).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-border bg-secondary/20">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{l.full_name}</p>
                      {l.lead_score > 0 && (
                        <Badge variant="secondary" className="text-[10px]">{l.lead_score}pts</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                      {l.mobile && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{l.mobile}</span>}
                      {l.budget_range && <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{l.budget_range}</span>}
                      {(l.city || l.state) && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{[l.city, l.state].filter(Boolean).join(", ")}</span>}
                      {l.investment_timeline && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{l.investment_timeline}</span>}
                      <span>{l.source || "Unknown source"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3">
                    <Button size="sm" variant="destructive" className="h-7 text-xs px-2" onClick={() => handleDisqualify(l.id)}>
                      <XCircle className="h-3 w-3 mr-0.5" />DQ
                    </Button>
                    <Button size="sm" className="h-7 text-xs px-2 gap-1" onClick={() => handleQualify(l.id)}>
                      <CheckCircle className="h-3 w-3" />Qualify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recently Qualified */}
      {qualified.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-500 flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />Recently Qualified ({qualified.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {qualified.slice(0, 8).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between py-1.5 px-3 rounded border border-border">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground">{l.full_name}</p>
                    <Badge className={`text-[10px] border ${
                      l.lead_temperature === "hot" ? "bg-red-500/10 text-red-500 border-red-500/30" :
                      l.lead_temperature === "warm" ? "bg-orange-500/10 text-orange-500 border-orange-500/30" :
                      "bg-muted text-muted-foreground border-border"
                    }`}>
                      {(l.lead_temperature || "cold").toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{l.lead_score || 0} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
