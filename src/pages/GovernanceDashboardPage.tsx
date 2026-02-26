import { useGovernance } from "@/hooks/useGovernanceControls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { CheckCircle, XCircle, Merge, Eye, Upload, Download, Palette } from "lucide-react";

const THEME_PRESETS = [
  { name: "Classic Blue", primary: "220 70% 50%", secondary: "210 40% 90%", accent: "200 80% 55%" },
  { name: "Emerald Green", primary: "155 70% 40%", secondary: "150 40% 90%", accent: "160 80% 45%" },
  { name: "Sunset Orange", primary: "25 90% 55%", secondary: "30 50% 92%", accent: "15 85% 50%" },
  { name: "Purple Neon", primary: "270 70% 55%", secondary: "275 40% 92%", accent: "280 80% 60%" },
  { name: "Dark Pro", primary: "220 15% 25%", secondary: "220 10% 15%", accent: "220 60% 55%" },
];

const GovernanceDashboardPage = () => {
  const {
    healthScores, leadScores, duplicates, approvals, importJobs, exportJobs, themeSettings, loading,
    decideApproval, resolveDuplicate, saveTheme,
  } = useGovernance();

  const [selectedTheme, setSelectedTheme] = useState(themeSettings?.theme_name ?? "Classic Blue");

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>;

  const pendingApprovals = approvals.filter(a => a.status === "PENDING");
  const redClients = healthScores.filter(h => h.risk_level === "RED");
  const hotLeads = leadScores.filter(l => l.tier === "HOT");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Governance & Controls</h1>
        <p className="text-muted-foreground">Health scores, lead scoring, approvals, duplicates, import/export & themes</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">At-Risk Clients</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold text-destructive">{redClients.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Hot Leads</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold text-primary">{hotLeads.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Open Duplicates</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{duplicates.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Pending Approvals</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{pendingApprovals.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Imports</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{importJobs.length}</span></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Exports</CardTitle></CardHeader>
          <CardContent><span className="text-2xl font-bold">{exportJobs.length}</span></CardContent></Card>
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="health">Client Health</TabsTrigger>
          <TabsTrigger value="leads">Lead Scores</TabsTrigger>
          <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
          <TabsTrigger value="import-export">Import / Export</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
        </TabsList>

        {/* Approvals */}
        <TabsContent value="approvals">
          <Card>
            <CardHeader><CardTitle>Approval Requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Type</TableHead><TableHead>Entity</TableHead><TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {approvals.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No approval requests</TableCell></TableRow>
                  ) : approvals.map(a => (
                    <TableRow key={a.id}>
                      <TableCell><Badge variant="outline">{a.request_type}</Badge></TableCell>
                      <TableCell>{a.entity_type || "—"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{a.reason || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={a.status === "APPROVED" ? "default" : a.status === "REJECTED" ? "destructive" : "secondary"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {a.status === "PENDING" && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => decideApproval(a.id, "APPROVED")}>
                              <CheckCircle className="h-4 w-4 text-primary" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => decideApproval(a.id, "REJECTED")}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Health */}
        <TabsContent value="health">
          <Card>
            <CardHeader><CardTitle>Client Health Scores</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Client ID</TableHead><TableHead>Score</TableHead><TableHead>Risk</TableHead>
                  <TableHead>Reasons</TableHead><TableHead>Updated</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {healthScores.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No health scores yet</TableCell></TableRow>
                  ) : healthScores.map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="font-medium">{h.client_id}</TableCell>
                      <TableCell><span className="text-lg font-bold">{h.score}</span>/100</TableCell>
                      <TableCell>
                        <Badge variant={h.risk_level === "RED" ? "destructive" : h.risk_level === "AMBER" ? "secondary" : "default"}>
                          {h.risk_level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-muted-foreground">
                        {h.reasons_json ? (Array.isArray(h.reasons_json) ? h.reasons_json.join(", ") : JSON.stringify(h.reasons_json)) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(h.updated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lead Scores */}
        <TabsContent value="leads">
          <Card>
            <CardHeader><CardTitle>Lead Scores</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Lead ID</TableHead><TableHead>Score</TableHead><TableHead>Tier</TableHead>
                  <TableHead>Reasons</TableHead><TableHead>Updated</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {leadScores.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No lead scores yet</TableCell></TableRow>
                  ) : leadScores.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.lead_id}</TableCell>
                      <TableCell><span className="text-lg font-bold">{l.score}</span></TableCell>
                      <TableCell>
                        <Badge variant={l.tier === "HOT" ? "destructive" : l.tier === "WARM" ? "secondary" : "outline"}>
                          {l.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate text-muted-foreground">
                        {l.reasons_json ? (Array.isArray(l.reasons_json) ? l.reasons_json.join(", ") : JSON.stringify(l.reasons_json)) : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{new Date(l.updated_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Duplicates */}
        <TabsContent value="duplicates">
          <Card>
            <CardHeader><CardTitle>Duplicate Candidates</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Type</TableHead><TableHead>Entity</TableHead><TableHead>Match</TableHead>
                  <TableHead>Score</TableHead><TableHead>Reasons</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {duplicates.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No duplicates detected</TableCell></TableRow>
                  ) : duplicates.map(d => (
                    <TableRow key={d.id}>
                      <TableCell><Badge variant="outline">{d.entity_type}</Badge></TableCell>
                      <TableCell className="font-medium">{d.entity_id}</TableCell>
                      <TableCell>{d.candidate_entity_id}</TableCell>
                      <TableCell><Badge variant="secondary">{d.match_score}%</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {d.match_reasons_json ? JSON.stringify(d.match_reasons_json) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => resolveDuplicate(d.id, "MERGED")}>
                            <Merge className="h-4 w-4 text-primary" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => resolveDuplicate(d.id, "IGNORED")}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import / Export */}
        <TabsContent value="import-export">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Import Jobs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Rows</TableHead><TableHead>Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {importJobs.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No imports yet</TableCell></TableRow>
                    ) : importJobs.map(j => (
                      <TableRow key={j.id}>
                        <TableCell><Badge variant="outline">{j.job_type}</Badge></TableCell>
                        <TableCell><Badge variant={j.status === "COMPLETED" ? "default" : "secondary"}>{j.status}</Badge></TableCell>
                        <TableCell>{j.success_rows}/{j.total_rows}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(j.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Download className="h-5 w-5" /> Export Jobs</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {exportJobs.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">No exports yet</TableCell></TableRow>
                    ) : exportJobs.map(j => (
                      <TableRow key={j.id}>
                        <TableCell><Badge variant="outline">{j.export_type}</Badge></TableCell>
                        <TableCell><Badge variant={j.status === "COMPLETED" ? "default" : "secondary"}>{j.status}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{new Date(j.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Themes */}
        <TabsContent value="themes">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Theme Presets</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {THEME_PRESETS.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTheme(t.name)}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      selectedTheme === t.name ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-6 w-6 rounded-full" style={{ background: `hsl(${t.primary})` }} />
                      <div className="h-6 w-6 rounded-full" style={{ background: `hsl(${t.accent})` }} />
                      <div className="h-6 w-6 rounded-full" style={{ background: `hsl(${t.secondary})` }} />
                    </div>
                    <p className="font-medium text-sm">{t.name}</p>
                  </button>
                ))}
              </div>
              <Button onClick={() => {
                const preset = THEME_PRESETS.find(t => t.name === selectedTheme);
                if (preset) saveTheme({ theme_name: preset.name, primary_color: preset.primary, secondary_color: preset.secondary, accent_color: preset.accent });
              }}>
                Save Theme
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GovernanceDashboardPage;
