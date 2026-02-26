import { useState } from "react";
import { useReleases } from "@/hooks/useReleases";
import { useSystemMonitoring } from "@/hooks/useSystemMonitoring";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Rocket, Flag } from "lucide-react";

const ENVS = ["DEV", "STAGING", "PROD"];
const REL_STATUSES = ["PLANNED", "DEPLOYED", "ROLLED_BACK"];

const ReleasesPage = () => {
  const { releases, loading, create, updateStatus } = useReleases();
  const { featureFlags, toggleFeatureFlag, addFeatureFlag } = useSystemMonitoring();
  const [rOpen, setROpen] = useState(false);
  const [fOpen, setFOpen] = useState(false);
  const [rForm, setRForm] = useState({ version: "", environment: "DEV" });
  const [fForm, setFForm] = useState({ flag_key: "", scope_level: "PLATFORM", enabled: false });

  const handleCreateRelease = async () => {
    const ok = await create({ version: rForm.version, environment: rForm.environment });
    if (ok) { setROpen(false); setRForm({ version: "", environment: "DEV" }); }
  };

  const handleCreateFlag = async () => {
    const ok = await addFeatureFlag({ flag_key: fForm.flag_key, scope_level: fForm.scope_level, enabled: fForm.enabled });
    if (ok) { setFOpen(false); setFForm({ flag_key: "", scope_level: "PLATFORM", enabled: false }); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Release Center</h1><p className="text-muted-foreground">Version management & feature flags</p></div>
        <div className="flex gap-2">
          <Dialog open={rOpen} onOpenChange={setROpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Release</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Release</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Version (e.g. 1.0.0)" value={rForm.version} onChange={e => setRForm(p => ({ ...p, version: e.target.value }))} />
                <Select value={rForm.environment} onValueChange={v => setRForm(p => ({ ...p, environment: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ENVS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={handleCreateRelease} disabled={!rForm.version} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={fOpen} onOpenChange={setFOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Feature Flag</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Feature Flag</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="Flag key (e.g. ai_autonomous_mode)" value={fForm.flag_key} onChange={e => setFForm(p => ({ ...p, flag_key: e.target.value }))} />
                <Select value={fForm.scope_level} onValueChange={v => setFForm(p => ({ ...p, scope_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="PLATFORM">Platform</SelectItem><SelectItem value="TENANT">Tenant</SelectItem></SelectContent>
                </Select>
                <Button onClick={handleCreateFlag} disabled={!fForm.flag_key} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardContent className="pt-6 flex items-center gap-4"><Rocket className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Releases</p><p className="text-2xl font-bold">{releases.length}</p></div></CardContent></Card>
        <Card><CardContent className="pt-6 flex items-center gap-4"><Flag className="h-8 w-8 text-accent" /><div><p className="text-sm text-muted-foreground">Feature Flags</p><p className="text-2xl font-bold">{featureFlags.length}</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="releases">
        <TabsList><TabsTrigger value="releases">Releases</TabsTrigger><TabsTrigger value="flags">Feature Flags</TabsTrigger></TabsList>
        <TabsContent value="releases" className="space-y-3 mt-4">
          {loading ? <div className="flex justify-center py-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div> :
            releases.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No releases yet.</CardContent></Card> :
            releases.map(r => (
              <Card key={r.id}><CardContent className="flex items-center justify-between py-4">
                <div>
                  <div className="flex items-center gap-2"><p className="font-medium">v{r.version}</p><Badge variant="outline">{r.environment}</Badge></div>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <Select value={r.status} onValueChange={v => updateStatus(r.id, v)}>
                  <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{REL_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </CardContent></Card>
            ))
          }
        </TabsContent>
        <TabsContent value="flags" className="space-y-3 mt-4">
          {featureFlags.length === 0 ? <Card><CardContent className="py-8 text-center text-muted-foreground">No feature flags yet.</CardContent></Card> :
            featureFlags.map(f => (
              <Card key={f.id}><CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium font-mono text-sm">{f.flag_key}</p>
                  <Badge variant="outline" className="mt-1">{f.scope_level}</Badge>
                </div>
                <Switch checked={f.enabled} onCheckedChange={v => toggleFeatureFlag(f.id, v)} />
              </CardContent></Card>
            ))
          }
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReleasesPage;
