import type {
  ContactHistoryItem,
  RecruitmentCandidate,
  RecruitmentPresentation,
  RecruitmentPresentationCandidate,
  RecruitmentPresentationCandidateStatus,
  RecruitmentPresentationStatus,
  RecruitmentSettings,
  SendQueueItem
} from "./recruitment-types";

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
  funil_status?: RecruitmentCandidate["funilStatus"] | null;
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

export type RecruitmentPresentationRow = {
  id: string;
  titulo: string;
  data: string;
  horario: string;
  status: RecruitmentPresentationStatus;
  observacao?: string | null;
  raw?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type RecruitmentPresentationCandidateRow = {
  id: string;
  presentation_id: string;
  candidate_id?: string | null;
  nome?: string;
  telefone?: string;
  telefone_normalizado: string;
  email?: string | null;
  fonte?: string | null;
  status_participacao: RecruitmentPresentationCandidateStatus;
  raw?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null;
}

export function candidateRowToRecruitmentCandidate(row: RecruitmentCandidateRow): RecruitmentCandidate {
  const rawCandidate = row.raw as Partial<RecruitmentCandidate> | undefined;

  return {
    nome: row.nome,
    telefone: row.telefone,
    email: row.email || "",
    cidade: row.cidade || "",
    cargo: row.cargo || "",
    fonte: row.fonte || "",
    status: row.status,
    funilStatus: row.funil_status || rawCandidate?.funilStatus
  };
}

export function recruitmentCandidateToDbInsert(candidate: RecruitmentCandidate): RecruitmentCandidateRow {
  const row: RecruitmentCandidateRow = {
    nome: candidate.nome,
    telefone: candidate.telefone,
    email: candidate.email,
    cidade: candidate.cidade,
    cargo: candidate.cargo,
    fonte: candidate.fonte,
    status: candidate.status,
    telefone_normalizado: normalizePhone(candidate.telefone),
    email_normalizado: normalizeEmail(candidate.email),
    raw: candidate
  };

  if (candidate.funilStatus) {
    row.funil_status = candidate.funilStatus;
  }

  return row;
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
  const rawOrigem =
    rawHistory?.origem === "WhatsApp" ||
    rawHistory?.origem === "Simulacao" ||
    rawHistory?.origem === "Manual" ||
    rawHistory?.origem === "WhatsApp Webhook"
      ? rawHistory.origem
      : undefined;

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
    envioDateKey: typeof rawHistory?.envioDateKey === "string" ? rawHistory.envioDateKey : undefined,
    funilStatus: rawHistory?.funilStatus,
    templateName: typeof rawHistory?.templateName === "string" ? rawHistory.templateName : undefined,
    templateLabel: typeof rawHistory?.templateLabel === "string" ? rawHistory.templateLabel : undefined,
    dataApresentacao: typeof rawHistory?.dataApresentacao === "string" ? rawHistory.dataApresentacao : undefined,
    horarioApresentacao: typeof rawHistory?.horarioApresentacao === "string" ? rawHistory.horarioApresentacao : undefined,
    presentationId: typeof rawHistory?.presentationId === "string" ? rawHistory.presentationId : undefined,
    presentationTitle: typeof rawHistory?.presentationTitle === "string" ? rawHistory.presentationTitle : undefined,
    participationStatus: rawHistory?.participationStatus,
    raw: row.raw
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

export function presentationRowToRecruitmentPresentation(
  row: RecruitmentPresentationRow,
  candidates: RecruitmentPresentationCandidate[] = []
): RecruitmentPresentation {
  return {
    id: row.id,
    titulo: row.titulo,
    data: row.data,
    horario: row.horario,
    status: row.status,
    observacao: row.observacao || "",
    candidates,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function recruitmentPresentationToDbUpsert(presentation: RecruitmentPresentation): RecruitmentPresentationRow {
  return {
    id: presentation.id,
    titulo: presentation.titulo,
    data: presentation.data,
    horario: presentation.horario,
    status: presentation.status,
    observacao: presentation.observacao,
    raw: presentation
  };
}

export function presentationCandidateRowToRecruitmentPresentationCandidate(
  row: RecruitmentPresentationCandidateRow
): RecruitmentPresentationCandidate {
  const rawCandidate = row.raw as Partial<RecruitmentPresentationCandidate> | undefined;

  return {
    id: row.id,
    presentationId: row.presentation_id,
    nome: row.nome || rawCandidate?.nome || "",
    telefone: row.telefone || rawCandidate?.telefone || row.telefone_normalizado,
    email: row.email || rawCandidate?.email || "",
    fonte: row.fonte || rawCandidate?.fonte || "",
    statusParticipacao: row.status_participacao,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function recruitmentPresentationCandidateToDbUpsert(
  candidate: RecruitmentPresentationCandidate
): RecruitmentPresentationCandidateRow {
  return {
    id: candidate.id,
    presentation_id: candidate.presentationId,
    telefone_normalizado: normalizePhone(candidate.telefone),
    status_participacao: candidate.statusParticipacao,
    raw: candidate
  };
}
