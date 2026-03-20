import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

interface Props {
  open: boolean;
  onClose: () => void;
  businessId: string;
}

interface ParsedLead {
  full_name: string;
  mobile?: string;
  email?: string;
  source?: string;
  budget_range?: string;
  property_interest_type?: string;
  city?: string;
  state?: string;
  notes?: string;
}

const FIELD_MAP: Record<string, string> = {
  name: "full_name", full_name: "full_name", "full name": "full_name",
  phone: "mobile", mobile: "mobile", tel: "mobile", telephone: "mobile",
  email: "email", "e-mail": "email",
  source: "source", "lead source": "source",
  budget: "budget_range", "budget range": "budget_range",
  interest: "property_interest_type", "property type": "property_interest_type",
  city: "city", suburb: "city",
  state: "state",
  notes: "notes", comment: "notes", comments: "notes",
};

export function LeadCSVImport({ open, onClose, businessId }: Props) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedLead[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const leads: ParsedLead[] = [];
        const errs: string[] = [];

        raw.forEach((row, i) => {
          const mapped: Record<string, string> = {};
          Object.entries(row).forEach(([key, val]) => {
            const normalized = key.toLowerCase().trim();
            const field = FIELD_MAP[normalized];
            if (field && val != null) mapped[field] = String(val).trim();
          });

          if (!mapped.full_name) {
            errs.push(`Row ${i + 2}: Missing name`);
            return;
          }
          leads.push(mapped as unknown as ParsedLead);
        });

        setParsed(leads);
        setErrors(errs);
      } catch {
        toast.error("Could not parse file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);

    const rows = parsed.map(l => ({
      business_id: businessId,
      full_name: l.full_name,
      mobile: l.mobile || null,
      email: l.email || null,
      source: l.source || "csv_import",
      budget_range: l.budget_range || null,
      property_interest_type: l.property_interest_type || null,
      city: l.city || null,
      state: l.state || null,
      notes: l.notes || null,
      stage: "new",
      lead_temperature: "cold",
    }));

    const { error } = await supabase.from("crm_leads").insert(rows as any);
    if (error) {
      toast.error("Import failed: " + error.message);
    } else {
      toast.success(`${rows.length} leads imported`);
      setDone(true);
      qc.invalidateQueries({ queryKey: ["crm-leads"] });
    }
    setImporting(false);
  };

  const reset = () => {
    setParsed([]);
    setErrors([]);
    setDone(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={() => { reset(); onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Import Leads from CSV/Excel</DialogTitle></DialogHeader>

        {done ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
            <p className="text-sm text-foreground font-medium">{parsed.length} leads imported successfully</p>
            <Button onClick={() => { reset(); onClose(); }}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Upload CSV or Excel file</p>
              <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4 mr-1" />Choose File
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground">
              Columns: Name*, Phone, Email, Source, Budget, Interest, City, State, Notes
            </p>

            {parsed.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {parsed.length} leads ready to import
                </p>
                {errors.length > 0 && (
                  <div className="bg-destructive/10 p-2 rounded text-xs text-destructive space-y-0.5">
                    {errors.slice(0, 5).map((e, i) => <p key={i}><AlertCircle className="h-3 w-3 inline mr-1" />{e}</p>)}
                    {errors.length > 5 && <p>...and {errors.length - 5} more</p>}
                  </div>
                )}
                <Button onClick={handleImport} disabled={importing} className="w-full">
                  {importing ? "Importing..." : `Import ${parsed.length} Leads`}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
