import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import StepUpload from "./csv-import/StepUpload";
import StepMapping from "./csv-import/StepMapping";
import StepPreview from "./csv-import/StepPreview";
import StepResult from "./csv-import/StepResult";
import { parseCSV } from "./csv-import/csv-parser";
import { mapAndValidateRows } from "./csv-import/validation";
import { DEFAULT_FIELD_MAP, type FieldMapping, type ValidatedRow, type ImportResult, type RowError } from "./csv-import/types";

type Step = "upload" | "mapping" | "preview" | "importing" | "result";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ open, onOpenChange, onComplete }) => {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [validatedRows, setValidatedRows] = useState<ValidatedRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setMappings([]);
    setValidatedRows([]);
    setImportResult(null);
  };

  const handleFileSelected = (_file: File, text: string) => {
    const { headers, rows } = parseCSV(text);
    if (headers.length === 0) {
      toast.error("Could not parse CSV headers");
      return;
    }
    setCsvHeaders(headers);
    setCsvRows(rows);

    // Auto-map fields based on known mappings
    const autoMappings: FieldMapping[] = headers.map(h => ({
      csvField: h,
      crmField: DEFAULT_FIELD_MAP[h] || "__skip__",
    }));
    setMappings(autoMappings);
    setStep("mapping");
  };

  const handleUpdateMapping = (index: number, crmField: string) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, crmField } : m));
  };

  const handleProceedToPreview = () => {
    const validated = mapAndValidateRows(csvRows, mappings);
    setValidatedRows(validated);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!profile?.business_id) return;
    setStep("importing");

    const rowsToImport = validatedRows.filter(r => r.isValid);
    const allErrors: RowError[] = validatedRows.flatMap(r => r.errors);
    let imported = 0;
    let skipped = validatedRows.filter(r => !r.isValid).length;

    for (const row of rowsToImport) {
      const d = row.data;
      const insertData = {
        business_id: profile.business_id,
        contact_name: d.contact_name || "Unknown",
        email: d.email || `noemail-${Date.now()}-${Math.random().toString(36).slice(2)}@placeholder.local`,
        phone: d.phone || null,
        mobile: d.mobile || null,
        website: d.website || null,
        city: d.city || null,
        state: d.state || null,
        country: d.country || null,
        address: d.address || null,
        company_name: d.company_name || d.contact_name || null,
      };

      const { error } = await supabase.from("clients").insert(insertData as any);
      if (error) {
        skipped++;
        allErrors.push({
          row: row.rowIndex + 2,
          field: "Database",
          error: error.message,
        });
      } else {
        imported++;
      }
    }

    const result: ImportResult = {
      total: validatedRows.length,
      imported,
      skipped,
      errors: allErrors,
    };
    setImportResult(result);
    setStep("result");
    toast.success(`Imported ${imported} clients${skipped > 0 ? `, ${skipped} skipped` : ""}`);
    onComplete();
  };

  const stepTitles: Record<Step, string> = {
    upload: "Import Clients from CSV",
    mapping: "Map CSV Fields",
    preview: "Preview & Validate",
    importing: "Importing...",
    result: "Import Results",
  };

  const validCount = validatedRows.filter(r => r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            {stepTitles[step]}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && <StepUpload onFileSelected={handleFileSelected} />}
        {step === "mapping" && <StepMapping mappings={mappings} onUpdateMapping={handleUpdateMapping} />}
        {step === "preview" && <StepPreview validatedRows={validatedRows} />}
        {step === "importing" && (
          <div className="py-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Importing clients...</p>
          </div>
        )}
        {step === "result" && importResult && <StepResult result={importResult} onDone={() => { reset(); onOpenChange(false); }} />}

        {(step === "mapping" || step === "preview") && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setStep(step === "mapping" ? "upload" : "mapping")}>
              Back
            </Button>
            {step === "mapping" && (
              <Button onClick={handleProceedToPreview}>
                Preview Data
              </Button>
            )}
            {step === "preview" && (
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Clients
              </Button>
            )}
          </DialogFooter>
        )}

        {step === "upload" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;
