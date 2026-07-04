import type { ContactHistoryItem, RecruitmentCandidate, RecruitmentSettings, SendQueueItem } from "./recruitment-types";

export type RecruitmentCandidateRow = {
  nome: string;
  telefone: string;
  telefone_normalizado?: string;
  email?: string | null;
  email_normalizado?: string | null;
  cidade?: string | null;
  cargo?: string | null;
  fonte?: string | null;
  status: RecruitmentCandidate["status"];
  import_batch_id?: string | null;
  raw?: Record<string, unknown>;
};

export type RecruitmentQueueRow = {
  nome: string;
  telefone: string;
  telefone_normalizado?: string;
  fonte?: string | null;
  cargo?: string | null;
  data_apresentacao: string;
  horario_apresentacao: string;
  apresentacao: string;
  mensagem: string;
  status_envio: SendQueueItem["status_envio"];
  import_batch_id?: string | null;
  raw?: Record<string, unknown>;
};

export type RecruitmentContactHistoryRow = {
  nome: string;
  telefone: string;
  telefone_normalizado?: string;
  fonte?: string | null;
  data_envio: string;
  data_apresentacao: string;
  status: ContactHistoryItem["status"];
  mensagem: string;
  data?: string | null;
  import_batch_id?: string | null;
  raw?: Record<string, unknown>;
};

export type RecruitmentSettingsRow = {
  id?: string;
  quantidade_por_dia: number;
  horario_envio: string;
  dias_apresentacao: string[];
  horario_apresentacao: string;
  raw?: Record<string, unknown>;
};

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

export function candidateRowToRecruitmentCandidate(row: RecruitmentCandidateRow): RecruitmentCandidate {
  return {
    nome: row.nome,
    telefone: row.telefone,
    email: row.email || "",
    cidade: row.cidade || "",
    cargo: row.cargo || "",
    fonte: row.fonte || "",
    status: row.status
  };
}

export function recruitmentCandidateToDbInsert(candidate: RecruitmentCandidate): RecruitmentCandidateRow {
  return {
    ...candidate,
    telefone_normalizado: normalizePhone(candidate.telefone),
    email_normalizado: normalizeEmail(candidate.email),
    raw: candidate
  };
}

export function queueRowToSendQueueItem(row: RecruitmentQueueRow, index = 0): SendQueueItem {
  return {
    id: index + 1,
    nome: row.nome,
    telefone: row.telefone,
    fonte: row.fonte || "",
    cargo: row.cargo || "",
    data_apresentacao: row.data_apresentacao,
    horario_apresentacao: row.horario_apresentacao,
    apresentacao: row.apresentacao,
    mensagem: row.mensagem,
    status_envio: row.status_envio
  };
}

export function sendQueueItemToDbInsert(item: SendQueueItem): RecruitmentQueueRow {
  return {
    nome: item.nome,
    telefone: item.telefone,
    telefone_normalizado: normalizePhone(item.telefone),
    fonte: item.fonte,
    cargo: item.cargo,
    data_apresentacao: item.data_apresentacao,
    horario_apresentacao: item.horario_apresentacao,
    apresentacao: item.apresentacao,
    mensagem: item.mensagem,
    status_envio: item.status_envio,
    raw: item
  };
}

export function historyRowToContactHistoryItem(row: RecruitmentContactHistoryRow): ContactHistoryItem {
  const rawHistory = row.raw as Partial<ContactHistoryItem> | undefined;
  const rawOrigem = rawHistory?.origem === "WhatsApp" || rawHistory?.origem === "Simulacao" ? rawHistory.origem : undefined;

  return {
    nome: row.nome,
    telefone: row.telefone,
    fonte: row.fonte || "",
    data_envio: row.data_envio,
    data_apresentacao: row.data_apresentacao,
    status: row.status,
    mensagem: row.mensagem,
    data: row.data || row.data_envio,
    origem: rawOrigem,
    messageId: typeof rawHistory?.messageId === "string" ? rawHistory.messageId : undefined,
    envioDateKey: typeof rawHistory?.envioDateKey === "string" ? rawHistory.envioDateKey : undefined
  };
}

function toDbTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

export function contactHistoryItemToDbInsert(item: ContactHistoryItem): RecruitmentContactHistoryRow {
  return {
    nome: item.nome,
    telefone: item.telefone,
    telefone_normalizado: normalizePhone(item.telefone),
    fonte: item.fonte,
    data_envio: toDbTimestamp(item.data_envio),
    data_apresentacao: item.data_apresentacao,
    status: item.status,
    mensagem: item.mensagem,
    data: item.data,
    raw: item
  };
}

export function settingsRowToRecruitmentSettings(row: RecruitmentSettingsRow): RecruitmentSettings {
  const rawSettings = row.raw as Partial<RecruitmentSettings> | undefined;

  return {
    quantidadePorDia: row.quantidade_por_dia,
    horarioEnvio: row.horario_envio,
    diasApresentacao: row.dias_apresentacao,
    horarioApresentacao: row.horario_apresentacao,
    limiteDiario: rawSettings?.limiteDiario ?? row.quantidade_por_dia,
    limiteSemanal: rawSettings?.limiteSemanal ?? 50,
    limiteMensal: rawSettings?.limiteMensal ?? 200,
    orcamentoMensalWhatsApp: rawSettings?.orcamentoMensalWhatsApp ?? 100
  };
}

export function recruitmentSettingsToDbUpsert(settings: RecruitmentSettings): RecruitmentSettingsRow {
  return {
    id: "default",
    quantidade_por_dia: settings.quantidadePorDia,
    horario_envio: settings.horarioEnvio,
    dias_apresentacao: settings.diasApresentacao,
    horario_apresentacao: settings.horarioApresentacao,
    raw: settings
  };
}
