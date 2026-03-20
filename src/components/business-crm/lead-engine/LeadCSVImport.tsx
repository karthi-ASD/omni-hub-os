import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity as logAI } from "@/lib/activity-logger";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Eye, Columns } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onClose: () => void;
  businessId: string;
}

const TARGET_FIELDS = [
  { key: "full_name", label: "Name", required: true },
  { key: "mobile", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "budget_range", label: "Budget" },
  { key: "notes", label: "Notes" },
  { key: "source", label: "Source" },
  { key: "property_interest_type", label: "Interest Type" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "lead_temperature", label: "Temperature" },
] as const;

const AUTO_MAP: Record<string, string> = {
  name: "full_name", "full name": "full_name", full_name: "full_name", "first name": "full_name",
  phone: "mobile", mobile: "mobile", tel: "mobile", telephone: "mobile", "phone number": "mobile",
  email: "email", "e-mail": "email", "email address": "email",
  source: "source", "lead source": "source",
  budget: "budget_range", "budget range": "budget_range",
  interest: "property_interest_type", "property type": "property_interest_type", type: "property_interest_type",
  city: "city", suburb: "city", location: "city",
  state: "state", region: "state",
  notes: "notes", comment: "notes", comments: "notes", message: "notes", remarks: "notes",
  temperature: "lead_temperature", "lead temperature": "lead_temperature",
};

type Step = "upload" | "map" | "preview" | "done";

