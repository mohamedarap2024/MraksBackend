import Papa from "papaparse";

const RESERVED = new Set([
  "student_id",
  "student id",
  "studentid",
  "id",
  "student",
  "name",
  "full name",
  "fullname",
  "total",
  "grade",
]);

function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, "").trim();
}

function normKey(k: string): string {
  return k.toLowerCase().replace(/[\s_-]+/g, "");
}

function pickField(row: Record<string, string>, keys: string[]): string {
  const byNorm: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    byNorm[normKey(k)] = String(v ?? "").trim();
  }
  for (const key of keys) {
    const direct = row[key]?.trim();
    if (direct) return direct;
    const fromNorm = byNorm[normKey(key)];
    if (fromNorm) return fromNorm;
  }
  return "";
}

export function parseStudentCsv(text: string): {
  rows: { studentId: string; name: string; subjects: Record<string, string> }[];
  errors: string[];
  skipped: number;
} {
  const cleaned = text.replace(/^\uFEFF/, "");
  const firstLine = cleaned.split(/\r?\n/)[0] ?? "";
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: normalizeHeader,
    transform: (v) => String(v ?? "").trim(),
  });

  const fatalErrors = parsed.errors.filter((e) => e.type !== "FieldMismatch");
  if (fatalErrors.length > 0) {
    return {
      rows: [],
      errors: fatalErrors.map((e) => e.message),
      skipped: 0,
    };
  }

  const fields = (parsed.meta.fields ?? []).map(normalizeHeader);
  const subjectKeys = fields.filter((h) => !RESERVED.has(h.toLowerCase()));

  const rows: { studentId: string; name: string; subjects: Record<string, string> }[] =
    [];
  let skipped = 0;

  for (const raw of parsed.data) {
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      row[normalizeHeader(k)] = String(v ?? "").trim();
    }

    const studentId = pickField(row, [
      "student_id",
      "Student ID",
      "StudentID",
      "Student_Id",
      "studentid",
      "ID",
      "id",
    ]);
    const name = pickField(row, ["name", "Name", "Full Name", "fullname"]);

    if (!studentId || !name) {
      skipped++;
      continue;
    }

    const subjects: Record<string, string> = {};
    for (const key of subjectKeys) {
      const score = row[key];
      if (score !== "" && score !== undefined) subjects[key] = score;
    }

    rows.push({ studentId, name, subjects });
  }

  return { rows, errors: [], skipped };
}
