import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const FIELD_MAP: Record<string, string> = {
  "*ContactName": "contact_name",
  "ContactName": "contact_name",
  "EmailAddress": "email",
  "PhoneNumber": "phone",
  "MobileNumber": "mobile",
  "Website": "website",
  "POCity": "city",
  "PORegion": "state",
  "POCountry": "country",
  "POAddressLine1": "address",
  "FirstName": "first_name",
  "LastName": "last_name",
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (values[idx] || "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function mapRow(csvRow: Record<string, string>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [csvCol, dbCol] of Object.entries(FIELD_MAP)) {
    if (csvRow[csvCol]) {
      mapped[dbCol] = csvRow[csvCol];
    }
  }
  // Build address from multiple address lines
  const addrParts = [csvRow["POAddressLine1"], csvRow["POAddressLine2"], csvRow["POAddressLine3"], csvRow["POAddressLine4"]].filter(Boolean);
  if (addrParts.length > 0) {
    mapped["address"] = addrParts.join(", ");
  }
  // Fallback: if no contact_name, build from first+last
  if (!mapped["contact_name"] && (mapped["first_name"] || mapped["last_name"])) {
    mapped["contact_name"] = [mapped["first_name"], mapped["last_name"]].filter(Boolean).join(" ");
  }
  // Use contact_name from *ContactName column (Xero uses asterisk prefix)
  if (!mapped["contact_name"] && csvRow["*ContactName"]) {
    mapped["contact_name"] = csvRow["*ContactName"];
  }
  return mapped;
}

const CSVImportDialog: React.FC<CSVImportDialogProps> = ({ open, onOpenChange, onComplete }) => {
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setPreview(rows.slice(0, 5).map(mapRow));
    };
    reader.readAsText(f);
  };

  const handleImport = async () => {
    if (!file || !profile?.business_id) return;
    setImporting(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const mapped = rows.map(mapRow).filter(r => r.contact_name);
      
      let imported = 0;
      let skipped = 0;
      const batchSize = 25;
      
      for (let i = 0; i < mapped.length; i += batchSize) {
        const batch = mapped.slice(i, i + batchSize).map(r => ({
          business_id: profile.business_id,
          contact_name: r.contact_name || "Unknown",
          email: r.email || `noemail-${Date.now()}-${Math.random().toString(36).slice(2)}@placeholder.local`,
          phone: r.phone || null,
          mobile: r.mobile || null,
          website: r.website || null,
          city: r.city || null,
          state: r.state || null,
          country: r.country || null,
          address: r.address || null,
          company_name: r.contact_name || null,
        }));
        
        // Insert one-by-one to gracefully skip duplicates/errors
        for (const row of batch) {
          const { error } = await supabase.from("clients").insert(row as any);
          if (error) {
            console.warn("Row skipped:", row.contact_name, error.message);
            skipped++;
          } else {
            imported++;
          }
        }
      }
      
      setResult({ imported, skipped });
      toast.success(`Imported ${imported} clients${skipped > 0 ? `, ${skipped} skipped` : ""}`);
      onComplete();
    } catch (err: any) {
      toast.error("Import failed: " + (err.message || "Unknown error"));
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Clients from CSV
          </DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <div>
              <p className="text-lg font-semibold">{result.imported} clients imported</p>
              {result.skipped > 0 && <p className="text-sm text-muted-foreground">{result.skipped} skipped (errors)</p>}
            </div>
            <Button onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">{file ? file.name : "Click to upload CSV file"}</p>
                <p className="text-xs text-muted-foreground mt-1">Supports Xero-format contact exports</p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Field Mapping:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                  <span>ContactName → Client Name</span>
                  <span>EmailAddress → Email</span>
                  <span>PhoneNumber → Phone</span>
                  <span>MobileNumber → Mobile</span>
                  <span>Website → Website</span>
                  <span>POCity → City</span>
                  <span>PORegion → State</span>
                  <span>POCountry → Country</span>
                </div>
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview (first 5 rows):</p>
                  <div className="border rounded-lg overflow-auto max-h-40">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left">City</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((r, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{r.contact_name}</td>
                            <td className="p-2">{r.email || "—"}</td>
                            <td className="p-2">{r.city || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={!file || importing}>
                {importing ? "Importing..." : "Import Clients"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportDialog;