export function LeadCSVImport({ open, onClose, businessId }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [sourceColumns, setSourceColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [fileName, setFileName] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);
        if (rows.length === 0) { toast.error("File is empty"); return; }

        const cols = Object.keys(rows[0]);
        setSourceColumns(cols);
        setRawRows(rows);

        // Auto-map columns
        const autoMapped: Record<string, string> = {};
        cols.forEach(col => {
          const norm = col.toLowerCase().trim();
          if (AUTO_MAP[norm]) autoMapped[col] = AUTO_MAP[norm];
        });
        setMapping(autoMapped);
        setStep("map");
      } catch {
        toast.error("Could not parse file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const mappedLeads = useMemo(() => {
    if (step !== "preview") return [];
    const errors: string[] = [];
    const leads = rawRows.map((row, i) => {
      const lead: Record<string, string | null> = {};
      Object.entries(mapping).forEach(([srcCol, targetField]) => {
        if (row[srcCol] != null) lead[targetField] = String(row[srcCol]).trim();
      });
      if (!lead.full_name) errors.push(`Row ${i + 2}: Missing name`);
      return lead;
    }).filter(l => l.full_name);
    return leads;
  }, [step, rawRows, mapping]);

  const unmappedCols = sourceColumns.filter(c => !mapping[c]);
  const mappedCount = Object.keys(mapping).length;
  const hasRequiredField = Object.values(mapping).includes("full_name");

  const handleImport = async () => {
    if (mappedLeads.length === 0) return;
    setImporting(true);

    const rows = mappedLeads.map(l => ({
      business_id: businessId,
      full_name: l.full_name!,
      mobile: l.mobile || null,
      email: l.email || null,
      source: l.source || "csv_import",
      budget_range: l.budget_range || null,
      property_interest_type: l.property_interest_type || null,
      city: l.city || null,
      state: l.state || null,
      notes: l.notes || null,
      lead_temperature: l.lead_temperature || "cold",
      stage: "new",
    }));

    const { error } = await supabase.from("crm_leads").insert(rows as any);
    if (error) {
      toast.error("Import failed: " + error.message);
    } else {
      toast.success(`${rows.length} leads imported`);
      logAI({ userId: "", userRole: "staff", businessId: businessId, module: "leads", actionType: "create", entityType: "crm_lead", description: `Imported ${rows.length} leads via CSV` });
      setImportedCount(rows.length);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
    }
    setImporting(false);
  };

  const reset = () => {
    setStep("upload");
    setRawRows([]);
    setSourceColumns([]);
    setMapping({});
    setImportedCount(0);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className={step === "preview" ? "max-w-3xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Leads — {step === "upload" ? "Upload File" : step === "map" ? "Map Fields" : step === "preview" ? "Preview & Confirm" : "Complete"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        {step !== "done" && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            {["upload", "map", "preview"].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                <span className={step === s ? "font-medium text-foreground" : ""}>{s === "upload" ? "Upload" : s === "map" ? "Map" : "Preview"}</span>
                {i < 2 && <ArrowRight className="h-3 w-3 mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-1">Upload your CSV or Excel file</p>
              <p className="text-xs text-muted-foreground mb-4">Supported: .csv, .xlsx, .xls</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />Choose File
              </Button>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm">Expected columns:</p>
              <p>Name*, Phone, Email, Budget, Notes, Source, Interest Type, City, State</p>
              <p className="text-[10px]">* Required — Columns auto-map by name. You can adjust mapping in the next step.</p>
            </div>
          </div>
        )}

        {/* STEP 2: Field Mapping */}
        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-1">{rawRows.length} rows</Badge>
                from <span className="font-medium text-foreground">{fileName}</span>
              </p>
              <Badge variant={hasRequiredField ? "default" : "destructive"}>
                {mappedCount} / {sourceColumns.length} mapped
              </Badge>
            </div>

            <div className="border rounded-lg divide-y max-h-[320px] overflow-y-auto">
              {sourceColumns.map(col => {
                const sample = rawRows.slice(0, 3).map(r => r[col]).filter(Boolean).join(", ").slice(0, 60);
                return (
                  <div key={col} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{col}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{sample || "—"}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Select
                      value={mapping[col] || "_skip"}
                      onValueChange={v => setMapping(prev => {
                        const next = { ...prev };
                        if (v === "_skip") delete next[col]; else next[col] = v;
                        return next;
                      })}
                    >
                      <SelectTrigger className="w-[160px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_skip" className="text-muted-foreground">Skip</SelectItem>
                        {TARGET_FIELDS.map(f => (
                          <SelectItem key={f.key} value={f.key}>
                            {f.label}{"required" in f && f.required ? " *" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            {!hasRequiredField && (
              <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded">
                <AlertCircle className="h-3.5 w-3.5" />
                Map at least one column to <strong>Name</strong> (required)
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back
              </Button>
              <Button size="sm" onClick={() => setStep("preview")} disabled={!hasRequiredField}>
                <Eye className="h-3.5 w-3.5 mr-1" />Preview
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <Badge variant="default">{mappedLeads.length}</Badge> leads ready to import
                {rawRows.length - mappedLeads.length > 0 && (
                  <span className="text-xs text-destructive ml-2">
                    ({rawRows.length - mappedLeads.length} skipped — missing name)
                  </span>
                )}
              </p>
            </div>

            <div className="border rounded-lg max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-8">#</TableHead>
                    {TARGET_FIELDS.filter(f => Object.values(mapping).includes(f.key)).map(f => (
                      <TableHead key={f.key} className="text-xs">{f.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedLeads.slice(0, 20).map((lead, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {TARGET_FIELDS.filter(f => Object.values(mapping).includes(f.key)).map(f => (
                        <TableCell key={f.key} className="text-xs max-w-[150px] truncate">
                          {lead[f.key] || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {mappedLeads.length > 20 && (
              <p className="text-[10px] text-muted-foreground text-center">Showing first 20 of {mappedLeads.length}</p>
            )}

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep("map")}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />Back to Mapping
              </Button>
              <Button size="sm" onClick={handleImport} disabled={importing || mappedLeads.length === 0}>
                {importing ? "Importing..." : `Import ${mappedLeads.length} Leads`}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Done */}
        {step === "done" && (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-lg font-semibold">{importedCount} Leads Imported</p>
            <p className="text-sm text-muted-foreground">All leads are now in your Lead Engine pipeline</p>
            <Button onClick={() => { reset(); onClose(); }}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
