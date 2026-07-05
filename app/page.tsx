"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  Gauge,
  Home,
  KeyRound,
  LineChart as LineChartIcon,
  Lock,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Users
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { brokers, clients, conversionByMonth, folders, funnel, heatmap, insights } from "@/lib/data";
import { parseRecruitmentCsv } from "@/lib/recruitment-import";
import type { RecruitmentImportSummary } from "@/lib/recruitment-import";
import { candidateList, contactHistory, importedCandidates, recruitmentSettings as defaultRecruitmentSettings, sendQueue } from "@/lib/recruitment-data";
import { generateTodaySendQueue } from "@/lib/recruitment-scheduler";
import { clearRecruitmentStorage, loadRecruitmentStorage, saveRecruitmentStorage } from "@/lib/recruitment-storage";
import type {
  ContactHistoryItem,
  RecruitmentCandidate,
  RecruitmentFunnelStatus,
  RecruitmentPresentation,
  RecruitmentPresentationCandidateStatus,
  RecruitmentSettings as RecruitmentSettingsType,
  SendQueueItem
} from "@/lib/recruitment-types";
import { getCandidates, saveCandidates } from "@/services/recruitment/candidates.service";
import { getContactHistory, saveContactHistory } from "@/services/recruitment/history.service";
import { getPresentations, savePresentationCandidate, savePresentations } from "@/services/recruitment/presentations.service";
import { getQueue, saveQueue } from "@/services/recruitment/queue.service";
import { loadSettings, saveSettings } from "@/services/recruitment/settings.service";
import { analyzeBroker, analyzeClient } from "@/lib/scoring";
import { maskCpf } from "@/lib/security";

type BrokerRow = (typeof brokers)[number] & { analise: ReturnType<typeof analyzeBroker> };
type ClientRow = Omit<(typeof clients)[number], "cpf"> & { cpf: string; analise: ReturnType<typeof analyzeClient> };

type ModuleKey =
  | "executivo"
  | "dashboard-corretores"
  | "cadastro-corretores"
  | "performance"
  | "ipc-corretor"
  | "ranking"
  | "relatorios-corretores"
  | "historico-operacional"
  | "conversao-corretores"
  | "metas"
  | "analise-preditiva-corretores"
  | "dashboard-clientes"
  | "cadastro-clientes"
  | "leads"
  | "funil-clientes"
  | "pastas"
  | "ipc-cliente"
  | "aprovacao-bancaria"
  | "perfil-financeiro"
  | "historico-atendimento"
  | "relatorios-conversao"
  | "inteligencia-compra"
  | "dashboard-recrutamento"
  | "operacao-dia"
  | "importar-candidatos"
  | "candidatos-recrutamento"
  | "fila-envio"
  | "apresentacoes-recrutamento"
  | "relatorios-recrutamento"
  | "historico-contatos"
  | "configuracoes-recrutamento";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const percent = (value: number) => `${value}%`;

const brokerNav: { key: ModuleKey; label: string }[] = [
  { key: "dashboard-corretores", label: "Dashboard Corretores" },
  { key: "cadastro-corretores", label: "Cadastro de Corretores" },
  { key: "performance", label: "Performance" },
  { key: "ipc-corretor", label: "IPC Corretor" },
  { key: "ranking", label: "Ranking" },
  { key: "relatorios-corretores", label: "Relatorios" },
  { key: "historico-operacional", label: "Historico Operacional" },
  { key: "conversao-corretores", label: "Conversao" },
  { key: "metas", label: "Metas" },
  { key: "analise-preditiva-corretores", label: "Analise Preditiva" }
];

const clientNav: { key: ModuleKey; label: string }[] = [
  { key: "dashboard-clientes", label: "Dashboard Clientes" },
  { key: "cadastro-clientes", label: "Cadastro de Clientes" },
  { key: "leads", label: "Leads" },
  { key: "funil-clientes", label: "Funil Comercial" },
  { key: "pastas", label: "Pastas" },
  { key: "ipc-cliente", label: "IPC Cliente" },
  { key: "aprovacao-bancaria", label: "Aprovacao Bancaria" },
  { key: "perfil-financeiro", label: "Perfil Financeiro" },
  { key: "historico-atendimento", label: "Historico de Atendimento" },
  { key: "relatorios-conversao", label: "Relatorios de Conversao" },
  { key: "inteligencia-compra", label: "Inteligencia de Compra" }
];

const recruitmentNav: { key: ModuleKey; label: string }[] = [
  { key: "dashboard-recrutamento", label: "Dashboard Recrutamento" },
  { key: "operacao-dia", label: "Operação do Dia" },
  { key: "importar-candidatos", label: "Importar Candidatos" },
  { key: "candidatos-recrutamento", label: "Candidatos" },
  { key: "fila-envio", label: "Fila de Envio" },
  { key: "apresentacoes-recrutamento", label: "Apresentações" },
  { key: "relatorios-recrutamento", label: "Relatórios" },
  { key: "historico-contatos", label: "Histórico de Contatos" },
  { key: "configuracoes-recrutamento", label: "Configurações" }
];

const showLegacyCrmAreas = false;

const titles: Record<ModuleKey, { eyebrow: string; title: string }> = {
  executivo: { eyebrow: "Visao geral conectando corretores, clientes, pastas e vendas", title: "Dashboard Executivo Geral" },
  "dashboard-corretores": { eyebrow: "Area de Corretores", title: "Dashboard Corretores" },
  "cadastro-corretores": { eyebrow: "Area de Corretores", title: "Cadastro de Corretores" },
  performance: { eyebrow: "Area de Corretores", title: "Performance Comercial" },
  "ipc-corretor": { eyebrow: "Area de Corretores", title: "IPC Corretor" },
  ranking: { eyebrow: "Area de Corretores", title: "Ranking" },
  "relatorios-corretores": { eyebrow: "Area de Corretores", title: "Relatorios de Corretores" },
  "historico-operacional": { eyebrow: "Area de Corretores", title: "Historico Operacional" },
  "conversao-corretores": { eyebrow: "Area de Corretores", title: "Conversao por Corretor" },
  metas: { eyebrow: "Area de Corretores", title: "Metas" },
  "analise-preditiva-corretores": { eyebrow: "Area de Corretores", title: "Analise Preditiva de Corretores" },
  "dashboard-clientes": { eyebrow: "Area de Clientes", title: "Dashboard Clientes" },
  "cadastro-clientes": { eyebrow: "Area de Clientes", title: "Cadastro de Clientes" },
  leads: { eyebrow: "Area de Clientes", title: "Gestao de Leads" },
  "funil-clientes": { eyebrow: "Area de Clientes", title: "Funil Comercial" },
  pastas: { eyebrow: "Area de Clientes", title: "Pastas" },
  "ipc-cliente": { eyebrow: "Area de Clientes", title: "IPC Cliente" },
  "aprovacao-bancaria": { eyebrow: "Area de Clientes", title: "Aprovacao Bancaria" },
  "perfil-financeiro": { eyebrow: "Area de Clientes", title: "Perfil Financeiro" },
  "historico-atendimento": { eyebrow: "Area de Clientes", title: "Historico de Atendimento" },
  "relatorios-conversao": { eyebrow: "Area de Clientes", title: "Relatorios de Conversao" },
  "inteligencia-compra": { eyebrow: "Area de Clientes", title: "Inteligencia de Compra" },
  "dashboard-recrutamento": { eyebrow: "Area de Recrutamento", title: "Dashboard Recrutamento" },
  "operacao-dia": { eyebrow: "Area de Recrutamento", title: "Operação do Dia" },
  "importar-candidatos": { eyebrow: "Area de Recrutamento", title: "Importar Candidatos" },
  "candidatos-recrutamento": { eyebrow: "Area de Recrutamento", title: "Candidatos" },
  "fila-envio": { eyebrow: "Area de Recrutamento", title: "Fila de Envio" },
  "apresentacoes-recrutamento": { eyebrow: "Area de Recrutamento", title: "Apresentações" },
  "relatorios-recrutamento": { eyebrow: "Area de Recrutamento", title: "Relatórios" },
  "historico-contatos": { eyebrow: "Area de Recrutamento", title: "Histórico de Contatos" },
  "configuracoes-recrutamento": { eyebrow: "Area de Recrutamento", title: "Configurações" }
};

const chartColors = {
  navy: "#082C44",
  ocean: "#155C7C",
  royal: "#0A4B86",
  sky: "#6C9BD2",
  gold: "#C7A269",
  green: "#14735B",
  grid: "#E7EDF2",
  steel: "#5C6E7C"
};

const radar = [
  { metric: "Produtividade", value: 86 },
  { metric: "Resposta", value: 82 },
  { metric: "Visitas", value: 79 },
  { metric: "Propostas", value: 76 },
  { metric: "Conversao", value: 88 },
  { metric: "Follow-up", value: 91 }
];

function scoreTone(score: number) {
  if (score >= 75) return "bg-success text-white";
  if (score >= 55) return "bg-warning text-white";
  return "bg-steel text-white";
}

function exportCsv(filename: string, rows: Record<string, string | number | boolean>[]) {
  const headers = Object.keys(rows[0] ?? {});
  const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-white shadow-panel ${className}`}>{children}</section>;
}

function SectionTitle({ icon: Icon, title, action }: { icon: typeof Activity; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-navy text-white">
          <Icon size={18} />
        </span>
        <h2 className="truncate text-base font-semibold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Metric({ label, value, icon: Icon, detail }: { label: string; value: string; icon: typeof Activity; detail: string }) {
  return (
    <Card className="home-life-card p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(6,26,36,0.13)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-steel">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-md bg-[#EAF1F6] text-navy ring-1 ring-navy/5">
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-3 text-sm text-steel">{detail}</p>
    </Card>
  );
}

function NavButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-9 w-full items-center rounded-md px-3 text-left text-sm ${
        active ? "bg-white text-ink shadow-sm" : "text-white/68 hover:bg-white/10 hover:text-white"
      }`}
      title={label}
    >
      <span className="truncate">{label}</span>
    </button>
  );
}

