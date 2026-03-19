import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Landmark, Building2, Star } from "lucide-react";
import { toast } from "sonner";

export function ProjectsDevelopersModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [projOpen, setProjOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [projForm, setProjForm] = useState({ project_name: "", developer_name: "", category: "residential", state: "", suburb: "", stage: "planning", price_band: "", stock_count: "", priority_rating: "medium", summary: "", commission_notes: "" });
  const [devForm, setDevForm] = useState({ developer_name: "", contact_person: "", business_type: "", email: "", phone: "", years_active: "", collaboration_type: "", trust_rating: "3", notes: "" });

  const { data: projects = [] } = useQuery({
    queryKey: ["crm-projects", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_projects").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false }); return data || []; },
    enabled: !!profile?.business_id,
  });
  const { data: developers = [] } = useQuery({
    queryKey: ["crm-developers", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_developers").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false }); return data || []; },
    enabled: !!profile?.business_id,
  });

  const saveProject = async () => {
    if (!projForm.project_name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("crm_projects").insert({ business_id: profile!.business_id!, ...projForm, stock_count: projForm.stock_count ? Number(projForm.stock_count) : null } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Project added"); setProjOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-projects"] });
  };
  const saveDev = async () => {
    if (!devForm.developer_name.trim()) { toast.error("Name required"); return; }
    const { error } = await supabase.from("crm_developers").insert({ business_id: profile!.business_id!, ...devForm, years_active: devForm.years_active ? Number(devForm.years_active) : null, trust_rating: Number(devForm.trust_rating) } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Developer added"); setDevOpen(false);
    qc.invalidateQueries({ queryKey: ["crm-developers"] });
  };

  const STAGE_COLORS: Record<string, string> = { planning: "bg-blue-500/10 text-blue-500", launched: "bg-green-500/10 text-green-500", selling: "bg-amber-500/10 text-amber-500", construction: "bg-purple-500/10 text-purple-500", completed: "bg-zinc-500/10 text-zinc-400" };

  return (
    <div className="space-y-5">
      <Tabs defaultValue="projects">
        <TabsList className="bg-card border border-border"><TabsTrigger value="projects" className="gap-1.5 text-xs"><Landmark className="h-3.5 w-3.5" />Projects ({projects.length})</TabsTrigger><TabsTrigger value="developers" className="gap-1.5 text-xs"><Building2 className="h-3.5 w-3.5" />Developers ({developers.length})</TabsTrigger></TabsList>

        <TabsContent value="projects" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
            <Button onClick={() => setProjOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Project</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.filter((p: any) => !search || p.project_name.toLowerCase().includes(search.toLowerCase())).map((p: any) => (
              <Card key={p.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between"><p className="font-semibold text-sm text-foreground">{p.project_name}</p><Badge className={`text-[10px] ${STAGE_COLORS[p.stage] || ""}`}>{p.stage}</Badge></div>
                  {p.developer_name && <p className="text-xs text-muted-foreground">{p.developer_name}</p>}
                  <div className="flex gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                    {p.suburb && <Badge variant="secondary" className="text-[10px]">{p.suburb}{p.state ? `, ${p.state}` : ""}</Badge>}
                    <Badge variant="secondary" className="text-[10px]">{p.priority_rating} priority</Badge>
                  </div>
                  {p.price_band && <p className="text-xs text-muted-foreground">Price: {p.price_band}</p>}
                  {p.stock_count && <p className="text-xs text-muted-foreground">Stock: {p.stock_count} units</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="developers" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search developers..." className="pl-9 bg-card" /></div>
            <Button onClick={() => setDevOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Developer</Button>
          </div>
          <Card className="bg-card border-border"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Contact</TableHead><TableHead>Type</TableHead><TableHead>Years Active</TableHead><TableHead>Trust</TableHead><TableHead>Projects</TableHead></TableRow></TableHeader><TableBody>
            {developers.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.developer_name}</TableCell>
                <TableCell className="text-xs">{d.contact_person || "—"}<br/>{d.email || ""}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{d.business_type || "—"}</Badge></TableCell>
                <TableCell>{d.years_active || "—"}</TableCell>
                <TableCell><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < (d.trust_rating || 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />)}</div></TableCell>
                <TableCell className="text-xs">{d.active_project_count || 0} active / {d.past_project_count || 0} past</TableCell>
              </TableRow>
            ))}
            {developers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No developers</TableCell></TableRow>}
          </TableBody></Table></Card>
        </TabsContent>
      </Tabs>

      {/* Add Project Dialog */}
      <Dialog open={projOpen} onOpenChange={setProjOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Add Project</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Project Name *</Label><Input value={projForm.project_name} onChange={e => setProjForm(f => ({ ...f, project_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Developer</Label><Input value={projForm.developer_name} onChange={e => setProjForm(f => ({ ...f, developer_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Category</Label><Select value={projForm.category} onValueChange={v => setProjForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="residential">Residential</SelectItem><SelectItem value="commercial">Commercial</SelectItem><SelectItem value="industrial">Industrial</SelectItem><SelectItem value="mixed_use">Mixed Use</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">State</Label><Input value={projForm.state} onChange={e => setProjForm(f => ({ ...f, state: e.target.value }))} /></div>
              <div><Label className="text-xs">Suburb</Label><Input value={projForm.suburb} onChange={e => setProjForm(f => ({ ...f, suburb: e.target.value }))} /></div>
              <div><Label className="text-xs">Stage</Label><Select value={projForm.stage} onValueChange={v => setProjForm(f => ({ ...f, stage: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planning">Planning</SelectItem><SelectItem value="launched">Launched</SelectItem><SelectItem value="selling">Selling</SelectItem><SelectItem value="construction">Construction</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Price Band</Label><Input value={projForm.price_band} onChange={e => setProjForm(f => ({ ...f, price_band: e.target.value }))} placeholder="e.g. $450K-$600K" /></div>
              <div><Label className="text-xs">Stock Count</Label><Input type="number" value={projForm.stock_count} onChange={e => setProjForm(f => ({ ...f, stock_count: e.target.value }))} /></div>
              <div><Label className="text-xs">Priority</Label><Select value={projForm.priority_rating} onValueChange={v => setProjForm(f => ({ ...f, priority_rating: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">High</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="low">Low</SelectItem></SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Summary</Label><Textarea value={projForm.summary} onChange={e => setProjForm(f => ({ ...f, summary: e.target.value }))} rows={2} /></div>
            <Button onClick={saveProject} className="w-full">Add Project</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Developer Dialog */}
      <Dialog open={devOpen} onOpenChange={setDevOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add Developer</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label className="text-xs">Developer Name *</Label><Input value={devForm.developer_name} onChange={e => setDevForm(f => ({ ...f, developer_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Contact Person</Label><Input value={devForm.contact_person} onChange={e => setDevForm(f => ({ ...f, contact_person: e.target.value }))} /></div>
              <div><Label className="text-xs">Business Type</Label><Input value={devForm.business_type} onChange={e => setDevForm(f => ({ ...f, business_type: e.target.value }))} /></div>
              <div><Label className="text-xs">Email</Label><Input type="email" value={devForm.email} onChange={e => setDevForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={devForm.phone} onChange={e => setDevForm(f => ({ ...f, phone: e.target.value }))} /></div>
              <div><Label className="text-xs">Years Active</Label><Input type="number" value={devForm.years_active} onChange={e => setDevForm(f => ({ ...f, years_active: e.target.value }))} /></div>
              <div><Label className="text-xs">Trust Rating (1-5)</Label><Select value={devForm.trust_rating} onValueChange={v => setDevForm(f => ({ ...f, trust_rating: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} Star{n > 1 ? "s" : ""}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={devForm.notes} onChange={e => setDevForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
            <Button onClick={saveDev} className="w-full">Add Developer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
