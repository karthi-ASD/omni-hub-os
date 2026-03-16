import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, FileText, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ParsedKeyword {
  keyword: string;
  location: string;
  target_url: string;
  priority: string;
  isDuplicate?: boolean;
}

interface KeywordCsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingKeywords: string[];
  onImport: (keywords: ParsedKeyword[]) => Promise<void>;
}

export const KeywordCsvImportDialog: React.FC<KeywordCsvImportDialogProps> = ({
  open,
  onOpenChange,
  existingKeywords,
  onImport,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [parsed, setParsed] = useState<ParsedKeyword[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setStep("upload");
    setParsed([]);
    setErrors([]);
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let current = "";
    let inQuotes = false;
    let row: string[] = [];

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"' && text[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          row.push(current.trim());
          current = "";
        } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
          row.push(current.trim());
          if (row.some((c) => c)) rows.push(row);
          row = [];
          current = "";
          if (ch === "\r") i++;
        } else {
          current += ch;
        }
      }
    }
    row.push(current.trim());
    if (row.some((c) => c)) rows.push(row);
    return rows;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast.error("CSV file is empty or has no data rows");
        return;
      }

      const header = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
      const kwIdx = header.indexOf("keyword");
      const locIdx = header.indexOf("location");
      const urlIdx = header.indexOf("target_url");
      const priIdx = header.indexOf("priority");

      const errs: string[] = [];
      if (kwIdx === -1) errs.push("Missing required column: keyword");
      if (locIdx === -1) errs.push("Missing required column: location");

      if (errs.length) {
        setErrors(errs);
        setStep("preview");
        return;
      }

      const existingLower = existingKeywords.map((k) => k.toLowerCase());
      const seenInBatch = new Set<string>();
      const results: ParsedKeyword[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const keyword = row[kwIdx]?.trim();
        if (!keyword) {
          errs.push(`Row ${i + 1}: Empty keyword — skipped`);
          continue;
        }

        const location = row[locIdx]?.trim() || "";
        const target_url = urlIdx >= 0 ? row[urlIdx]?.trim() || "" : "";
        const rawPriority = priIdx >= 0 ? row[priIdx]?.trim().toLowerCase() || "medium" : "medium";
        const priority = ["low", "medium", "high"].includes(rawPriority) ? rawPriority : "medium";

        const kwLower = keyword.toLowerCase();
        const isDuplicate = existingLower.includes(kwLower) || seenInBatch.has(kwLower);
        seenInBatch.add(kwLower);

        results.push({ keyword, location, target_url, priority, isDuplicate });
      }

      setErrors(errs);
      setParsed(results);
      setStep("preview");
    };
    reader.readAsText(file);
  };

  const newKeywords = parsed.filter((p) => !p.isDuplicate);
  const duplicates = parsed.filter((p) => p.isDuplicate);

  const handleConfirm = async () => {
    if (newKeywords.length === 0) {
      toast.error("No new keywords to import");
      return;
    }
    setImporting(true);
    try {
      await onImport(newKeywords);
      toast.success(`Imported ${newKeywords.length} keywords`);
      handleClose(false);
    } catch {
      toast.error("Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Keywords from CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto px-6 py-4">
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload CSV file</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Required columns: keyword, location
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Optional columns: target_url, priority
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />

              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">Example CSV format:</p>
                <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
{`keyword,location,target_url,priority
carpet cleaning brisbane,Brisbane,/carpet-cleaning-brisbane,High
rug cleaning brisbane,Brisbane,/rug-cleaning,Medium
couch cleaning brisbane,Brisbane,,High`}
                </pre>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              {errors.length > 0 && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 space-y-1">
                  <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Validation Issues
                  </p>
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-destructive/80">{err}</p>
                  ))}
                </div>
              )}

              {parsed.length === 0 && errors.length > 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Fix the CSV format issues and try again.</p>
                  <Button variant="outline" className="mt-3" onClick={reset}>
                    Upload Again
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {newKeywords.length} new
                    </Badge>
                    {duplicates.length > 0 && (
                      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200">
                        <AlertTriangle className="h-3 w-3" /> {duplicates.length} duplicates (will be skipped)
                      </Badge>
                    )}
                  </div>

                  <div className="rounded-xl border overflow-hidden max-h-[40vh] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Target URL</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsed.map((row, i) => (
                          <TableRow key={i} className={row.isDuplicate ? "opacity-50" : ""}>
                            <TableCell className="font-medium">{row.keyword}</TableCell>
                            <TableCell>{row.location || "—"}</TableCell>
                            <TableCell className="text-xs">{row.target_url || "—"}</TableCell>
                            <TableCell className="capitalize">{row.priority}</TableCell>
                            <TableCell>
                              {row.isDuplicate ? (
                                <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">Duplicate</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">New</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-2">
          {step === "preview" && parsed.length > 0 && (
            <>
              <Button variant="outline" onClick={reset}>Back</Button>
              <Button onClick={handleConfirm} disabled={importing || newKeywords.length === 0}>
                {importing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {importing ? "Importing..." : `Confirm Import (${newKeywords.length})`}
              </Button>
            </>
          )}
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
