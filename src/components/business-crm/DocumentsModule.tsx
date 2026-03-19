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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const DOC_CATEGORIES = [
  "investor_id", "eoi", "deposit_receipt", "contract", "finance_document",
  "smsf_document", "entity_document", "tax_advice", "brochure", "floorplan",
  "partner_document", "settlement_document", "general",
];

export function DocumentsModule() {
  const { profile } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const [form, setForm] = useState({ title: "", category: "general", file_url: "", uploaded_by: "", expiry_date: "", notes: "" });

  const { data: docs = [] } = useQuery({
    queryKey: ["crm-documents", profile?.business_id],
    queryFn: async () => { const { data } = await supabase.from("crm_documents").select("*").eq("business_id", profile!.business_id!).order("created_at", { ascending: false }); return data || []; },
    enabled: !!profile?.business_id,
  });

  const filtered = docs.filter((d: any) => {
    if (filterCat !== "all" && d.category !== filterCat) return false;
    if (search) return d.title.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title required"); return; }
    const { error } = await supabase.from("crm_documents").insert({ business_id: profile!.business_id!, ...form, expiry_date: form.expiry_date || null } as any);
    if (error) { toast.error("Failed"); return; }
    toast.success("Document added"); setOpen(false);
    setForm({ title: "", category: "general", file_url: "", uploaded_by: "", expiry_date: "", notes: "" });
    qc.invalidateQueries({ queryKey: ["crm-documents"] });
  };

  const catCounts: Record<string, number> = {};
  docs.forEach((d: any) => { catCounts[d.category] = (catCounts[d.category] || 0) + 1; });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Badge variant={filterCat === "all" ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilterCat("all")}>All ({docs.length})</Badge>
        {DOC_CATEGORIES.filter(c => catCounts[c]).map(c => (
          <Badge key={c} variant={filterCat === c ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilterCat(c)}>{c.replace(/_/g, " ")} ({catCounts[c]})</Badge>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" /></div>
        <Button onClick={() => setOpen(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />Add Document</Button>
      </div>

      <Card className="bg-card border-border"><Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead>Uploaded</TableHead><TableHead>By</TableHead><TableHead>Status</TableHead><TableHead>Expiry</TableHead></TableRow></TableHeader><TableBody>
        {filtered.map((d: any) => (
          <TableRow key={d.id}>
            <TableCell className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d.title}</TableCell>
            <TableCell><Badge variant="outline" className="text-[10px] capitalize">{d.category.replace(/_/g, " ")}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground">{format(new Date(d.created_at), "dd MMM yyyy")}</TableCell>
            <TableCell className="text-xs">{d.uploaded_by || "—"}</TableCell>
            <TableCell><Badge variant={d.status === "active" ? "default" : "secondary"} className="text-[10px]">{d.status}</Badge></TableCell>
            <TableCell className="text-xs text-muted-foreground">{d.expiry_date ? format(new Date(d.expiry_date), "dd MMM yyyy") : "—"}</TableCell>
          </TableRow>
        ))}
        {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No documents found</TableCell></TableRow>}
      </TableBody></Table></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Add Document</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div><Label className="text-xs">Category</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DOC_CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">File URL</Label><Input value={form.file_url} onChange={e => setForm(f => ({ ...f, file_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Uploaded By</Label><Input value={form.uploaded_by} onChange={e => setForm(f => ({ ...f, uploaded_by: e.target.value }))} /></div>
              <div><Label className="text-xs">Expiry Date</Label><Input type="date" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
            <Button onClick={handleSave} className="w-full">Add Document</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
