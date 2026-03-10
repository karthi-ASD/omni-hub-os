import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CRM_FIELDS, type FieldMapping } from "./types";
import { Badge } from "@/components/ui/badge";

interface Props {
  mappings: FieldMapping[];
  onUpdateMapping: (index: number, crmField: string) => void;
}

const StepMapping: React.FC<Props> = ({ mappings, onUpdateMapping }) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Map each CSV column to a CRM field. Required fields are marked.</p>
      <div className="border rounded-lg overflow-auto max-h-[50vh]">
        <table className="text-sm w-full">
          <thead>
            <tr className="bg-muted/50 sticky top-0">
              <th className="p-2 text-left font-medium">CSV Column</th>
              <th className="p-2 text-left font-medium">→</th>
              <th className="p-2 text-left font-medium">CRM Field</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m, i) => {
              const selected = CRM_FIELDS.find(f => f.value === m.crmField);
              return (
                <tr key={i} className="border-t">
                  <td className="p-2 font-mono text-xs">{m.csvField}</td>
                  <td className="p-2 text-muted-foreground">→</td>
                  <td className="p-2">
                    <Select value={m.crmField || "__skip__"} onValueChange={(v) => onUpdateMapping(i, v)}>
                      <SelectTrigger className="h-8 text-xs w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CRM_FIELDS.map(f => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label} {f.required && <Badge variant="outline" className="ml-1 text-[9px] px-1">Required</Badge>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StepMapping;
