import { useState } from "react";
import { useCustomFields, MODULE_OPTIONS, FIELD_TYPES } from "@/hooks/useCustomFields";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, GripVertical, Settings2 } from "lucide-react";
import { toast } from "sonner";

export default function CustomFieldBuilderPage() {
  usePageTitle("Custom Field Builder");
  const { fields, loading, createField, updateField, deleteField } = useCustomFields();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    module_name: "",
    field_label: "",
    field_type: "text",
    is_required: false,
    options: "",
  });
  const [filterModule, setFilterModule] = useState("all");

  const resetForm = () => {
    setForm({ module_name: "", field_label: "", field_type: "text", is_required: false, options: "" });
    setEditId(null);
  };

  const handleOpen = (field?: any) => {
    if (field) {
      setEditId(field.id);
      setForm({
        module_name: field.module_name,
        field_label: field.field_label,
        field_type: field.field_type,
        is_required: field.is_required,
        options: Array.isArray(field.options) ? field.options.join(", ") : "",
      });
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.module_name || !form.field_label) {
      toast.error("Module and field label are required");
      return;
    }

    const optionsArray = form.field_type === "dropdown"
      ? form.options.split(",").map((o) => o.trim()).filter(Boolean)
      : [];

    if (form.field_type === "dropdown" && optionsArray.length < 2) {
      toast.error("Dropdown requires at least 2 options");
      return;
    }

    if (editId) {
      await updateField(editId, {
        field_label: form.field_label,
        field_type: form.field_type,
        is_required: form.is_required,
        options: optionsArray,
      } as any);
    } else {
      await createField({
        module_name: form.module_name,
        field_label: form.field_label,
        field_type: form.field_type,
        is_required: form.is_required,
        options: optionsArray,
      });
    }
    setOpen(false);
    resetForm();
  };

  const filtered = filterModule === "all" ? fields : fields.filter((f) => f.module_name === filterModule);

  const grouped = filtered.reduce<Record<string, typeof fields>>((acc, f) => {
    (acc[f.module_name] = acc[f.module_name] || []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Custom Field Builder</h1>
          <p className="text-muted-foreground text-sm">Create and manage custom fields that appear in module forms</p>
        </div>
        <Button onClick={() => handleOpen()}>
          <Plus className="h-4 w-4 mr-2" /> New Field
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-foreground">{fields.length}</p>
          <p className="text-xs text-muted-foreground">Total Fields</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-foreground">{new Set(fields.map((f) => f.module_name)).size}</p>
          <p className="text-xs text-muted-foreground">Modules Used</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-foreground">{fields.filter((f) => f.is_required).length}</p>
          <p className="text-xs text-muted-foreground">Required Fields</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-foreground">{fields.filter((f) => f.is_active).length}</p>
          <p className="text-xs text-muted-foreground">Active Fields</p>
        </CardContent></Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Settings2 className="h-4 w-4 text-muted-foreground" />
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {MODULE_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fields Table grouped by module */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          No custom fields yet. Click "New Field" to get started.
        </CardContent></Card>
      ) : (
        Object.entries(grouped).map(([mod, modFields]) => (
          <Card key={mod}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base capitalize flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                {MODULE_OPTIONS.find((m) => m.value === mod)?.label || mod}
                <Badge variant="secondary" className="ml-auto">{modFields.length} fields</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modFields.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.field_label}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{f.field_key}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{FIELD_TYPES.find((t) => t.value === f.field_type)?.label || f.field_type}</Badge>
                      </TableCell>
                      <TableCell>{f.is_required ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        <Switch
                          checked={f.is_active}
                          onCheckedChange={(v) => updateField(f.id, { is_active: v } as any)}
                        />
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpen(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteField(f.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Custom Field" : "Create Custom Field"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Module *</Label>
              <Select value={form.module_name} onValueChange={(v) => setForm({ ...form, module_name: v })} disabled={!!editId}>
                <SelectTrigger><SelectValue placeholder="Select module" /></SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Field Label *</Label>
              <Input value={form.field_label} onChange={(e) => setForm({ ...form, field_label: e.target.value })} placeholder="e.g. Company Size" />
            </div>
            <div className="space-y-1.5">
              <Label>Field Type</Label>
              <Select value={form.field_type} onValueChange={(v) => setForm({ ...form, field_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.field_type === "dropdown" && (
              <div className="space-y-1.5">
                <Label>Dropdown Options (comma-separated)</Label>
                <Input value={form.options} onChange={(e) => setForm({ ...form, options: e.target.value })} placeholder="Option A, Option B, Option C" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={form.is_required} onCheckedChange={(v) => setForm({ ...form, is_required: v })} />
              <Label>Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
