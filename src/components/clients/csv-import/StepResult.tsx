import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, AlertTriangle } from "lucide-react";
import type { ImportResult } from "./types";
import { generateErrorCSV } from "./validation";

interface Props {
  result: ImportResult;
  onDone: () => void;
}

const StepResult: React.FC<Props> = ({ result, onDone }) => {
  const downloadErrors = () => {
    const csv = generateErrorCSV(result.errors);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="text-center py-6 space-y-4">
      {result.imported > 0 ? (
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
      ) : (
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
      )}

      <div className="space-y-1">
        <p className="text-lg font-semibold">Import Complete</p>
        <div className="flex justify-center gap-4 text-sm">
          <span>Total: <strong>{result.total}</strong></span>
          <span className="text-green-600">Imported: <strong>{result.imported}</strong></span>
          <span className="text-amber-600">Skipped: <strong>{result.skipped}</strong></span>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{result.errors.length} row-level issues found</p>
          <div className="border rounded-lg overflow-auto max-h-40 text-left mx-auto max-w-md">
            <table className="text-xs w-full">
              <thead>
                <tr className="bg-muted/50 sticky top-0">
                  <th className="p-1.5">Row</th>
                  <th className="p-1.5">Field</th>
                  <th className="p-1.5">Error</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.slice(0, 20).map((e, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1.5">{e.row}</td>
                    <td className="p-1.5">{e.field}</td>
                    <td className="p-1.5 text-destructive">{e.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.errors.length > 20 && (
            <p className="text-xs text-muted-foreground">Showing first 20 of {result.errors.length} errors</p>
          )}
          <Button variant="outline" size="sm" onClick={downloadErrors}>
            <Download className="h-3.5 w-3.5 mr-1" /> Download Error Report
          </Button>
        </div>
      )}

      <div className="flex justify-center gap-2 pt-2">
        <Button onClick={onDone}>Done</Button>
      </div>
    </div>
  );
};

export default StepResult;
