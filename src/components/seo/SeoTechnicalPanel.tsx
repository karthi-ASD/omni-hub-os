import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Shield, Globe, FileCode, LinkIcon, AlertTriangle,
  Smartphone, Gauge, Lock, CheckCircle,
} from "lucide-react";
import { useState } from "react";
import type { SeoTechnicalAudit } from "@/hooks/useSeoTechnical";

interface Props {
  audit: SeoTechnicalAudit | null;
  loading: boolean;
  onSave: (data: any) => Promise<void>;
}

export function SeoTechnicalPanel({ audit, loading, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    desktop_speed: 0, mobile_speed: 0, ssl_active: false,
    sitemap_submitted: false, robots_txt_checked: false,
    schema_added: false, broken_links_count: 0, notes: "",
  });

  if (loading) return <Skeleton className="h-48 w-full" />;

  const startEdit = () => {
    if (audit) {
      setForm({
        desktop_speed: audit.desktop_speed ?? 0,
        mobile_speed: audit.mobile_speed ?? 0,
        ssl_active: audit.ssl_active,
        sitemap_submitted: audit.sitemap_submitted,
        robots_txt_checked: audit.robots_txt_checked,
        schema_added: audit.schema_added,
        broken_links_count: audit.broken_links_count,
        notes: audit.notes || "",
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    await onSave({ ...form, last_audit_date: new Date().toISOString().split("T")[0] });
    setEditing(false);
  };

  // Checklist items
  const checks = audit ? [
    { label: "SSL Certificate", ok: audit.ssl_active, icon: Lock },
    { label: "Sitemap Submitted", ok: audit.sitemap_submitted, icon: FileCode },
    { label: "Robots.txt Checked", ok: audit.robots_txt_checked, icon: FileCode },
    { label: "Schema Markup", ok: audit.schema_added, icon: Globe },
  ] : [];

  const passedChecks = checks.filter(c => c.ok).length;
  const healthPct = checks.length > 0 ? Math.round((passedChecks / checks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Technical SEO</h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            {audit ? "Edit Audit" : "Add Audit Data"}
          </Button>
        )}
      </div>

      {editing ? (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Desktop Speed Score</Label>
                <Input type="number" min={0} max={100} value={form.desktop_speed} onChange={e => setForm({ ...form, desktop_speed: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Mobile Speed Score</Label>
                <Input type="number" min={0} max={100} value={form.mobile_speed} onChange={e => setForm({ ...form, mobile_speed: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.ssl_active} onCheckedChange={v => setForm({ ...form, ssl_active: v })} /><Label>SSL Active</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.sitemap_submitted} onCheckedChange={v => setForm({ ...form, sitemap_submitted: v })} /><Label>Sitemap Submitted</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.robots_txt_checked} onCheckedChange={v => setForm({ ...form, robots_txt_checked: v })} /><Label>Robots.txt Checked</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.schema_added} onCheckedChange={v => setForm({ ...form, schema_added: v })} /><Label>Schema Added</Label></div>
            </div>
            <div>
              <Label>Broken Links Count</Label>
              <Input type="number" value={form.broken_links_count} onChange={e => setForm({ ...form, broken_links_count: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave}>Save Audit</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : audit ? (
        <>
          {/* Speed Scores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Desktop Speed" value={audit.desktop_speed ?? "—"} icon={Gauge} gradient="from-primary to-accent" alert={(audit.desktop_speed ?? 0) < 50} />
            <StatCard label="Mobile Speed" value={audit.mobile_speed ?? "—"} icon={Smartphone} gradient="from-info to-blue-500" alert={(audit.mobile_speed ?? 0) < 50} />
            <StatCard label="Broken Links" value={audit.broken_links_count} icon={LinkIcon} gradient="from-destructive to-red-500" alert={audit.broken_links_count > 0} />
            <StatCard label="Health Check" value={`${healthPct}%`} icon={Shield} gradient="from-success to-emerald-500" />
          </div>

          {/* Technical Checklist */}
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Technical Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {checks.map(check => (
                  <div key={check.label} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl",
                    check.ok ? "bg-success/10" : "bg-destructive/10",
                  )}>
                    {check.ok ? (
                      <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{check.label}</p>
                      <p className="text-xs text-muted-foreground">{check.ok ? "Passed" : "Failed"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Last audit info */}
          {audit.notes && (
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{audit.notes}</p>
              </CardContent>
            </Card>
          )}

          <p className="text-xs text-muted-foreground">
            Last audit: {audit.last_audit_date || "Never"}
          </p>
        </>
      ) : (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No technical audit data</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Click "Add Audit Data" to record technical SEO findings</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
