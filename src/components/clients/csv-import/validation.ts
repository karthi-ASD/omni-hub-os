import type { FieldMapping, RowError, ValidatedRow } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function mapAndValidateRows(
  rawRows: Record<string, string>[],
  mappings: FieldMapping[]
): ValidatedRow[] {
  return rawRows.map((raw, idx) => {
    const data: Record<string, string> = {};
    const errors: RowError[] = [];
    const rowNum = idx + 2; // +2 for header row + 1-indexed

    let firstName = "";
    let lastName = "";

    // Apply mappings
    for (const m of mappings) {
      if (m.crmField === "__skip__" || !m.crmField) continue;
      const val = raw[m.csvField] || "";
      if (m.crmField === "__first_name__") {
        firstName = val;
      } else if (m.crmField === "__last_name__") {
        lastName = val;
      } else {
        if (val) data[m.crmField] = val;
      }
    }

    // Build address from multiple POAddressLine fields
    const addrParts = [raw["POAddressLine1"], raw["POAddressLine2"], raw["POAddressLine3"], raw["POAddressLine4"]].filter(Boolean);
    if (addrParts.length > 0 && !data["address"]) {
      data["address"] = addrParts.join(", ");
    }

    // Fallback contact_name from first + last
    if (!data["contact_name"] && (firstName || lastName)) {
      data["contact_name"] = [firstName, lastName].filter(Boolean).join(" ");
    }

    // Fallback company_name
    if (!data["company_name"] && data["contact_name"]) {
      data["company_name"] = data["contact_name"];
    }

    // --- Validation ---
    if (!data["contact_name"]) {
      errors.push({ row: rowNum, field: "Client Name", error: "Required field missing" });
    }

    if (!data["email"]) {
      // We'll generate a placeholder, but warn
      errors.push({ row: rowNum, field: "Email", error: "Missing email – placeholder will be used" });
    } else if (!EMAIL_RE.test(data["email"])) {
      errors.push({ row: rowNum, field: "Email", error: `Invalid email format: "${data["email"]}"` });
    }

    // Check if entire row is empty
    const allEmpty = Object.values(data).every(v => !v);

    return {
      rowIndex: idx,
      data,
      errors: allEmpty ? [{ row: rowNum, field: "Row", error: "Empty row – will be skipped" }] : errors,
      isValid: !allEmpty && errors.filter(e => !e.error.includes("placeholder")).length === 0,
    };
  });
}

export function generateErrorCSV(errors: RowError[]): string {
  const lines = ["Row,Field,Error"];
  for (const e of errors) {
    lines.push(`${e.row},"${e.field}","${e.error.replace(/"/g, '""')}"`);
  }
  return lines.join("\n");
}
