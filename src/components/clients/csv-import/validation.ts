import type { FieldMapping, RowError, ValidatedRow } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function mapAndValidateRows(
  rawRows: Record<string, string>[],
  mappings: FieldMapping[]
): ValidatedRow[] {
  return rawRows.map((raw, idx) => {
    const data: Record<string, string> = {};
    const errors: RowError[] = [];
    const rowNum = idx + 2;

    let firstName = "";
    let lastName = "";

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

    // --- Lenient Validation ---
    // Only truly invalid if BOTH contact_name AND email are missing
    const hasName = !!data["contact_name"];
    const hasEmail = !!data["email"];
    const allEmpty = Object.values(data).every(v => !v);

    if (!hasName && !hasEmail) {
      errors.push({ row: rowNum, field: "Row", error: "Both Client Name and Email missing – will be skipped" });
    }

    if (!hasName && hasEmail) {
      // Use email prefix as name
      data["contact_name"] = data["email"].split("@")[0].replace(/[._-]/g, " ");
      errors.push({ row: rowNum, field: "Client Name", error: "Missing – derived from email (warning)" });
    }

    if (!hasEmail) {
      errors.push({ row: rowNum, field: "Email", error: "Missing email – placeholder will be generated" });
    } else if (!EMAIL_RE.test(data["email"])) {
      errors.push({ row: rowNum, field: "Email", error: `Invalid email format: "${data["email"]}" – will be cleaned` });
    }

    // Row is valid as long as it's not completely empty and has at least name OR email
    const isValid = !allEmpty && (hasName || hasEmail);

    return {
      rowIndex: idx,
      data,
      errors: allEmpty ? [{ row: rowNum, field: "Row", error: "Empty row – will be skipped" }] : errors,
      isValid,
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
