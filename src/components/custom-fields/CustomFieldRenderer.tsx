import { useCustomFields, useCustomFieldValues, type CustomField } from "@/hooks/useCustomFields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

interface Props {
  moduleName: string;
  recordId?: string;
  onChange?: (values: Record<string, string>) => void;
  readOnly?: boolean;
}

export function CustomFieldRenderer({ moduleName, recordId, onChange, readOnly }: Props) {
  const { fields, loading: fieldsLoading } = useCustomFields(moduleName);
  const { values: savedValues, loading: valuesLoading } = useCustomFieldValues(moduleName, recordId);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recordId && Object.keys(savedValues).length > 0) {
      setLocalValues(savedValues);
    }
  }, [savedValues, recordId]);

  const handleChange = (fieldId: string, value: string) => {
    const next = { ...localValues, [fieldId]: value };
    setLocalValues(next);
    onChange?.(next);
  };

  if (fieldsLoading || valuesLoading) return null;
  if (fields.length === 0) return null;

  return (
    <div className="space-y-4 pt-4 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Fields</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={localValues[field.id] || ""}
            onChange={(v) => handleChange(field.id, v)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  readOnly,
}: {
  field: CustomField;
  value: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  switch (field.field_type) {
    case "text":
      return (
        <div className="space-y-1.5">
          <Label>{field.field_label}{field.is_required && " *"}</Label>
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.field_label}
            readOnly={readOnly}
            required={field.is_required}
          />
        </div>
      );

    case "number":
      return (
        <div className="space-y-1.5">
          <Label>{field.field_label}{field.is_required && " *"}</Label>
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
            readOnly={readOnly}
            required={field.is_required}
          />
        </div>
      );

    case "date":
      return (
        <div className="space-y-1.5">
          <Label>{field.field_label}{field.is_required && " *"}</Label>
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readOnly}
            required={field.is_required}
          />
        </div>
      );

    case "dropdown": {
      const options = Array.isArray(field.options) ? field.options : [];
      return (
        <div className="space-y-1.5">
          <Label>{field.field_label}{field.is_required && " *"}</Label>
          <Select value={value} onValueChange={onChange} disabled={readOnly}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.field_label}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case "boolean":
      return (
        <div className="flex items-center gap-3 pt-2">
          <Switch
            checked={value === "true"}
            onCheckedChange={(c) => onChange(c ? "true" : "false")}
            disabled={readOnly}
          />
          <Label>{field.field_label}</Label>
        </div>
      );

    default:
      return null;
  }
}
