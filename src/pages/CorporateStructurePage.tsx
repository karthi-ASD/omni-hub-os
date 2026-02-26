import { useState } from "react";
import { useCorporateEntities } from "@/hooks/useCorporateEntities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Trash2, GitBranch } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const ENTITY_TYPES = ["HOLDING", "OPERATING", "SUBSIDIARY", "REGION"];

const CorporateStructurePage = () => {
  const { entities, loading, create, remove } = useCorporateEntities();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ entity_name: "", entity_type: "OPERATING", jurisdiction: "" });

  const handleCreate = async () => {
    const ok = await create({ ...form, jurisdiction: form.jurisdiction || undefined });
    if (ok) { setOpen(false); setForm({ entity_name: "", entity_type: "OPERATING", jurisdiction: "" }); }
  };

  const typeColor = (t: string) => {
    if (t === "HOLDING") return "default";
    if (t === "SUBSIDIARY") return "secondary";
    if (t === "REGION") return "outline";
    return "default";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Corporate Structure</h1>
          <p className="text-muted-foreground">Model your multi-entity holding structure</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Entity</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Corporate Entity</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Entity name" value={form.entity_name} onChange={e => setForm(p => ({ ...p, entity_name: e.target.value }))} />
              <Select value={form.entity_type} onValueChange={v => setForm(p => ({ ...p, entity_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ENTITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Jurisdiction (e.g. US-DE, AU-NSW)" value={form.jurisdiction} onChange={e => setForm(p => ({ ...p, jurisdiction: e.target.value }))} />
              <Button onClick={handleCreate} disabled={!form.entity_name} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : entities.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No entities yet. Create your first holding company.</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {entities.map(e => (
            <Card key={e.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  {e.entity_type === "HOLDING" ? <GitBranch className="h-5 w-5 text-primary" /> : <Building2 className="h-5 w-5 text-muted-foreground" />}
                  <CardTitle className="text-base">{e.entity_name}</CardTitle>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge variant={typeColor(e.entity_type) as any}>{e.entity_type}</Badge>
                {e.jurisdiction && <p className="text-sm text-muted-foreground">Jurisdiction: {e.jurisdiction}</p>}
                {e.tax_structure_notes && <p className="text-xs text-muted-foreground">{e.tax_structure_notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CorporateStructurePage;
