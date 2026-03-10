export function detectDelimiter(sample: string): string {
  const candidates = [",", ";", "\t", "|"];
  const lines = sample
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (lines.length === 0) return ",";

  let best = ",";
  let bestScore = -1;

  for (const delimiter of candidates) {
    const counts = lines.map((line) => parseCSVLine(line, delimiter).length);
    const avg = counts.reduce((sum, c) => sum + c, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;
    const score = avg - variance;

    if (score > bestScore) {
      best = delimiter;
      bestScore = score;
    }
  }

  return best;
}

export function parseCSVLine(line: string, delimiter = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === delimiter) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += ch;
  }

  result.push(current.trim());
  return result;
}

function parseCSVRows(text: string): string[] {
  const rows: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (current.trim()) rows.push(current);

      current = "";
      if (ch === "\r" && text[i + 1] === "\n") i++;
      continue;
    }

    current += ch;
  }

  if (current.trim()) rows.push(current);
  return rows;
}

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = parseCSVRows(text);
  if (lines.length < 2) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(lines.slice(0, 5).join("\n"));
  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], delimiter);
    const row: Record<string, string> = {};

    headers.forEach((header, idx) => {
      row[header] = (values[idx] || "").trim();
    });

    rows.push(row);
  }

  return { headers, rows };
}

export async function parseImportFile(file: File): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);

  if (isExcel) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.SheetNames[0];

    if (!firstSheet) return { headers: [], rows: [] };

    const worksheet = workbook.Sheets[firstSheet];
    const matrix = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }) as string[][];

    if (!matrix.length) return { headers: [], rows: [] };

    const headers = (matrix[0] || []).map((h) => String(h).trim()).filter(Boolean);
    const body = matrix.slice(1);

    const rows = body
      .map((record) => {
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = String(record[idx] ?? "").trim();
        });
        return row;
      })
      .filter((row) => Object.values(row).some(Boolean));

    return { headers, rows };
  }

  const text = await file.text();
  return parseCSV(text);
}
