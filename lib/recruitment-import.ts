import type { RecruitmentCandidate } from "./recruitment-types";

export type RecruitmentImportSummary = {
  total: number;
  validos: number;
  invalidos: number;
  duplicados: number;
};

export type RecruitmentImportResult = {
  candidates: RecruitmentCandidate[];
  summary: RecruitmentImportSummary;
};

const expectedHeaders = ["nome", "telefone", "email", "cidade", "cargo", "fonte", "status"] as const;

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function detectDelimiter(line: string) {
  let commaCount = 0;
  let semicolonCount = 0;
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') quoted = !quoted;
    if (!quoted && char === ",") commaCount += 1;
    if (!quoted && char === ";") semicolonCount += 1;
  }

  return semicolonCount > commaCount ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: "," | ";") {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseRecruitmentCsv(csv: string): RecruitmentImportResult {
  const lines = csv
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return { candidates: [], summary: { total: 0, validos: 0, invalidos: 0, duplicados: 0 } };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headerCells = splitCsvLine(lines[0], delimiter).map(normalizeHeader);
  const headerMap = new Map<string, number>();
  headerCells.forEach((header, index) => headerMap.set(header, index));

  const requiredHeaders = ["nome", "telefone"] as const;
  const missingHeaders = requiredHeaders.filter((header) => !headerMap.has(header));
  if (missingHeaders.length) {
    throw new Error(`CSV invalido: coluna obrigatoria ausente (${missingHeaders.join(", ")}).`);
  }

  const rows = lines.slice(1).map((line) => splitCsvLine(line, delimiter));
  if (!rows.length) {
    throw new Error("CSV invalido: nenhuma linha de candidato encontrada.");
  }
  const phones = new Map<string, number>();
  const emails = new Map<string, number>();

  const candidates = rows.map((row) => {
    const get = (field: (typeof expectedHeaders)[number]) => row[headerMap.get(field) ?? -1]?.trim() || "";
    return {
      nome: get("nome"),
      telefone: get("telefone"),
      email: get("email"),
      cidade: get("cidade"),
      cargo: get("cargo"),
      fonte: get("fonte"),
      status: "Valido" as RecruitmentCandidate["status"]
    };
  });

  for (const candidate of candidates) {
    const phone = normalizePhone(candidate.telefone);
    const email = candidate.email.trim().toLowerCase();

    if (phone) phones.set(phone, (phones.get(phone) || 0) + 1);
    if (email) emails.set(email, (emails.get(email) || 0) + 1);
  }

  const validated = candidates.map((candidate) => {
    const phone = normalizePhone(candidate.telefone);
    const email = candidate.email.trim().toLowerCase();

    if (!candidate.nome.trim() || !phone) {
      return { ...candidate, status: "Invalido" as const };
    }

    if ((phone && (phones.get(phone) || 0) > 1) || (email && (emails.get(email) || 0) > 1)) {
      return { ...candidate, status: "Duplicado" as const };
    }

    return candidate;
  });

  return {
    candidates: validated,
    summary: {
      total: validated.length,
      validos: validated.filter((candidate) => candidate.status === "Valido").length,
      invalidos: validated.filter((candidate) => candidate.status === "Invalido").length,
      duplicados: validated.filter((candidate) => candidate.status === "Duplicado").length
    }
  };
}