function MiniProgress({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white/90 p-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-steel">{percent(value)}</span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-mist">
        <div className="h-2 rounded-full bg-gradient-to-r from-navy via-ocean to-gold" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function BrokerTable({ rows }: { rows: BrokerRow[] }) {
  return (
    <div className="overflow-x-auto thin-scrollbar">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-mist text-xs uppercase tracking-normal text-steel">
          <tr>
            <th className="px-5 py-3">Corretor</th>
            <th className="px-5 py-3">Pastas</th>
            <th className="px-5 py-3">Leads atendidos</th>
            <th className="px-5 py-3">Visitas</th>
            <th className="px-5 py-3">Propostas</th>
            <th className="px-5 py-3">IPC</th>
            <th className="px-5 py-3">Venda 30d</th>
            <th className="px-5 py-3">Risco</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((broker) => (
            <tr key={broker.id}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={broker.foto} alt="" className="h-10 w-10 rounded-md object-cover" />
                  <div>
                    <p className="font-semibold text-ink">{broker.nome}</p>
                    <p className="text-xs text-steel">{broker.equipe}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">{broker.pastas_subidas}</td>
              <td className="px-5 py-4">{broker.leads_respondidos}</td>
              <td className="px-5 py-4">{broker.visitas_realizadas}</td>
              <td className="px-5 py-4">{broker.propostas_enviadas}</td>
              <td className="px-5 py-4">
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${scoreTone(broker.analise.ipc)}`}>{broker.analise.ipc}</span>
              </td>
              <td className="px-5 py-4">{percent(broker.analise.venda30)}</td>
              <td className="px-5 py-4">{percent(broker.analise.riscoBaixaPerformance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClientTable({ rows }: { rows: ClientRow[] }) {
  return (
    <div className="overflow-x-auto thin-scrollbar">
      <table className="w-full min-w-[840px] text-left text-sm">
        <thead className="bg-mist text-xs uppercase tracking-normal text-steel">
          <tr>
            <th className="px-5 py-3">Cliente</th>
            <th className="px-5 py-3">Renda</th>
            <th className="px-5 py-3">Entrada + FGTS</th>
            <th className="px-5 py-3">Score financeiro</th>
            <th className="px-5 py-3">Compra</th>
            <th className="px-5 py-3">Aprovacao</th>
            <th className="px-5 py-3">Nivel</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((client) => (
            <tr key={client.id}>
              <td className="px-5 py-4">
                <p className="font-semibold text-ink">{client.nome_cliente}</p>
                <p className="text-xs text-steel">{client.cpf} - {client.cidade}</p>
              </td>
              <td className="px-5 py-4">{money.format(client.renda_mensal)}</td>
              <td className="px-5 py-4">{money.format(client.valor_entrada + client.fgts_disponivel)}</td>
              <td className="px-5 py-4">{client.score_credito}</td>
              <td className="px-5 py-4">{percent(client.analise.chanceCompra)}</td>
              <td className="px-5 py-4">{percent(client.analise.chanceAprovacao)}</td>
              <td className="px-5 py-4">
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${scoreTone(client.analise.ipc)}`}>{client.analise.nivelLead}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const brokerRows = brokers.map((broker) => ({ ...broker, analise: analyzeBroker(broker) })).sort((a, b) => b.analise.ipc - a.analise.ipc);
const clientRows = clients.map((client) => ({ ...client, cpf: maskCpf(client.cpf), analise: analyzeClient(client) })).sort((a, b) => b.analise.ipc - a.analise.ipc);

const recruitmentFunnelStatuses: RecruitmentFunnelStatus[] = [
  "Novo candidato",
  "Na fila de envio",
  "WhatsApp enviado",
  "Respondeu",
  "Confirmou interesse",
  "Apresentação agendada",
  "Compareceu",
  "Não compareceu",
  "Sem interesse",
  "Telefone inválido"
];

const candidateFunnelFilters: Array<"Todos" | RecruitmentFunnelStatus> = [
  "Todos",
  "Novo candidato",
  "Na fila de envio",
  "WhatsApp enviado",
  "Respondeu",
  "Confirmou interesse",
  "Apresentação agendada",
  "Compareceu",
  "Não compareceu",
  "Sem interesse",
  "Telefone inválido"
];

const candidateQuickFunnelActions: RecruitmentFunnelStatus[] = [
  "Respondeu",
  "Confirmou interesse",
  "Apresentação agendada",
  "Compareceu",
  "Não compareceu",
  "Sem interesse",
  "Telefone inválido"
];

type RecruitmentReportPeriod = "hoje" | "7d" | "30d" | "todos";
type ContactHistoryFilter = "Todos" | "WhatsApp" | "Manual" | "alteracao_funil" | "envio_whatsapp" | "apresentacao";

const recruitmentReportPeriods: { key: RecruitmentReportPeriod; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "7d", label: "Ultimos 7 dias" },
  { key: "30d", label: "Ultimos 30 dias" },
  { key: "todos", label: "Todos" }
];

const contactHistoryFilters: { key: ContactHistoryFilter; label: string }[] = [
  { key: "Todos", label: "Todos" },
  { key: "WhatsApp", label: "WhatsApp" },
  { key: "Manual", label: "Manual" },
  { key: "alteracao_funil", label: "Alteração de funil" },
  { key: "envio_whatsapp", label: "Envio WhatsApp" },
  { key: "apresentacao", label: "Apresentação/turma" }
];

const participationOptions: RecruitmentPresentationCandidateStatus[] = [
  "confirmou_presenca",
  "compareceu",
  "nao_compareceu",
  "sem_interesse"
];

function getFunnelStatusClass(status: RecruitmentFunnelStatus) {
  if (status === "Confirmou interesse") return "bg-success/10 text-success";
  if (status === "Apresentação agendada") return "bg-gold/15 text-navy";
  if (status === "Compareceu") return "bg-navy text-white";
  if (status === "Sem interesse") return "bg-danger/10 text-danger";
  if (status === "Telefone inválido") return "bg-danger/10 text-danger";
  return "bg-mist text-navy";
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getParticipationLabel(status: RecruitmentPresentationCandidateStatus) {
  const labels: Record<RecruitmentPresentationCandidateStatus, string> = {
    agendado: "Agendado",
    confirmou_presenca: "Confirmou presenca",
    compareceu: "Compareceu",
    nao_compareceu: "Nao compareceu",
    sem_interesse: "Sem interesse"
  };
  return labels[status];
}

function getFunnelStatusFromParticipation(status: RecruitmentPresentationCandidateStatus): RecruitmentFunnelStatus {
  if (status === "compareceu") return "Compareceu";
  if (status === "nao_compareceu") return "Não compareceu";
  if (status === "sem_interesse") return "Sem interesse";
  return "Confirmou interesse";
}

function getDefaultPresentationDate() {
  const nextDate = new Date();
  const currentDay = nextDate.getDay();
  const daysUntilTuesday = (2 - currentDay + 7) % 7 || 7;
  nextDate.setDate(nextDate.getDate() + daysUntilTuesday);
  return getLocalDateKey(nextDate);
}

function getCandidateKey(candidate: Pick<RecruitmentCandidate, "telefone" | "email" | "nome">) {
  return normalizeQueuePhone(candidate.telefone) || candidate.email.trim().toLowerCase() || candidate.nome.trim().toLowerCase();
}

function mergeStoredCandidateFunnel(candidates: RecruitmentCandidate[], storedCandidates: RecruitmentCandidate[] | null) {
  if (!storedCandidates?.length) return candidates;
  const storedByKey = new Map(storedCandidates.map((candidate) => [getCandidateKey(candidate), candidate]));

  return candidates.map((candidate) => {
    const storedCandidate = storedByKey.get(getCandidateKey(candidate));
    return storedCandidate?.funilStatus ? { ...candidate, funilStatus: storedCandidate.funilStatus } : candidate;
  });
}

function getHistoryMergeKey(item: ContactHistoryItem) {
  return `${normalizeQueuePhone(item.telefone)}-${item.data_envio}-${item.status}-${item.funilStatus || ""}-${item.messageId || ""}`;
}

function mergeStoredHistory(supabaseHistory: ContactHistoryItem[], storedHistory: ContactHistoryItem[] | null) {
  if (!storedHistory?.length) return supabaseHistory;
  const knownKeys = new Set(supabaseHistory.map(getHistoryMergeKey));
  const localOnlyHistory = storedHistory.filter((item) => !knownKeys.has(getHistoryMergeKey(item)));
  return [...localOnlyHistory, ...supabaseHistory];
}

async function loadRecruitmentDataSnapshot() {
  const stored = loadRecruitmentStorage();
  let nextCandidates = stored.candidates ?? importedCandidates;
  let nextQueue = stored.queue ?? sendQueue;
  let nextHistory = stored.history ?? contactHistory;
  let nextSettings = normalizeRecruitmentSettings(stored.settings ?? defaultRecruitmentSettings);
  let nextPresentations = stored.presentations ?? [];

  try {
    const supabaseCandidates = await getCandidates();
    if (supabaseCandidates.length) nextCandidates = mergeStoredCandidateFunnel(supabaseCandidates, stored.candidates);
  } catch (error) {
    console.error("Falha ao carregar recruitment_candidates do Supabase. Usando localStorage.", error);
  }

  try {
    const supabaseQueue = await getQueue();
    if (supabaseQueue.length) nextQueue = supabaseQueue;
  } catch (error) {
    console.error("Falha ao carregar recruitment_queue do Supabase. Usando localStorage.", error);
  }

  try {
    const supabaseHistory = await getContactHistory();
    if (supabaseHistory.length) nextHistory = mergeStoredHistory(supabaseHistory, stored.history);
  } catch (error) {
    console.error("Falha ao carregar recruitment_contact_history do Supabase. Usando localStorage.", error);
  }

  try {
    const supabaseSettings = await loadSettings();
    if (supabaseSettings) nextSettings = normalizeRecruitmentSettings(supabaseSettings);
  } catch (error) {
    console.error("Falha ao carregar recruitment_settings do Supabase. Usando localStorage.", error);
  }

  try {
    const supabasePresentations = await getPresentations();
    if (supabasePresentations.length) nextPresentations = supabasePresentations;
  } catch (error) {
    console.error("Falha ao carregar recruitment_presentations do Supabase. Usando localStorage.", error);
  }

  return {
    candidates: nextCandidates,
    queue: nextQueue,
    history: nextHistory,
    settings: nextSettings,
    presentations: nextPresentations
  };
}

function normalizeRecruitmentSettings(settings: RecruitmentSettingsType): RecruitmentSettingsType {
  return {
    ...defaultRecruitmentSettings,
    ...settings,
    quantidadePorDia: Number(settings.quantidadePorDia) >= 1 ? Number(settings.quantidadePorDia) : defaultRecruitmentSettings.quantidadePorDia,
    limiteDiario: Number(settings.limiteDiario) >= 1 ? Number(settings.limiteDiario) : defaultRecruitmentSettings.limiteDiario,
    limiteSemanal: Number(settings.limiteSemanal) >= 1 ? Number(settings.limiteSemanal) : defaultRecruitmentSettings.limiteSemanal,
    limiteMensal: Number(settings.limiteMensal) >= 1 ? Number(settings.limiteMensal) : defaultRecruitmentSettings.limiteMensal,
    orcamentoMensalWhatsApp: Number(settings.orcamentoMensalWhatsApp) >= 0 ? Number(settings.orcamentoMensalWhatsApp) : defaultRecruitmentSettings.orcamentoMensalWhatsApp,
    diasApresentacao: settings.diasApresentacao.length ? settings.diasApresentacao : defaultRecruitmentSettings.diasApresentacao,
    horarioApresentacao: "14:00"
  };
}

function normalizeQueuePhone(telefone: string) {
  return telefone.replace(/\D/g, "");
}

function isValidQueuePhone(telefone: string) {
  const normalizedPhone = normalizeQueuePhone(telefone);
  return normalizedPhone.length >= 12 && normalizedPhone.length <= 13 && normalizedPhone.startsWith("55");
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getHistoryDateKey(item: ContactHistoryItem) {
  if (item.envioDateKey) return item.envioDateKey;

  const sourceDate = item.data_envio || item.data;
  const parsed = Date.parse(sourceDate);
  if (!Number.isNaN(parsed)) return getLocalDateKey(new Date(parsed));

  const localDateMatch = sourceDate.match(/^(\d{2})\/(\d{2})/);
  if (!localDateMatch) return "";

  const currentYear = new Date().getFullYear();
  return `${currentYear}-${localDateMatch[2]}-${localDateMatch[1]}`;
}

function getWhatsAppDailyLimit(settings: RecruitmentSettingsType) {
  return Number(settings.limiteDiario) >= 1 ? Number(settings.limiteDiario) : 10;
}

function isWhatsAppHistoryForDate(item: ContactHistoryItem, dateKey: string) {
  return item.status === "mensagem_enviada" && item.origem === "WhatsApp" && getHistoryDateKey(item) === dateKey;
}

function getPeriodStartDateKey(period: RecruitmentReportPeriod) {
  if (period === "todos") return "";
  const date = new Date();
  if (period === "7d") date.setDate(date.getDate() - 6);
  if (period === "30d") date.setDate(date.getDate() - 29);
  return getLocalDateKey(date);
}

function isDateInReportPeriod(dateKey: string, period: RecruitmentReportPeriod) {
  if (period === "todos") return true;
  if (!dateKey) return false;
  return dateKey >= getPeriodStartDateKey(period) && dateKey <= getLocalDateKey();
}

function formatReportRate(value: number, base: number) {
  if (!base) return "0%";
  return `${Math.round((value / base) * 100)}%`;
}

export default function Page() {
  const [active, setActive] = useState<ModuleKey>("dashboard-recrutamento");
  const [importRows, setImportRows] = useState<RecruitmentCandidate[]>(importedCandidates);
  const [importSummary, setImportSummary] = useState<RecruitmentImportSummary | null>(null);
  const [importError, setImportError] = useState("");
  const [generatedQueue, setGeneratedQueue] = useState<SendQueueItem[]>(sendQueue);
  const [contactHistoryRows, setContactHistoryRows] = useState<ContactHistoryItem[]>(contactHistory);
  const [recruitmentSettingsState, setRecruitmentSettingsState] = useState<RecruitmentSettingsType>(defaultRecruitmentSettings);
  const [settingsDraft, setSettingsDraft] = useState<RecruitmentSettingsType>(defaultRecruitmentSettings);
  const [presentationRows, setPresentationRows] = useState<RecruitmentPresentation[]>([]);
  const [presentationDraft, setPresentationDraft] = useState({
    titulo: "Apresentacao Home Life",
    data: getDefaultPresentationDate(),
    horario: defaultRecruitmentSettings.horarioApresentacao,
    observacao: ""
  });
  const [selectedPresentationId, setSelectedPresentationId] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [isRecruitmentRefreshing, setIsRecruitmentRefreshing] = useState(false);
  const [sendingQueueItemId, setSendingQueueItemId] = useState<number | null>(null);
  const [whatsappSendFeedback, setWhatsappSendFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [candidateFunnelFilter, setCandidateFunnelFilter] = useState<"Todos" | RecruitmentFunnelStatus>("Todos");
  const [recruitmentReportPeriod, setRecruitmentReportPeriod] = useState<RecruitmentReportPeriod>("todos");
  const [recruitmentReportSource, setRecruitmentReportSource] = useState("Todas");
  const [contactHistoryFilter, setContactHistoryFilter] = useState<ContactHistoryFilter>("Todos");
  const [contactHistorySearch, setContactHistorySearch] = useState("");
  const latest = conversionByMonth[conversionByMonth.length - 1];
  const conversionRate = Math.round((latest.vendas / latest.leads) * 1000) / 10;
  const title = titles[active];
  const whatsappTodayDateKey = getLocalDateKey();
  const whatsappDailyLimit = getWhatsAppDailyLimit(recruitmentSettingsState);
  const whatsappSendsToday = contactHistoryRows.filter((item) => isWhatsAppHistoryForDate(item, whatsappTodayDateKey)).length;
  const whatsappHistoryRows = contactHistoryRows.filter((item) => item.origem === "WhatsApp");
  const lastWhatsAppSend = whatsappHistoryRows[0];

  const folderRows = useMemo(
    () =>
      folders.map((folder) => ({
        ...folder,
        corretor: brokers.find((broker) => broker.id === folder.corretor_id)?.nome ?? "",
        cliente: clients.find((client) => client.id === folder.cliente_id)?.nome_cliente ?? "",
        analiseCliente: analyzeClient(clients.find((client) => client.id === folder.cliente_id) ?? clients[0])
      })),
    []
  );

  const leadPie = [
    { name: "Quente", value: clientRows.filter((client) => client.analise.nivelLead === "Lead quente").length, color: chartColors.green },
    { name: "Morno", value: clientRows.filter((client) => client.analise.nivelLead === "Lead morno").length, color: "#B7791F" },
    { name: "Frio", value: clientRows.filter((client) => client.analise.nivelLead === "Lead frio").length, color: chartColors.steel }
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadInitialRecruitmentData() {
      const nextData = await loadRecruitmentDataSnapshot();

      if (cancelled) return;
      setImportRows(nextData.candidates);
      setGeneratedQueue(nextData.queue);
      setContactHistoryRows(nextData.history);
      setRecruitmentSettingsState(nextData.settings);
      setSettingsDraft(nextData.settings);
      setPresentationRows(nextData.presentations);
      setSelectedPresentationId(nextData.presentations[0]?.id || "");
      setStorageReady(true);
    }

    loadInitialRecruitmentData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveRecruitmentStorage({
      candidates: importRows,
      queue: generatedQueue,
      history: contactHistoryRows,
      settings: recruitmentSettingsState,
      presentations: presentationRows
    });
  }, [contactHistoryRows, generatedQueue, importRows, presentationRows, recruitmentSettingsState, storageReady]);

  async function handleRefreshRecruitmentData() {
    setIsRecruitmentRefreshing(true);
    try {
      const nextData = await loadRecruitmentDataSnapshot();
      setImportRows(nextData.candidates);
      setGeneratedQueue(nextData.queue);
      setContactHistoryRows(nextData.history);
      setRecruitmentSettingsState(nextData.settings);
      setSettingsDraft(nextData.settings);
      setPresentationRows(nextData.presentations);
      setSelectedPresentationId(nextData.presentations[0]?.id || "");
      saveRecruitmentStorage(nextData);
    } finally {
      setIsRecruitmentRefreshing(false);
    }
  }

  function handleCandidateCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = parseRecruitmentCsv(String(reader.result || ""));
        setImportRows(result.candidates);
        setImportSummary(result.summary);
        setImportError("");
        try {
          await saveCandidates(result.candidates);
        } catch (error) {
          console.error("Falha ao salvar candidatos no Supabase. Mantendo fluxo localStorage.", error);
        }
      } catch (error) {
        setImportError(error instanceof Error ? error.message : "Falha ao importar CSV.");
      }
    };
    reader.onerror = () => setImportError("Falha ao ler o arquivo CSV.");
    reader.readAsText(file, "utf-8");
  }

  async function handleGenerateQueue() {
    const queue = generateTodaySendQueue(importRows, recruitmentSettingsState);
    const queuePhones = new Set(queue.map((item) => normalizeQueuePhone(item.telefone)));
    setImportRows((current) =>
      current.map((candidate) =>
        queuePhones.has(normalizeQueuePhone(candidate.telefone)) && !candidate.funilStatus
          ? { ...candidate, funilStatus: "Na fila de envio" }
          : candidate
      )
    );
    setGeneratedQueue(queue);
    try {
      await saveQueue(queue);
    } catch (error) {
      console.error("Falha ao salvar fila no Supabase. Mantendo fluxo localStorage.", error);
    }
  }

  async function handleSimulateSend() {
    const now = new Date();
    const dataEnvio = now.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const pendingItems = generatedQueue.filter((item) => item.status_envio === "pendente_envio");

    if (!pendingItems.length) return;

    const existingKeys = new Set(contactHistoryRows.map((item) => `${item.telefone}-${item.data_apresentacao}-${item.status}`));
    const newItems = pendingItems
      .filter((item) => !existingKeys.has(`${item.telefone}-${item.apresentacao} ${item.horario_apresentacao}-mensagem_enviada`))
      .map((item) => ({
        nome: item.nome,
        telefone: item.telefone,
        fonte: item.fonte,
        data_envio: dataEnvio,
        data_apresentacao: `${item.apresentacao} ${item.horario_apresentacao}`,
        status: "mensagem_enviada" as const,
        mensagem: item.mensagem,
        data: dataEnvio
      }));

    setGeneratedQueue((current) =>
      current.map((item) => item.status_envio === "pendente_envio" ? { ...item, status_envio: "mensagem_enviada" } : item)
    );
    setContactHistoryRows((current) => {
      const currentKeys = new Set(current.map((item) => `${item.telefone}-${item.data_apresentacao}-${item.status}`));
      const uniqueNewItems = newItems.filter((item) => !currentKeys.has(`${item.telefone}-${item.data_apresentacao}-${item.status}`));
      return [...uniqueNewItems, ...current];
    });
    if (newItems.length) {
      try {
        await saveContactHistory(newItems);
      } catch (error) {
        console.error("Falha ao salvar historico no Supabase. Mantendo fluxo localStorage.", error);
      }
    }
  }

  async function handleSendQueueItemWhatsApp(queueItem: SendQueueItem) {
    if (sendingQueueItemId !== null) return;

    if (queueItem.status_envio === "mensagem_enviada") {
      setWhatsappSendFeedback({ type: "error", message: "Este candidato ja esta marcado como enviado." });
      return;
    }

    if (!queueItem.telefone.trim()) {
      setWhatsappSendFeedback({ type: "error", message: "Este candidato nao possui telefone cadastrado." });
      return;
    }

    if (!isValidQueuePhone(queueItem.telefone)) {
      setWhatsappSendFeedback({ type: "error", message: "Telefone invalido. Use DDI 55 + DDD + numero antes de enviar." });
      return;
    }

    const todayDateKey = getLocalDateKey();
    const normalizedQueuePhone = normalizeQueuePhone(queueItem.telefone);
    const sentTodayCount = contactHistoryRows.filter((item) => isWhatsAppHistoryForDate(item, todayDateKey)).length;
    const phoneAlreadySentToday = contactHistoryRows.some(
      (item) => isWhatsAppHistoryForDate(item, todayDateKey) && normalizeQueuePhone(item.telefone) === normalizedQueuePhone
    );

    if (phoneAlreadySentToday) {
      setWhatsappSendFeedback({ type: "error", message: "Este telefone já recebeu WhatsApp hoje." });
      return;
    }

    if (sentTodayCount >= getWhatsAppDailyLimit(recruitmentSettingsState)) {
      setWhatsappSendFeedback({
        type: "error",
        message: "Limite diário de WhatsApp atingido. Tente novamente amanhã ou ajuste o limite nas configurações."
      });
      return;
    }

    const confirmed = window.confirm("Tem certeza que deseja enviar WhatsApp para este candidato?");
    if (!confirmed) return;

    setSendingQueueItemId(queueItem.id);
    setWhatsappSendFeedback(null);

    try {
      const response = await fetch("/api/recruitment/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          telefone: queueItem.telefone,
          mensagem: "Mensagem enviada pelo CRM Home Life.",
          nome: queueItem.nome,
          templateName: "h_crm_rh_2",
          dataApresentacao: queueItem.apresentacao,
          horarioApresentacao: queueItem.horario_apresentacao
        })
      });
      const result = (await response.json()) as {
        success?: boolean;
        simulated?: boolean;
        provider?: string;
        messageId?: string;
        templateName?: string;
        templateLabel?: string;
        error?: string;
      };

      if (!response.ok || !result.success) {
        setWhatsappSendFeedback({
          type: "error",
          message: result.error || "Nao foi possivel enviar o WhatsApp. Tente novamente."
        });
        return;
      }

      const now = new Date();
      const dataEnvio = now.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      const envioDateKey = getLocalDateKey(now);
      const updatedQueue = generatedQueue.map((item) =>
        item.id === queueItem.id ? { ...item, status_envio: "mensagem_enviada" as const } : item
      );
      const historyItem: ContactHistoryItem = {
        nome: queueItem.nome,
        telefone: queueItem.telefone,
        fonte: queueItem.fonte,
        data_envio: dataEnvio,
        data_apresentacao: `${queueItem.apresentacao} ${queueItem.horario_apresentacao}`,
        status: "mensagem_enviada",
        mensagem: result.messageId ? `${queueItem.mensagem} Origem: WhatsApp. MessageId: ${result.messageId}` : `${queueItem.mensagem} Origem: WhatsApp.`,
        data: dataEnvio,
        origem: "WhatsApp",
        messageId: result.messageId,
        envioDateKey,
        templateName: result.templateName || "h_crm_rh_2",
        templateLabel: result.templateLabel || "Primeiro contato",
        dataApresentacao: queueItem.apresentacao,
        horarioApresentacao: queueItem.horario_apresentacao
      };

      setGeneratedQueue(updatedQueue);
      setImportRows((current) =>
        current.map((candidate) =>
          normalizeQueuePhone(candidate.telefone) === normalizeQueuePhone(queueItem.telefone)
            ? { ...candidate, funilStatus: "WhatsApp enviado" }
            : candidate
        )
      );
      setContactHistoryRows((current) => [historyItem, ...current]);
      setWhatsappSendFeedback({
        type: "success",
        message: result.messageId ? `WhatsApp enviado. ID ${result.messageId}` : "WhatsApp enviado com sucesso."
      });

      try {
        await saveQueue(updatedQueue);
      } catch (error) {
        console.error("Falha ao salvar fila no Supabase. Mantendo fluxo localStorage.", error);
      }

      try {
        await saveContactHistory([historyItem]);
      } catch (error) {
        console.error("Falha ao salvar historico no Supabase. Mantendo fluxo localStorage.", error);
      }
    } catch (error) {
      setWhatsappSendFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Falha ao chamar endpoint de WhatsApp."
      });
    } finally {
      setSendingQueueItemId(null);
    }
  }

  function getCandidateFunnelStatus(candidate: RecruitmentCandidate): RecruitmentFunnelStatus {
    if (candidate.funilStatus) return candidate.funilStatus;
    if (candidate.status === "Invalido") return "Telefone inválido";

    const candidatePhone = normalizeQueuePhone(candidate.telefone);
    const queueItem = generatedQueue.find((item) => normalizeQueuePhone(item.telefone) === candidatePhone);
    if (queueItem?.status_envio === "mensagem_enviada") return "WhatsApp enviado";
    if (whatsappHistoryRows.some((item) => normalizeQueuePhone(item.telefone) === candidatePhone)) return "WhatsApp enviado";
    if (queueItem) return "Na fila de envio";

    return "Novo candidato";
  }

  async function handleCandidateFunnelStatusChange(candidate: RecruitmentCandidate, nextStatus: RecruitmentFunnelStatus) {
    if (getCandidateFunnelStatus(candidate) === nextStatus) return;

    const now = new Date();
    const dataEnvio = now.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const sourceRows = importRows.length ? importRows : candidateList;
    const candidateKey = getCandidateKey(candidate);
    const updatedCandidates = sourceRows.map((item) =>
      getCandidateKey(item) === candidateKey ? { ...item, funilStatus: nextStatus } : item
    );
    const historyItem: ContactHistoryItem = {
      nome: candidate.nome,
      telefone: candidate.telefone,
      fonte: candidate.fonte,
      data_envio: dataEnvio,
      data_apresentacao: "-",
      status: "alteracao_funil",
      mensagem: `Status do funil alterado manualmente para ${nextStatus}.`,
      data: dataEnvio,
      origem: "Manual",
      funilStatus: nextStatus
    };

    setImportRows(updatedCandidates);
    setContactHistoryRows((current) => [historyItem, ...current]);

    try {
      await saveCandidates(updatedCandidates);
    } catch (error) {
      console.error("Falha ao salvar status do funil no Supabase. Mantendo fluxo localStorage.", error);
    }

    try {
      await saveContactHistory([historyItem]);
    } catch (error) {
      console.error("Falha ao salvar alteracao manual do funil no Supabase. Mantendo fluxo localStorage.", error);
    }
  }

  async function handleCreatePresentation() {
    const presentation: RecruitmentPresentation = {
      id: createLocalId("presentation"),
      titulo: presentationDraft.titulo.trim() || "Apresentacao Home Life",
      data: presentationDraft.data || getDefaultPresentationDate(),
      horario: presentationDraft.horario || defaultRecruitmentSettings.horarioApresentacao,
      status: "agendada",
      observacao: presentationDraft.observacao,
      candidates: []
    };
    const nextPresentations = [...presentationRows, presentation].sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));

    setPresentationRows(nextPresentations);
    setSelectedPresentationId(presentation.id);
    setPresentationDraft({
      titulo: "Apresentacao Home Life",
      data: getDefaultPresentationDate(),
      horario: recruitmentSettingsState.horarioApresentacao,
      observacao: ""
    });

    try {
      await savePresentations(nextPresentations);
    } catch (error) {
      console.error("Falha ao salvar apresentacao no Supabase. Mantendo fluxo localStorage.", error);
    }
  }

  async function handleLinkCandidateToPresentation(candidate: RecruitmentCandidate, presentationId: string) {
    const presentation = presentationRows.find((item) => item.id === presentationId);
    if (!presentation) return;

    const normalizedPhone = normalizeQueuePhone(candidate.telefone);
    const linkedCandidate = {
      id: createLocalId("presentation-candidate"),
      presentationId: presentation.id,
      nome: candidate.nome,
      telefone: candidate.telefone,
      email: candidate.email,
      fonte: candidate.fonte,
      statusParticipacao: "agendado" as const
    };
    const nextPresentations = presentationRows.map((item) => {
      if (item.id !== presentation.id) return item;
      const alreadyLinked = item.candidates.some((linked) => normalizeQueuePhone(linked.telefone) === normalizedPhone);
      return alreadyLinked ? item : { ...item, candidates: [...item.candidates, linkedCandidate] };
    });
    const updatedCandidates = (importRows.length ? importRows : candidateList).map((item) =>
      getCandidateKey(item) === getCandidateKey(candidate) ? { ...item, funilStatus: "Apresentação agendada" as const } : item
    );
    const dataEnvio = new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const historyItem: ContactHistoryItem = {
      nome: candidate.nome,
      telefone: candidate.telefone,
      fonte: candidate.fonte,
      data_envio: dataEnvio,
      data_apresentacao: `${presentation.data} ${presentation.horario}`,
      status: "alteracao_funil",
      mensagem: `Candidato vinculado manualmente a apresentacao ${presentation.titulo}.`,
      data: dataEnvio,
      origem: "Manual",
      funilStatus: "Apresentação agendada",
      presentationId: presentation.id,
      presentationTitle: presentation.titulo,
      dataApresentacao: presentation.data,
      horarioApresentacao: presentation.horario,
      participationStatus: "agendado"
    };

    setPresentationRows(nextPresentations);
    setImportRows(updatedCandidates);
    setContactHistoryRows((current) => [historyItem, ...current]);

    try {
      await savePresentationCandidate(linkedCandidate);
      await savePresentations(nextPresentations);
    } catch (error) {
      console.error("Falha ao vincular candidato a apresentacao no Supabase. Mantendo fluxo localStorage.", error);
    }

    try {
      await saveCandidates(updatedCandidates);
      await saveContactHistory([historyItem]);
    } catch (error) {
      console.error("Falha ao salvar historico/vinculo de apresentacao no Supabase. Mantendo fluxo localStorage.", error);
    }
  }

  async function handlePresentationParticipationChange(
    presentation: RecruitmentPresentation,
    candidatePhone: string,
    nextStatus: RecruitmentPresentationCandidateStatus
  ) {
    const linkedCandidate = presentation.candidates.find((candidate) => normalizeQueuePhone(candidate.telefone) === normalizeQueuePhone(candidatePhone));
    if (!linkedCandidate || linkedCandidate.statusParticipacao === nextStatus) return;

    const nextFunnelStatus = getFunnelStatusFromParticipation(nextStatus);
    const nextPresentations = presentationRows.map((item) =>
      item.id === presentation.id
        ? {
            ...item,
            candidates: item.candidates.map((candidate) =>
              normalizeQueuePhone(candidate.telefone) === normalizeQueuePhone(candidatePhone)
                ? { ...candidate, statusParticipacao: nextStatus }
                : candidate
            )
          }
        : item
    );
    const updatedCandidates = (importRows.length ? importRows : candidateList).map((item) =>
      normalizeQueuePhone(item.telefone) === normalizeQueuePhone(candidatePhone) ? { ...item, funilStatus: nextFunnelStatus } : item
    );
    const dataEnvio = new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    const historyItem: ContactHistoryItem = {
      nome: linkedCandidate.nome,
      telefone: linkedCandidate.telefone,
      fonte: linkedCandidate.fonte || "",
      data_envio: dataEnvio,
      data_apresentacao: `${presentation.data} ${presentation.horario}`,
      status: "alteracao_funil",
      mensagem: `Participacao na apresentacao alterada para ${getParticipationLabel(nextStatus)}.`,
      data: dataEnvio,
      origem: "Manual",
      funilStatus: nextFunnelStatus,
      presentationId: presentation.id,
      presentationTitle: presentation.titulo,
      dataApresentacao: presentation.data,
      horarioApresentacao: presentation.horario,
      participationStatus: nextStatus
    };

    setPresentationRows(nextPresentations);
    setImportRows(updatedCandidates);
    setContactHistoryRows((current) => [historyItem, ...current]);

    try {
      await savePresentations(nextPresentations);
      await saveCandidates(updatedCandidates);
      await saveContactHistory([historyItem]);
    } catch (error) {
      console.error("Falha ao salvar participacao da apresentacao no Supabase. Mantendo fluxo localStorage.", error);
    }
  }

  async function handlePresentationStatusChange(presentationId: string, nextStatus: RecruitmentPresentation["status"]) {
    const nextPresentations = presentationRows.map((presentation) =>
      presentation.id === presentationId ? { ...presentation, status: nextStatus } : presentation
    );
    setPresentationRows(nextPresentations);

    try {
      await savePresentations(nextPresentations);
    } catch (error) {
      console.error("Falha ao salvar status da apresentacao no Supabase. Mantendo fluxo localStorage.", error);
    }
  }

  function normalizePresentationDays(value: string) {
    return value
      .split(/,| e /)
      .map((day) => day.trim())
      .filter(Boolean);
  }

  async function handleSaveRecruitmentSettings() {
    const settingsToSave = normalizeRecruitmentSettings({
      ...settingsDraft,
      quantidadePorDia: Number(settingsDraft.quantidadePorDia),
      limiteDiario: Number(settingsDraft.limiteDiario),
      limiteSemanal: Number(settingsDraft.limiteSemanal),
      limiteMensal: Number(settingsDraft.limiteMensal),
      orcamentoMensalWhatsApp: Number(settingsDraft.orcamentoMensalWhatsApp)
    });

    setRecruitmentSettingsState(settingsToSave);
    setSettingsDraft(settingsToSave);

    try {
      await saveSettings(settingsToSave);
    } catch (error) {
      console.error("Falha ao salvar configuracoes no Supabase. Mantendo fluxo localStorage.", error);
    }
  }

  async function handleClearRecruitmentData() {
    const confirmed = window.confirm(
      "Atenção: esta ação limpa os dados de teste locais do módulo Recrutamento e reseta as configurações. Deseja continuar?"
    );
    if (!confirmed) return;

    clearRecruitmentStorage();
    setImportRows(importedCandidates);
    setImportSummary(null);
    setImportError("");
    setGeneratedQueue(sendQueue);
    setContactHistoryRows(contactHistory);
    setRecruitmentSettingsState(defaultRecruitmentSettings);
    setSettingsDraft(defaultRecruitmentSettings);
    setPresentationRows([]);
    setSelectedPresentationId("");

    try {
      await saveSettings(defaultRecruitmentSettings);
    } catch (error) {
      console.error("Falha ao resetar configuracoes no Supabase. Mantendo fluxo localStorage.", error);
    }
  }

  function ExecutiveDashboard() {
    return (
      <>
        <Card className="home-life-sheen overflow-hidden text-white">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="flex flex-col justify-between gap-8">
              <div>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/home-life-logo.png" alt="Home Life" className="h-12 w-12 rounded-lg bg-white/95 p-1.5 shadow-lg" />
                  <div>
                    <p className="text-sm uppercase tracking-normal text-white/58">Home Life Negocios Imobiliarios</p>
                    <h2 className="mt-1 text-2xl font-semibold md:text-3xl">CRM interno de inteligencia comercial</h2>
                  </div>
                </div>
                <p className="mt-5 max-w-3xl text-sm leading-6 text-white/68">
                  Ambiente proprietario para operacao premium, previsao de vendas, qualidade dos leads e performance de corretores.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniProgress label="Previsao comercial" value={86} />
                <MiniProgress label="Aprovacao bancaria" value={68} />
                <MiniProgress label="Inteligencia historica" value={91} />
              </div>
            </div>
            <div className="rounded-lg border border-white/12 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <p className="text-sm font-semibold text-white">Acesso Home Life</p>
              <div className="mt-4 space-y-3">
                <input className="h-11 w-full rounded-md border border-white/15 bg-white/95 px-3 text-sm text-ink outline-none" placeholder="email@homelife.com.br" />
                <input className="h-11 w-full rounded-md border border-white/15 bg-white/95 px-3 text-sm text-ink outline-none" placeholder="Senha" type="password" />
                <button className="h-11 w-full rounded-md bg-gold text-sm font-semibold text-ink shadow-lg shadow-black/10">Entrar no CRM</button>
              </div>
              <p className="mt-4 text-xs leading-5 text-white/58">Login visual premium preparado para perfis administrador, gestor, corretor e cliente.</p>
            </div>
          </div>
        </Card>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Metric label="Total de leads" value={String(latest.leads)} icon={Users} detail="Leads ativos no ciclo" />
          <Metric label="Total de vendas" value={String(conversionByMonth.reduce((sum, item) => sum + item.vendas, 0))} icon={CheckCircle2} detail="Vendas historicas" />
          <Metric label="Conversao geral" value={percent(conversionRate)} icon={TrendingUp} detail="Taxa do mes atual" />
          <Metric label="Previsao de vendas" value="58" icon={Target} detail="Projecao proximos 30 dias" />
          <Metric label="Taxa de aprovacao" value={percent(Math.round(clientRows.reduce((sum, item) => sum + item.analise.chanceAprovacao, 0) / clientRows.length))} icon={BadgeCheck} detail="Media bancaria" />
          <Metric label="Score medio" value="73" icon={Gauge} detail="IPC combinado" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <Card>
            <SectionTitle icon={LineChartIcon} title="Conversao historica geral" />
            <div className="h-80 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionByMonth}>
                  <CartesianGrid stroke={chartColors.grid} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="leads" stroke={chartColors.steel} strokeWidth={2} />
                  <Line type="monotone" dataKey="visitas" stroke={chartColors.royal} strokeWidth={3} />
                  <Line type="monotone" dataKey="vendas" stroke={chartColors.gold} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <SectionTitle icon={BarChart3} title="Heatmap operacional" />
            <div className="grid grid-cols-6 gap-2 p-5 text-center text-xs">
              <span />
              {["8h", "10h", "12h", "15h", "18h"].map((hour) => (
                <span key={hour} className="font-medium text-steel">{hour}</span>
              ))}
              {heatmap.flatMap(([day, ...values]) => [
                <span key={day} className="grid h-10 place-items-center font-semibold text-steel">{day}</span>,
                ...values.map((value, index) => (
                  <span key={`${day}-${index}`} className="heat-cell grid h-10 place-items-center rounded-md font-semibold text-white" style={{ backgroundColor: `rgba(8, 44, 68, ${Number(value) / 100})` }}>
                    {value}
                  </span>
                ))
              ])}
            </div>
          </Card>
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <SectionTitle icon={BriefcaseBusiness} title="Melhores corretores" />
            <BrokerTable rows={brokerRows.slice(0, 3)} />
          </Card>
          <Card>
            <SectionTitle icon={Users} title="Leads prioritarios" />
            <ClientTable rows={clientRows.slice(0, 3)} />
          </Card>
        </div>
        <Card>
          <SectionTitle icon={Lock} title="Inteligencia historica" />
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            {insights.slice(0, 3).map((insight) => (
              <div key={insight} className="rounded-lg border border-line p-4 text-sm text-steel">{insight}</div>
            ))}
          </div>
        </Card>
      </>
    );
  }

  function BrokersArea() {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Produtividade" value="87%" icon={Activity} detail="Volume operacional ponderado" />
          <Metric label="Pastas subidas" value={String(brokerRows.reduce((sum, broker) => sum + broker.pastas_subidas, 0))} icon={FileText} detail="Pastas no ciclo" />
          <Metric label="Leads atendidos" value={String(brokerRows.reduce((sum, broker) => sum + broker.leads_respondidos, 0))} icon={Users} detail="Atendimento registrado" />
          <Metric label="Tempo resposta" value="12 min" icon={Gauge} detail="Media operacional" />
          <Metric label="Potencial alto" value={String(brokerRows.filter((broker) => broker.analise.potencial === "Alto").length)} icon={TrendingUp} detail="Corretores acima de 75 IPC" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionTitle icon={BriefcaseBusiness} title="Performance operacional dos corretores" />
            <BrokerTable rows={brokerRows} />
          </Card>
          <Card>
            <SectionTitle icon={Gauge} title="IPC Corretor e risco" />
            <div className="space-y-3 p-5">
              {brokerRows.map((broker) => (
                <MiniProgress key={broker.id} label={`${broker.nome} - IPC ${broker.analise.ipc}`} value={broker.analise.venda90} />
              ))}
            </div>
          </Card>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <SectionTitle icon={LineChartIcon} title="Evolucao mensal" />
            <div className="h-72 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionByMonth}>
                  <CartesianGrid stroke={chartColors.grid} />
                  <XAxis dataKey="mes" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="vendas" stroke={chartColors.gold} strokeWidth={3} />
                  <Line type="monotone" dataKey="visitas" stroke={chartColors.royal} strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <SectionTitle icon={Target} title="Metas comerciais" />
            <div className="space-y-3 p-5">
              <MiniProgress label="Pastas do mes" value={82} />
              <MiniProgress label="Visitas realizadas" value={76} />
              <MiniProgress label="Propostas enviadas" value={68} />
            </div>
          </Card>
          <Card>
            <SectionTitle icon={FileText} title="Relatorios e historico" />
            <div className="space-y-3 p-5 text-sm text-steel">
              <p>Corretores com mais de 20 pastas no primeiro mes possuem maior chance de venda.</p>
              <p>Tempo medio de resposta abaixo de 10 minutos aumenta visitas realizadas.</p>
              <p>Frequencia operacional acima de 85% concentra maior taxa de propostas.</p>
            </div>
          </Card>
        </div>
      </>
    );
  }

  function ClientsArea() {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Chance media compra" value={percent(Math.round(clientRows.reduce((sum, client) => sum + client.analise.chanceCompra, 0) / clientRows.length))} icon={TrendingUp} detail="Media dos clientes" />
          <Metric label="Aprovacao media" value={percent(Math.round(clientRows.reduce((sum, client) => sum + client.analise.chanceAprovacao, 0) / clientRows.length))} icon={BadgeCheck} detail="Probabilidade bancaria" />
          <Metric label="Leads quentes" value={String(clientRows.filter((client) => client.analise.nivelLead === "Lead quente").length)} icon={Users} detail="Prioridade comercial" />
          <Metric label="Pastas ativas" value={String(folderRows.length)} icon={FileText} detail="Cliente, corretor e imovel" />
          <Metric label="Score financeiro" value={String(Math.round(clientRows.reduce((sum, client) => sum + client.score_credito, 0) / clientRows.length))} icon={Gauge} detail="Media de credito" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionTitle icon={Users} title="Clientes compradores e IPC Cliente" />
            <ClientTable rows={clientRows} />
          </Card>
          <Card>
            <SectionTitle icon={KeyRound} title="Aprovacao bancaria" />
            <div className="space-y-3 p-5">
              {clientRows.map((client) => (
                <MiniProgress key={client.id} label={`${client.nome_cliente} - ${client.analise.nivelLead}`} value={client.analise.chanceAprovacao} />
              ))}
            </div>
          </Card>
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Card>
            <SectionTitle icon={Activity} title="Funil comercial" />
            <div className="h-72 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left: 18 }}>
                  <CartesianGrid stroke={chartColors.grid} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="etapa" type="category" tickLine={false} axisLine={false} width={82} />
                  <Tooltip />
                  <Bar dataKey="valor" fill={chartColors.navy} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <SectionTitle icon={Users} title="Nivel do lead" />
            <div className="h-72 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadPie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={4}>
                    {leadPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <SectionTitle icon={FileText} title="Pastas conectadas" />
            <div className="space-y-3 p-5">
              {folderRows.map((folder) => (
                <div key={folder.id} className="rounded-lg border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{folder.empreendimento}</p>
                      <p className="text-sm text-steel">{folder.cliente} - {folder.corretor}</p>
                    </div>
                    <span className="rounded-md bg-mist px-2 py-1 text-xs font-semibold text-navy">{folder.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-steel">pasta_id: {folder.id.slice(0, 8)} - cliente_id/corretor_id vinculados</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card>
          <SectionTitle icon={Lock} title="Historico de atendimento e inteligencia de compra" />
          <div className="grid gap-4 p-5 lg:grid-cols-3">
            <div className="rounded-lg border border-line p-4 text-sm text-steel">Clientes morando de aluguel possuem maior potencial de compra e maior urgencia para visita.</div>
            <div className="rounded-lg border border-line p-4 text-sm text-steel">Perfil financeiro combina renda, entrada, FGTS, score de credito, idade e dependentes.</div>
            <div className="rounded-lg border border-line p-4 text-sm text-steel">Cada pasta preserva corretor_id, cliente_id e analise preditiva para historico de conversao.</div>
          </div>
        </Card>
      </>
    );
  }

  function RegisterPanel() {
    const isBroker = active === "cadastro-corretores";
    return (
      <Card>
        <SectionTitle icon={isBroker ? BriefcaseBusiness : Users} title={isBroker ? "Cadastro de Corretores" : "Cadastro de Clientes"} />
        <div className="grid gap-5 p-5 lg:grid-cols-3">
          <form className="space-y-3 rounded-lg border border-line p-4">
            <p className="font-semibold">{isBroker ? "Novo corretor" : "Novo cliente"}</p>
            <input className="h-10 w-full rounded-md border border-line px-3 text-sm outline-none" placeholder="Nome" />
            <input className="h-10 w-full rounded-md border border-line px-3 text-sm outline-none" placeholder={isBroker ? "Email corporativo" : "CPF mascarado"} />
            <input className="h-10 w-full rounded-md border border-line px-3 text-sm outline-none" placeholder={isBroker ? "Equipe" : "Renda mensal"} />
            <button type="button" className="h-10 w-full rounded-md bg-navy text-sm font-semibold text-white">Salvar</button>
          </form>
          <div className="rounded-lg border border-line p-4">
            <p className="font-semibold">Permissoes</p>
            <div className="mt-3 grid gap-2 text-sm text-steel">
              {(isBroker ? ["Corretor: carteira propria", "Gestor: equipe completa", "Admin: base total"] : ["Cliente: painel individual", "Gestor: leads e pastas", "Admin: dados completos protegidos"]).map((role) => (
                <span key={role} className="rounded-md bg-mist px-3 py-2">{role}</span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-line p-4 text-sm text-steel">
            <p className="font-semibold text-ink">LGPD e seguranca</p>
            <p className="mt-3">CPF completo nao aparece no frontend. A busca produtiva usa hash e a persistencia usa criptografia no banco.</p>
          </div>
        </div>
      </Card>
    );
  }

  function CandidateTable({ rows, editableFunnel = false }: { rows: RecruitmentCandidate[]; editableFunnel?: boolean }) {
    return (
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full min-w-[1680px] text-left text-sm">
          <thead className="bg-mist text-xs uppercase tracking-normal text-steel">
            <tr>
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Telefone</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Cidade</th>
              <th className="px-5 py-3">Cargo</th>
              <th className="px-5 py-3">Fonte</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Funil</th>
              {editableFunnel ? <th className="px-5 py-3">Apresentação</th> : null}
              {editableFunnel ? <th className="px-5 py-3">Ações rápidas</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length ? rows.map((candidate) => {
              const funnelStatus = getCandidateFunnelStatus(candidate);

              return (
                <tr key={`${candidate.email}-${candidate.telefone}`}>
                  <td className="px-5 py-4 font-semibold text-ink">{candidate.nome}</td>
                  <td className="px-5 py-4">{candidate.telefone}</td>
                  <td className="px-5 py-4">{candidate.email}</td>
                  <td className="px-5 py-4">{candidate.cidade}</td>
                  <td className="px-5 py-4">{candidate.cargo}</td>
                  <td className="px-5 py-4">{candidate.fonte}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${candidate.status === "Valido" ? "bg-success text-white" : candidate.status === "Duplicado" ? "bg-danger text-white" : "bg-warning text-white"}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {editableFunnel ? (
                      <div className="space-y-2">
                        <select
                          className="h-9 min-w-[190px] rounded-md border border-line bg-white px-3 text-xs font-semibold text-navy outline-none"
                          value={funnelStatus}
                          onChange={(event) => handleCandidateFunnelStatusChange(candidate, event.target.value as RecruitmentFunnelStatus)}
                        >
                          {recruitmentFunnelStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <span className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${getFunnelStatusClass(funnelStatus)}`}>
                          {funnelStatus}
                        </span>
                      </div>
                    ) : (
                      <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getFunnelStatusClass(funnelStatus)}`}>{funnelStatus}</span>
                    )}
                  </td>
                  {editableFunnel ? (
                    <td className="px-5 py-4">
                      <div className="flex min-w-[260px] flex-wrap gap-2">
                        <select
                          className="h-9 min-w-[170px] rounded-md border border-line bg-white px-3 text-xs font-semibold text-navy outline-none"
                          value={selectedPresentationId}
                          onChange={(event) => setSelectedPresentationId(event.target.value)}
                          disabled={!presentationRows.length}
                        >
                          <option value="">{presentationRows.length ? "Selecionar turma" : "Criar turma primeiro"}</option>
                          {presentationRows.map((presentation) => (
                            <option key={presentation.id} value={presentation.id}>
                              {presentation.titulo} - {presentation.data} {presentation.horario}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleLinkCandidateToPresentation(candidate, selectedPresentationId)}
                          disabled={!selectedPresentationId}
                          className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-navy transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Vincular
                        </button>
                      </div>
                    </td>
                  ) : null}
                  {editableFunnel ? (
                    <td className="px-5 py-4">
                      <CandidateQuickActions candidate={candidate} />
                    </td>
                  ) : null}
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={editableFunnel ? 10 : 8} className="px-5 py-8 text-center text-sm text-steel">
                  Nenhum candidato encontrado para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  function CandidateQuickActions({ candidate }: { candidate: RecruitmentCandidate }) {
    const funnelStatus = getCandidateFunnelStatus(candidate);

    return (
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 min-w-[190px] rounded-md border border-line bg-white px-3 text-xs font-semibold text-navy outline-none transition hover:border-gold"
          value=""
          onChange={(event) => {
            const nextStatus = event.target.value as RecruitmentFunnelStatus;
            if (nextStatus) handleCandidateFunnelStatusChange(candidate, nextStatus);
          }}
          aria-label={`Alterar status de ${candidate.nome}`}
        >
          <option value="">Alterar status</option>
          {candidateQuickFunnelActions.map((status) => (
            <option key={status} value={status} disabled={funnelStatus === status}>
              {status}
            </option>
          ))}
        </select>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getFunnelStatusClass(funnelStatus)}`}>
          {funnelStatus}
        </span>
      </div>
    );
  }

  function OperationCandidateList({ title, rows }: { title: string; rows: RecruitmentCandidate[] }) {
    return (
      <Card>
        <SectionTitle icon={Users} title={title} />
        <div className="space-y-3 border-t border-line p-5">
          {rows.length ? rows.map((candidate) => {
            const funnelStatus = getCandidateFunnelStatus(candidate);

            return (
              <div key={`${candidate.telefone}-${candidate.email}-${title}`} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{candidate.nome}</p>
                    <p className="mt-1 text-sm text-steel">{candidate.telefone}</p>
                    <p className="mt-1 text-xs text-steel">{candidate.fonte || "Sem fonte"}</p>
                  </div>
                  <span className={`rounded-md px-2 py-1 text-xs font-semibold ${getFunnelStatusClass(funnelStatus)}`}>
                    {funnelStatus}
                  </span>
                </div>
                <div className="mt-3">
                  <CandidateQuickActions candidate={candidate} />
                </div>
              </div>
            );
          }) : (
            <div className="rounded-lg border border-dashed border-line p-5 text-sm text-steel">
              Nenhum candidato nesta lista.
            </div>
          )}
        </div>
      </Card>
    );
  }

  function OperationDay() {
    const todayKey = getLocalDateKey();
    const candidateRows = importRows.length ? importRows : candidateList;
    const candidateByPhone = new Map(candidateRows.map((candidate) => [normalizeQueuePhone(candidate.telefone), candidate]));
    const pendingQueueToday = generatedQueue.filter((item) => item.status_envio === "pendente_envio");
    const whatsappSentToday = contactHistoryRows.filter((item) => isWhatsAppHistoryForDate(item, todayKey));
    const presentationsToday = presentationRows.filter((presentation) => presentation.data === todayKey);
    const scheduledTodayCandidates = presentationsToday.flatMap((presentation) => presentation.candidates);
    const confirmedInterestCandidates = candidateRows.filter((candidate) => getCandidateFunnelStatus(candidate) === "Confirmou interesse");
    const notRespondedCandidates = candidateRows.filter((candidate) => getCandidateFunnelStatus(candidate) === "WhatsApp enviado");
    const missedCandidates = candidateRows.filter((candidate) => getCandidateFunnelStatus(candidate) === "Não compareceu");
    const followUpCandidates = candidateRows.filter((candidate) =>
      ["WhatsApp enviado", "Respondeu", "Confirmou interesse", "Não compareceu"].includes(getCandidateFunnelStatus(candidate))
    );

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Para contatar hoje" value={String(pendingQueueToday.length)} icon={Users} detail="Fila pendente" />
          <Metric label="WhatsApps enviados hoje" value={String(whatsappSentToday.length)} icon={BadgeCheck} detail="Historico do dia" />
          <Metric label="Apresentações de hoje" value={String(presentationsToday.length)} icon={Target} detail="Turmas do dia" />
          <Metric label="Agendados hoje" value={String(scheduledTodayCandidates.length)} icon={Activity} detail="Candidatos em turmas" />
          <Metric label="Confirmaram interesse" value={String(confirmedInterestCandidates.length)} icon={CheckCircle2} detail="Prontos para agendar" />
          <Metric label="Nao responderam" value={String(notRespondedCandidates.length)} icon={Filter} detail="Follow-up leve" />
          <Metric label="Nao compareceram" value={String(missedCandidates.length)} icon={FileText} detail="Reativar ou encerrar" />
          <Metric label="Para follow-up" value={String(followUpCandidates.length)} icon={Gauge} detail="Ações manuais" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <SectionTitle icon={Users} title="Candidatos para contatar hoje" />
            <div className="space-y-3 border-t border-line p-5">
              {pendingQueueToday.length ? pendingQueueToday.map((item) => {
                const candidate = candidateByPhone.get(normalizeQueuePhone(item.telefone));

                return (
                  <div key={`${item.telefone}-${item.id}`} className="rounded-lg border border-line p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-ink">{item.nome}</p>
                        <p className="mt-1 text-sm text-steel">{item.telefone}</p>
                        <p className="mt-1 text-xs text-steel">Apresentação sugerida: {item.apresentacao} {item.horario_apresentacao}</p>
                      </div>
                      <span className="rounded-md bg-mist px-2 py-1 text-xs font-semibold text-navy">{item.status_envio}</span>
                    </div>
                    {candidate ? <div className="mt-3"><CandidateQuickActions candidate={candidate} /></div> : null}
                  </div>
                );
              }) : (
                <div className="rounded-lg border border-dashed border-line p-5 text-sm text-steel">
                  Nenhum candidato pendente na fila de hoje.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={Target} title="Apresentações de hoje" />
            <div className="space-y-3 border-t border-line p-5">
              {presentationsToday.length ? presentationsToday.map((presentation) => {
                const attended = presentation.candidates.filter((candidate) => candidate.statusParticipacao === "compareceu").length;
                const missed = presentation.candidates.filter((candidate) => candidate.statusParticipacao === "nao_compareceu").length;

                return (
                  <div key={presentation.id} className="rounded-lg border border-line p-4">
                    <p className="font-semibold text-ink">{presentation.titulo}</p>
                    <p className="mt-1 text-sm text-steel">{presentation.data} as {presentation.horario}</p>
                    <div className="mt-3 grid gap-2 text-xs font-semibold text-navy md:grid-cols-3">
                      <span className="rounded-md bg-mist px-2 py-2">Vinculados: {presentation.candidates.length}</span>
                      <span className="rounded-md bg-mist px-2 py-2">Compareceram: {attended}</span>
                      <span className="rounded-md bg-mist px-2 py-2">Nao compareceram: {missed}</span>
                    </div>
                  </div>
                );
              }) : (
                <div className="rounded-lg border border-dashed border-line p-5 text-sm text-steel">
                  Nenhuma apresentação cadastrada para hoje.
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <OperationCandidateList title="Candidatos que confirmaram interesse" rows={confirmedInterestCandidates} />
          <OperationCandidateList title="Candidatos que nao responderam" rows={notRespondedCandidates} />
          <OperationCandidateList title="Candidatos que nao compareceram" rows={missedCandidates} />
          <OperationCandidateList title="Candidatos para follow-up" rows={followUpCandidates} />
        </div>
      </div>
    );
  }

  function RecruitmentReports() {
    const candidateRows = importRows.length ? importRows : candidateList;
    const sourceOptions = ["Todas", ...Array.from(new Set(candidateRows.map((candidate) => candidate.fonte || "Sem fonte"))).sort()];
    const candidateByPhone = new Map(candidateRows.map((candidate) => [normalizeQueuePhone(candidate.telefone), candidate]));
    const matchesSource = (candidate?: Pick<RecruitmentCandidate, "fonte">) =>
      recruitmentReportSource === "Todas" || (candidate?.fonte || "Sem fonte") === recruitmentReportSource;
    const historyInPeriod = contactHistoryRows.filter((item) => isDateInReportPeriod(getHistoryDateKey(item), recruitmentReportPeriod));
    const presentationsInPeriod = presentationRows.filter((presentation) => isDateInReportPeriod(presentation.data, recruitmentReportPeriod));
    const eventPhonesInPeriod = new Set([
      ...historyInPeriod.map((item) => normalizeQueuePhone(item.telefone)),
      ...presentationsInPeriod.flatMap((presentation) => presentation.candidates.map((candidate) => normalizeQueuePhone(candidate.telefone)))
    ]);
    const reportCandidates = candidateRows.filter((candidate) => {
      const sourceOk = matchesSource(candidate);
      if (!sourceOk) return false;
      if (recruitmentReportPeriod === "todos") return true;
      return eventPhonesInPeriod.has(normalizeQueuePhone(candidate.telefone));
    });
    const reportCandidatePhones = new Set(reportCandidates.map((candidate) => normalizeQueuePhone(candidate.telefone)));
    const reportHistory = historyInPeriod.filter((item) => {
      const candidate = candidateByPhone.get(normalizeQueuePhone(item.telefone));
      return reportCandidatePhones.has(normalizeQueuePhone(item.telefone)) || matchesSource(candidate || { fonte: item.fonte });
    });
    const reportPresentations = presentationsInPeriod.map((presentation) => ({
      ...presentation,
      candidates: presentation.candidates.filter((candidate) => {
        const sourceCandidate = candidateByPhone.get(normalizeQueuePhone(candidate.telefone));
        return matchesSource(sourceCandidate || { fonte: candidate.fonte || "Sem fonte" });
      })
    }));
    const countFunnelStatus = (status: RecruitmentFunnelStatus) =>
      reportCandidates.filter((candidate) => getCandidateFunnelStatus(candidate) === status).length;
    const invalidPhoneStatus = recruitmentFunnelStatuses.find((status) => status.includes("Telefone")) ?? "Novo candidato";
    const whatsappSent = reportHistory.filter((item) => item.status === "mensagem_enviada" && item.origem === "WhatsApp").length;
    const answered = countFunnelStatus("Respondeu");
    const interested = countFunnelStatus("Confirmou interesse");
    const scheduled = reportPresentations.reduce((total, presentation) => total + presentation.candidates.length, 0);
    const attended = reportPresentations.reduce(
      (total, presentation) => total + presentation.candidates.filter((candidate) => candidate.statusParticipacao === "compareceu").length,
      0
    );
    const missed = reportPresentations.reduce(
      (total, presentation) => total + presentation.candidates.filter((candidate) => candidate.statusParticipacao === "nao_compareceu").length,
      0
    );
    const sourceRows = Array.from(
      reportCandidates.reduce((groups, candidate) => {
        const source = candidate.fonte || "Sem fonte";
        const current = groups.get(source) || {
          fonte: source,
          total: 0,
          whatsapp: 0,
          interesse: 0,
          compareceram: 0
        };
        const phone = normalizeQueuePhone(candidate.telefone);
        const candidatePresentations = reportPresentations.flatMap((presentation) => presentation.candidates).filter((linked) => normalizeQueuePhone(linked.telefone) === phone);
        groups.set(source, {
          ...current,
          total: current.total + 1,
          whatsapp: current.whatsapp + (reportHistory.some((item) => item.status === "mensagem_enviada" && item.origem === "WhatsApp" && normalizeQueuePhone(item.telefone) === phone) ? 1 : 0),
          interesse: current.interesse + (getCandidateFunnelStatus(candidate) === "Confirmou interesse" ? 1 : 0),
          compareceram: current.compareceram + (candidatePresentations.some((linked) => linked.statusParticipacao === "compareceu") ? 1 : 0)
        });
        return groups;
      }, new Map<string, { fonte: string; total: number; whatsapp: number; interesse: number; compareceram: number }>())
    ).map(([, value]) => value);

    return (
      <div className="space-y-6">
        <Card>
          <SectionTitle icon={Filter} title="Filtros" />
          <div className="grid gap-4 border-t border-line p-5 md:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-normal text-steel">Periodo</span>
              <select
                className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink outline-none"
                value={recruitmentReportPeriod}
                onChange={(event) => setRecruitmentReportPeriod(event.target.value as RecruitmentReportPeriod)}
              >
                {recruitmentReportPeriods.map((period) => (
                  <option key={period.key} value={period.key}>{period.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-normal text-steel">Fonte</span>
              <select
                className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink outline-none"
                value={recruitmentReportSource}
                onChange={(event) => setRecruitmentReportSource(event.target.value)}
              >
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total de candidatos" value={String(reportCandidates.length)} icon={Users} detail="Base filtrada" />
          <Metric label="WhatsApps enviados" value={String(whatsappSent)} icon={BadgeCheck} detail="Envios pelo CRM" />
          <Metric label="Responderam" value={String(answered)} icon={Activity} detail="Funil atual" />
          <Metric label="Confirmaram interesse" value={String(interested)} icon={CheckCircle2} detail="Funil atual" />
          <Metric label="Apresentações agendadas" value={String(scheduled)} icon={Target} detail="Candidatos vinculados" />
          <Metric label="Compareceram" value={String(attended)} icon={Gauge} detail="Participacao" />
          <Metric label="Nao compareceram" value={String(missed)} icon={FileText} detail="Participacao" />
          <Metric label="Sem interesse" value={String(countFunnelStatus("Sem interesse"))} icon={Filter} detail="Descartes" />
          <Metric label="Telefone invalido" value={String(countFunnelStatus(invalidPhoneStatus))} icon={FileText} detail="Contatos invalidos" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Taxa de resposta" value={formatReportRate(answered, whatsappSent)} icon={TrendingUp} detail="Responderam / WhatsApps" />
          <Metric label="Taxa de interesse" value={formatReportRate(interested, whatsappSent)} icon={TrendingUp} detail="Interesse / WhatsApps" />
          <Metric label="Taxa de agendamento" value={formatReportRate(scheduled, interested)} icon={TrendingUp} detail="Agendados / Interesse" />
          <Metric label="Taxa de comparecimento" value={formatReportRate(attended, scheduled)} icon={TrendingUp} detail="Compareceram / Agendados" />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <SectionTitle icon={BarChart3} title="Analise por fonte" />
            <div className="overflow-x-auto thin-scrollbar">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-mist text-xs uppercase tracking-normal text-steel">
                  <tr>
                    <th className="px-5 py-3">Fonte</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">WhatsApps enviados</th>
                    <th className="px-5 py-3">Confirmaram interesse</th>
                    <th className="px-5 py-3">Compareceram</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sourceRows.length ? sourceRows.map((row) => (
                    <tr key={row.fonte}>
                      <td className="px-5 py-4 font-semibold text-ink">{row.fonte}</td>
                      <td className="px-5 py-4">{row.total}</td>
                      <td className="px-5 py-4">{row.whatsapp}</td>
                      <td className="px-5 py-4">{row.interesse}</td>
                      <td className="px-5 py-4">{row.compareceram}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-6 text-center text-sm text-steel">Nenhum dado para os filtros selecionados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <SectionTitle icon={Target} title="Análise por apresentação" />
            <div className="overflow-x-auto thin-scrollbar">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-mist text-xs uppercase tracking-normal text-steel">
                  <tr>
                    <th className="px-5 py-3">Titulo</th>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-5 py-3">Horario</th>
                    <th className="px-5 py-3">Vinculados</th>
                    <th className="px-5 py-3">Compareceram</th>
                    <th className="px-5 py-3">Nao compareceram</th>
                    <th className="px-5 py-3">Taxa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {reportPresentations.length ? reportPresentations.map((presentation) => {
                    const presentationAttended = presentation.candidates.filter((candidate) => candidate.statusParticipacao === "compareceu").length;
                    const presentationMissed = presentation.candidates.filter((candidate) => candidate.statusParticipacao === "nao_compareceu").length;

                    return (
                      <tr key={presentation.id}>
                        <td className="px-5 py-4 font-semibold text-ink">{presentation.titulo}</td>
                        <td className="px-5 py-4">{presentation.data}</td>
                        <td className="px-5 py-4">{presentation.horario}</td>
                        <td className="px-5 py-4">{presentation.candidates.length}</td>
                        <td className="px-5 py-4">{presentationAttended}</td>
                        <td className="px-5 py-4">{presentationMissed}</td>
                        <td className="px-5 py-4 font-semibold text-navy">{formatReportRate(presentationAttended, presentation.candidates.length)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={7} className="px-5 py-6 text-center text-sm text-steel">Nenhuma apresentação encontrada para os filtros selecionados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  function RecruitmentDashboard() {
    const countFunnelStatus = (status: RecruitmentFunnelStatus) =>
      importRows.filter((candidate) => getCandidateFunnelStatus(candidate) === status).length;
    const todayKey = getLocalDateKey();
    const futurePresentations = presentationRows.filter((presentation) => presentation.status === "agendada" && presentation.data >= todayKey).length;
    const whatsappSentToday = contactHistoryRows.filter((item) => isWhatsAppHistoryForDate(item, todayKey)).length;
    const presentationsToday = presentationRows.filter((presentation) => presentation.data === todayKey).length;
    const followUpToday = importRows.filter((candidate) =>
      ["WhatsApp enviado", "Respondeu", "Confirmou interesse", "Não compareceu"].includes(getCandidateFunnelStatus(candidate))
    );
    const whatsappDailyLimit = getWhatsAppDailyLimit(recruitmentSettingsState);

    return (
      <>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleRefreshRecruitmentData}
            disabled={isRecruitmentRefreshing}
            className="h-9 rounded-md border border-line bg-white px-3 text-sm font-semibold text-navy transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRecruitmentRefreshing ? "Atualizando..." : "Atualizar dados"}
          </button>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Metric label="Total de candidatos" value={String(importRows.length)} icon={Users} detail="Base carregada" />
          <Metric label="WhatsApp enviados" value={String(countFunnelStatus("WhatsApp enviado"))} icon={BadgeCheck} detail="Primeiro contato feito" />
          <Metric label="Confirmaram interesse" value={String(countFunnelStatus("Confirmou interesse"))} icon={CheckCircle2} detail="Avançar acompanhamento" />
          <Metric label="Apresentações futuras" value={String(futurePresentations)} icon={Target} detail="Turmas agendadas" />
          <Metric label="Compareceram" value={String(countFunnelStatus("Compareceu"))} icon={Gauge} detail="Participaram da apresentação" />
          <Metric label="Telefone inválido" value={String(countFunnelStatus("Telefone inválido"))} icon={FileText} detail="Corrigir contato" />
        </div>
        <Card>
          <SectionTitle icon={Activity} title="Resumo operacional" />
          <div className="grid gap-4 p-5 md:grid-cols-3">
            <div className="rounded-lg border border-line bg-mist/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-steel">Para follow-up hoje</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{followUpToday.length}</p>
            </div>
            <div className="rounded-lg border border-line bg-mist/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-steel">Apresentações de hoje</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{presentationsToday}</p>
            </div>
            <div className="rounded-lg border border-line bg-mist/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-normal text-steel">Limite WhatsApp usado hoje</p>
              <p className="mt-2 text-2xl font-semibold text-ink">{whatsappSentToday} / {whatsappDailyLimit}</p>
            </div>
          </div>
        </Card>
      </>
    );
  }

  function ImportCandidates() {
    return (
      <>
        <Card>
          <SectionTitle icon={Download} title="Upload CSV/Excel" />
          <div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-lg border border-dashed border-navy/30 bg-mist p-6 text-center">
              <FileText className="mx-auto text-navy" size={34} />
              <p className="mt-3 font-semibold text-ink">Arraste uma planilha ou selecione um arquivo</p>
              <p className="mt-2 text-sm text-steel">Selecione um CSV para importar candidatos e validar nome, telefone, email e duplicidades.</p>
              <label className="mt-4 inline-flex h-10 cursor-pointer items-center rounded-md bg-navy px-4 text-sm font-semibold text-white">
                Selecionar arquivo
                <input className="sr-only" type="file" accept=".csv,text/csv" onChange={handleCandidateCsv} />
              </label>
            </div>
            <div className="rounded-lg border border-line p-4 text-sm text-steel">
              <p className="font-semibold text-ink">Colunas esperadas</p>
              <p className="mt-3">Nome, Telefone, Email, Cidade, Cargo, Fonte e Status.</p>
              <p className="mt-3">Os candidatos importados ficam disponíveis no CRM e podem ser sincronizados com o Supabase.</p>
              {importSummary ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  <span className="rounded-md bg-mist px-3 py-2 font-semibold text-navy">Total {importSummary.total}</span>
                  <span className="rounded-md bg-mist px-3 py-2 font-semibold text-success">Validos {importSummary.validos}</span>
                  <span className="rounded-md bg-mist px-3 py-2 font-semibold text-warning">Invalidos {importSummary.invalidos}</span>
                  <span className="rounded-md bg-mist px-3 py-2 font-semibold text-danger">Duplicados {importSummary.duplicados}</span>
                </div>
              ) : null}
              {importError ? <p className="mt-4 rounded-md bg-mist px-3 py-2 font-semibold text-danger">{importError}</p> : null}
            </div>
          </div>
        </Card>
        <Card>
          <SectionTitle icon={FileText} title="Previa da importacao" />
          <CandidateTable rows={importRows} />
        </Card>
      </>
    );
  }

  function RecruitmentCandidates() {
    const candidateRows = importRows.length ? importRows : candidateList;
    const filteredCandidates = candidateFunnelFilter === "Todos"
      ? candidateRows
      : candidateRows.filter((candidate) => getCandidateFunnelStatus(candidate) === candidateFunnelFilter);

    return (
      <Card>
        <SectionTitle icon={Users} title="Lista de candidatos" />
        <div className="flex flex-wrap gap-2 border-t border-line p-5">
          {candidateFunnelFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setCandidateFunnelFilter(filter)}
              className={`h-9 rounded-md border px-3 text-xs font-semibold transition ${candidateFunnelFilter === filter ? "border-navy bg-navy text-white" : "border-line bg-white text-navy hover:border-gold"}`}
            >
              {filter}
            </button>
          ))}
        </div>
        <CandidateTable rows={filteredCandidates} editableFunnel />
      </Card>
    );
  }

  function SendQueue() {
    return (
      <Card>
        <SectionTitle
          icon={FileText}
          title="Fila de envio WhatsApp"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleGenerateQueue} className="h-9 rounded-md bg-navy px-3 text-sm font-semibold text-white">Gerar fila de hoje</button>
              <button type="button" onClick={handleSimulateSend} className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-steel transition hover:border-gold hover:text-navy">Simulação interna</button>
            </div>
          }
        />
        <div className="border-t border-line px-5 py-3 text-sm text-steel">
          <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 font-semibold text-ink">
            Envio real ativo: ao clicar em Enviar WhatsApp, uma mensagem será enviada pela API da Meta.
          </p>
          <p className="mt-2 text-xs text-steel">
            Use Simulação interna apenas para teste local do fluxo, sem disparo real de WhatsApp.
          </p>
          <p className="mt-2 font-semibold text-navy">Envios WhatsApp hoje: {whatsappSendsToday} / {whatsappDailyLimit}</p>
          {whatsappSendFeedback ? (
            <p className={`mt-2 font-semibold ${whatsappSendFeedback.type === "success" ? "text-success" : "text-danger"}`}>
              {whatsappSendFeedback.message}
            </p>
          ) : null}
        </div>
        <div className="overflow-x-auto thin-scrollbar">
          <table className="w-full min-w-[1240px] text-left text-sm">
            <thead className="bg-mist text-xs uppercase tracking-normal text-steel">
              <tr>
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Candidato</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">Cargo</th>
                <th className="px-5 py-3">Data da apresentacao</th>
                <th className="px-5 py-3">Horario</th>
                <th className="px-5 py-3">Status envio</th>
                <th className="px-5 py-3">Mensagem pronta</th>
                <th className="px-5 py-3">WhatsApp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {generatedQueue.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4 font-semibold text-navy">{item.id}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{item.nome}</td>
                  <td className="px-5 py-4">{item.telefone}</td>
                  <td className="px-5 py-4">{item.cargo}</td>
                  <td className="px-5 py-4">{item.apresentacao}</td>
                  <td className="px-5 py-4">{item.horario_apresentacao}</td>
                  <td className="px-5 py-4"><span className="rounded-md bg-mist px-2 py-1 text-xs font-semibold text-navy">{item.status_envio}</span></td>
                  <td className="px-5 py-4 text-steel">{item.mensagem}</td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleSendQueueItemWhatsApp(item)}
                      disabled={item.status_envio !== "pendente_envio" || sendingQueueItemId !== null || !isValidQueuePhone(item.telefone)}
                      className="h-9 rounded-md bg-navy px-3 text-xs font-semibold text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sendingQueueItemId === item.id ? "Enviando..." : item.status_envio === "mensagem_enviada" ? "Enviado" : "Enviar WhatsApp"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  function Presentations() {
    return (
      <div className="space-y-6">
        <Card>
          <SectionTitle icon={Target} title="Criar apresentação" />
          <div className="grid gap-4 border-t border-line p-5 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-normal text-steel">Titulo</span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-line px-3 text-sm font-semibold text-ink outline-none"
                value={presentationDraft.titulo}
                onChange={(event) => setPresentationDraft((current) => ({ ...current, titulo: event.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-normal text-steel">Data</span>
              <input
                type="date"
                className="mt-2 h-10 w-full rounded-md border border-line px-3 text-sm font-semibold text-ink outline-none"
                value={presentationDraft.data}
                onChange={(event) => setPresentationDraft((current) => ({ ...current, data: event.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-normal text-steel">Horario</span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-line px-3 text-sm font-semibold text-ink outline-none"
                value={presentationDraft.horario}
                onChange={(event) => setPresentationDraft((current) => ({ ...current, horario: event.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium uppercase tracking-normal text-steel">Observacao</span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-line px-3 text-sm font-semibold text-ink outline-none"
                value={presentationDraft.observacao}
                onChange={(event) => setPresentationDraft((current) => ({ ...current, observacao: event.target.value }))}
              />
            </label>
          </div>
          <div className="border-t border-line p-5">
            <button type="button" onClick={handleCreatePresentation} className="h-10 rounded-md bg-navy px-4 text-sm font-semibold text-white transition hover:bg-ocean">
              Criar apresentação
            </button>
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Users} title="Apresentações" />
          <div className="space-y-4 border-t border-line p-5">
            {presentationRows.length ? presentationRows.map((presentation) => (
              <div key={presentation.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{presentation.titulo}</p>
                    <p className="mt-1 text-sm text-steel">{presentation.data} as {presentation.horario}</p>
                    <p className="mt-1 text-sm text-steel">{presentation.observacao || "Sem observacao"}</p>
                    <p className="mt-2 text-xs font-semibold text-navy">{presentation.candidates.length} candidato(s) vinculado(s)</p>
                  </div>
                  <select
                    className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-navy outline-none"
                    value={presentation.status}
                    onChange={(event) => handlePresentationStatusChange(presentation.id, event.target.value as RecruitmentPresentation["status"])}
                  >
                    <option value="agendada">Agendada</option>
                    <option value="realizada">Realizada</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="mt-4 overflow-x-auto thin-scrollbar">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead className="bg-mist text-xs uppercase tracking-normal text-steel">
                      <tr>
                        <th className="px-4 py-3">Nome</th>
                        <th className="px-4 py-3">Telefone</th>
                        <th className="px-4 py-3">Fonte</th>
                        <th className="px-4 py-3">Participacao</th>
                        <th className="px-4 py-3">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {presentation.candidates.length ? presentation.candidates.map((candidate) => (
                        <tr key={candidate.id}>
                          <td className="px-4 py-3 font-semibold text-ink">{candidate.nome}</td>
                          <td className="px-4 py-3">{candidate.telefone}</td>
                          <td className="px-4 py-3">{candidate.fonte || "-"}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-md bg-mist px-2 py-1 text-xs font-semibold text-navy">
                              {getParticipationLabel(candidate.statusParticipacao)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {participationOptions.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => handlePresentationParticipationChange(presentation, candidate.telefone, status)}
                                  disabled={candidate.statusParticipacao === status}
                                  className="h-8 rounded-md border border-line bg-white px-2 text-[11px] font-semibold text-navy transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {getParticipationLabel(status)}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-sm text-steel">
                            Nenhum candidato vinculado ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )) : (
              <div className="rounded-lg border border-dashed border-line p-6 text-sm text-steel">
                Nenhuma apresentação cadastrada. Crie uma turma para vincular candidatos.
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  function ContactHistory() {
    const normalizedSearch = contactHistorySearch.trim().toLowerCase();
    const filteredHistoryRows = contactHistoryRows.filter((item) => {
      const matchesSearch = !normalizedSearch
        || item.nome.toLowerCase().includes(normalizedSearch)
        || normalizeQueuePhone(item.telefone).includes(normalizeQueuePhone(normalizedSearch));
      const matchesFilter =
        contactHistoryFilter === "Todos"
        || (contactHistoryFilter === "WhatsApp" && item.origem === "WhatsApp")
        || (contactHistoryFilter === "Manual" && item.origem === "Manual")
        || (contactHistoryFilter === "alteracao_funil" && item.status === "alteracao_funil")
        || (contactHistoryFilter === "envio_whatsapp" && item.status === "mensagem_enviada" && item.origem === "WhatsApp")
        || (contactHistoryFilter === "apresentacao" && Boolean(item.presentationId || item.presentationTitle || item.participationStatus));

      return matchesSearch && matchesFilter;
    });

    return (
      <Card>
        <SectionTitle icon={FileText} title="Histórico de contatos" />
        <div className="grid gap-4 border-t border-line p-5 lg:grid-cols-[1fr_0.7fr]">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-normal text-steel">Buscar por nome ou telefone</span>
            <input
              className="mt-2 h-10 w-full rounded-md border border-line px-3 text-sm font-semibold text-ink outline-none"
              value={contactHistorySearch}
              onChange={(event) => setContactHistorySearch(event.target.value)}
              placeholder="Ex.: Ana ou 5521..."
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-normal text-steel">Tipo de registro</span>
            <select
              className="mt-2 h-10 w-full rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink outline-none"
              value={contactHistoryFilter}
              onChange={(event) => setContactHistoryFilter(event.target.value as ContactHistoryFilter)}
            >
              {contactHistoryFilters.map((filter) => (
                <option key={filter.key} value={filter.key}>{filter.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredHistoryRows.length ? filteredHistoryRows.map((item, index) => (
            <div key={`${item.nome}-${item.status}-${index}`} className="rounded-lg border border-line p-4">
              <p className="font-semibold text-ink">{item.nome}</p>
              <p className="mt-1 text-sm text-steel">{item.telefone}</p>
              <p className="mt-1 text-sm text-steel">{item.fonte}</p>
              <span className="mt-3 inline-flex rounded-md bg-mist px-2 py-1 text-xs font-semibold text-navy">{item.status}</span>
              <p className="mt-3 text-xs text-steel">Envio: {item.data_envio}</p>
              <p className="mt-1 text-xs text-steel">Apresentacao: {item.data_apresentacao}</p>
              {item.origem ? <p className="mt-1 text-xs text-steel">Origem: {item.origem}</p> : null}
              {item.funilStatus ? <p className="mt-1 text-xs font-semibold text-navy">Funil: {item.funilStatus}</p> : null}
              {item.presentationTitle ? <p className="mt-1 text-xs text-steel">Apresentação: {item.presentationTitle}</p> : null}
              {item.participationStatus ? <p className="mt-1 text-xs text-steel">Participacao: {getParticipationLabel(item.participationStatus)}</p> : null}
              {item.templateLabel ? <p className="mt-1 text-xs text-steel">Template: {item.templateLabel}</p> : null}
              {item.messageId ? <p className="mt-1 break-all text-xs text-steel">MessageId: {item.messageId}</p> : null}
              <p className="mt-3 text-xs leading-5 text-steel">{item.mensagem}</p>
            </div>
          )) : (
            <div className="rounded-lg border border-dashed border-line p-5 text-sm text-steel md:col-span-2 xl:col-span-4">
              Nenhum histórico encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      </Card>
    );
  }

  function RecruitmentSettings() {
    const whatsappStatusItems = [
      { label: "Modo", value: "Produção" },
      { label: "Template ativo", value: "Template ativo configurado na Vercel." },
      { label: "Idioma do template", value: "Configurado na Vercel." },
      { label: "Limite diário configurado", value: String(whatsappDailyLimit) },
      { label: "Envios WhatsApp hoje", value: `${whatsappSendsToday} / ${whatsappDailyLimit}` },
      { label: "Último envio WhatsApp", value: lastWhatsAppSend ? `${lastWhatsAppSend.nome} - ${lastWhatsAppSend.data_envio}` : "Nenhum envio registrado" },
      { label: "Status geral", value: whatsappDailyLimit >= 1 ? "Configurado" : "Pendente" }
    ];

    return (
      <Card>
        <SectionTitle icon={KeyRound} title="Configuracoes de envio" />
        <div className="grid gap-5 p-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Quantidade por dia",
              value: String(settingsDraft.quantidadePorDia),
              onChange: (value: string) => setSettingsDraft((current) => ({ ...current, quantidadePorDia: Number(value) }))
            },
            {
              label: "Horario de envio",
              value: settingsDraft.horarioEnvio,
              onChange: (value: string) => setSettingsDraft((current) => ({ ...current, horarioEnvio: value }))
            },
            {
              label: "Dias de apresentacao",
              value: settingsDraft.diasApresentacao.join(" e "),
              onChange: (value: string) => setSettingsDraft((current) => ({ ...current, diasApresentacao: normalizePresentationDays(value) }))
            },
            {
              label: "Horario da apresentacao",
              value: settingsDraft.horarioApresentacao,
              onChange: (value: string) => setSettingsDraft((current) => ({ ...current, horarioApresentacao: value }))
            },
            {
              label: "Limite diario",
              value: String(settingsDraft.limiteDiario),
              onChange: (value: string) => setSettingsDraft((current) => ({ ...current, limiteDiario: Number(value) }))
            },
            {
              label: "Limite semanal",
              value: String(settingsDraft.limiteSemanal),
              onChange: (value: string) => setSettingsDraft((current) => ({ ...current, limiteSemanal: Number(value) }))
            },
            {
              label: "Limite mensal",
              value: String(settingsDraft.limiteMensal),
              onChange: (value: string) => setSettingsDraft((current) => ({ ...current, limiteMensal: Number(value) }))
            },
            {
              label: "Orcamento mensal WhatsApp",
              value: String(settingsDraft.orcamentoMensalWhatsApp),
              onChange: (value: string) => setSettingsDraft((current) => ({ ...current, orcamentoMensalWhatsApp: Number(value) }))
            }
          ].map((field) => (
            <label key={field.label} className="block rounded-lg border border-line p-4">
              <span className="text-xs font-medium uppercase tracking-normal text-steel">{field.label}</span>
              <input
                className="mt-3 h-10 w-full rounded-md border border-line px-3 text-sm font-semibold text-ink outline-none"
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
              />
            </label>
          ))}
        </div>
        <div className="border-t border-line p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-ink">Status WhatsApp</p>
            <p className="mt-1 text-xs text-steel">
              O template oficial da Home Life ainda deve ser ativado somente após aprovação na Meta.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {whatsappStatusItems.map((item) => (
              <div key={item.label} className="rounded-lg border border-line p-4">
                <p className="text-xs font-medium uppercase tracking-normal text-steel">{item.label}</p>
                <p className="mt-2 break-words text-sm font-semibold text-ink">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 border-t border-line p-5">
          <button type="button" onClick={handleSaveRecruitmentSettings} className="h-10 rounded-md bg-navy px-4 text-sm font-semibold text-white transition hover:bg-ocean">
            Salvar configurações
          </button>
        </div>
        <div className="border-t border-danger/20 bg-danger/5 p-5">
          <p className="text-sm font-semibold text-danger">Zona de cuidado</p>
          <p className="mt-1 text-xs text-steel">
            A ação abaixo limpa dados locais de teste do módulo Recrutamento e reseta as configurações. Use apenas em manutenção.
          </p>
          <button type="button" onClick={handleClearRecruitmentData} className="mt-4 h-10 rounded-md border border-danger/30 bg-white px-4 text-sm font-semibold text-danger transition hover:bg-danger hover:text-white">
            Limpar dados de teste
          </button>
        </div>
      </Card>
    );
  }

  function RecruitmentArea() {
    if (active === "dashboard-recrutamento") return <RecruitmentDashboard />;
    if (active === "operacao-dia") return <OperationDay />;
    if (active === "importar-candidatos") return <ImportCandidates />;
    if (active === "candidatos-recrutamento") return <RecruitmentCandidates />;
    if (active === "fila-envio") return <SendQueue />;
    if (active === "apresentacoes-recrutamento") return <Presentations />;
    if (active === "relatorios-recrutamento") return <RecruitmentReports />;
    if (active === "historico-contatos") return <ContactHistory />;
    return <RecruitmentSettings />;
  }

  function Content() {
    if (active === "executivo") return <ExecutiveDashboard />;
    if (active === "cadastro-corretores" || active === "cadastro-clientes") return <RegisterPanel />;
    if (recruitmentNav.some((item) => item.key === active)) return <RecruitmentArea />;
    if (brokerNav.some((item) => item.key === active)) return <BrokersArea />;
    return <ClientsArea />;
  }

  return (
    <main className="min-h-screen bg-mist text-ink">
      <div className="flex min-h-screen">
        <aside className="home-life-sheen hidden w-80 shrink-0 border-r border-white/10 text-white lg:block">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home-life-logo.png" alt="Home Life" className="h-11 w-11 rounded-lg bg-white p-1.5 shadow-lg" />
              <div>
                <p className="text-lg font-semibold">Home Life CRM</p>
                <p className="text-xs text-white/60">Negocios Imobiliarios</p>
              </div>
            </div>
          </div>
          <nav className="space-y-5 px-3 py-4">
            {showLegacyCrmAreas ? (
              <>
                <div>
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-normal text-white/45">Area de Corretores</p>
                  <div className="space-y-1">{brokerNav.map((item) => <NavButton key={item.key} active={active === item.key} label={item.label} onClick={() => setActive(item.key)} />)}</div>
                </div>
                <div>
                  <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-normal text-white/45">Area de Clientes</p>
                  <div className="space-y-1">{clientNav.map((item) => <NavButton key={item.key} active={active === item.key} label={item.label} onClick={() => setActive(item.key)} />)}</div>
                </div>
              </>
            ) : null}
            <div>
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-normal text-white/45">Recrutamento</p>
              <div className="space-y-1">{recruitmentNav.map((item) => <NavButton key={item.key} active={active === item.key} label={item.label} onClick={() => setActive(item.key)} />)}</div>
            </div>
          </nav>
          <div className="mx-4 mb-5 rounded-lg border border-white/10 bg-white/8 p-4 shadow-2xl">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck size={17} />
              Areas conectadas
            </div>
            <p className="mt-2 text-sm leading-5 text-white/62">CRM proprietario Home Life com dados conectados por corretor_id, cliente_id, pasta_id e venda_id.</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-line bg-pearl/95 backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between lg:px-7">
              <div>
                <p className="text-sm text-steel">{title.eyebrow}</p>
                <h1 className="text-2xl font-semibold text-ink md:text-3xl">{title.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-10 min-w-0 items-center gap-2 rounded-md border border-line bg-white px-3">
                  <Search size={16} className="text-steel" />
                  <input className="w-48 bg-transparent text-sm outline-none" placeholder="Buscar lead, pasta, corretor" />
                </div>
                <button className="grid h-10 w-10 place-items-center rounded-md border border-line bg-white text-navy" title="Filtros avancados">
                  <Filter size={18} />
                </button>
                <button
                  onClick={() =>
                    exportCsv(
                      active.startsWith("dashboard-corretores") || brokerNav.some((item) => item.key === active) ? "corretores.csv" : "clientes.csv",
                      active.startsWith("dashboard-corretores") || brokerNav.some((item) => item.key === active)
                        ? brokerRows.map((broker) => ({ nome: broker.nome, ipc: broker.analise.ipc, venda30: broker.analise.venda30, risco: broker.analise.riscoBaixaPerformance }))
                        : clientRows.map((client) => ({ nome: client.nome_cliente, cpf_mascarado: client.cpf, ipc: client.analise.ipc, compra: client.analise.chanceCompra, nivel: client.analise.nivelLead }))
                    )
                  }
                  className="flex h-10 items-center gap-2 rounded-md bg-navy px-3 text-sm font-medium text-white shadow-lg shadow-navy/10 transition hover:bg-ocean"
                >
                  <Download size={17} />
                  Excel
                </button>
                <button onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium text-navy transition hover:border-gold hover:text-ink">
                  <FileText size={17} />
                  PDF
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 px-4 py-6 lg:px-7">
            <Content />
          </div>
        </div>
      </div>
    </main>
  );
}
