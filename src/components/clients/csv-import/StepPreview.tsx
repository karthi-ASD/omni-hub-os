import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ValidatedRow } from "./types";

interface Props {
  validatedRows: ValidatedRow[];
}

const StepPreview: React.FC<Props> = ({ validatedRows }) => {
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);

  const errorCount = validatedRows.filter(r => r.errors.length > 0).length;
  const validCount = validatedRows.filter(r => r.isValid).length;
  const displayed = showErrorsOnly ? validatedRows.filter(r => r.errors.length > 0) : validatedRows.slice(0, 100);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-3 text-sm">
        <span className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="h-4 w-4" /> {validCount} valid
        </span>
        <span className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="h-4 w-4" /> {errorCount} with issues
        </span>
        <span className="text-muted-foreground">({validatedRows.length} total rows)</span>
        {errorCount > 0 && (
          <button
            onClick={() => setShowErrorsOnly(!showErrorsOnly)}
            className="ml-auto text-xs text-primary underline"
          >
            {showErrorsOnly ? "Show all" : "Show errors only"}
          </button>
        )}
      </div>

      {/* Data table */}
      <div className="border rounded-lg overflow-auto max-h-[45vh]">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-muted/50 sticky top-0">
              <th className="p-2 text-left w-12">Row</th>
              <th className="p-2 text-left">Client Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">City</th>
              <th className="p-2 text-left w-16">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((r) => (
              <React.Fragment key={r.rowIndex}>
                <tr className={`border-t ${r.errors.length > 0 ? "bg-destructive/5" : ""}`}>
                  <td className="p-2 text-muted-foreground">{r.rowIndex + 2}</td>
                  <td className="p-2">{r.data.contact_name || <span className="text-destructive italic">missing</span>}</td>
                  <td className="p-2">{r.data.email || <span className="text-muted-foreground italic">—</span>}</td>
                  <td className="p-2">{r.data.phone || r.data.mobile || "—"}</td>
                  <td className="p-2">{r.data.city || "—"}</td>
                  <td className="p-2">
                    {r.errors.length > 0 ? (
                      <Badge variant="destructive" className="text-[9px] px-1">Error</Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-600 text-[9px] px-1">OK</Badge>
                    )}
                  </td>
                </tr>
                {r.errors.length > 0 && (
                  <tr className="bg-destructive/5">
                    <td colSpan={6} className="px-2 pb-2">
                      <div className="flex flex-wrap gap-1">
                        {r.errors.map((e, ei) => (
                          <span key={ei} className="text-[10px] text-destructive">
                            ⚠ {e.field}: {e.error}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {!showErrorsOnly && validatedRows.length > 100 && (
        <p className="text-xs text-muted-foreground text-center">Showing first 100 rows of {validatedRows.length}</p>
      )}
    </div>
  );
};

export default StepPreview;
