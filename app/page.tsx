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
import type { ContactHistoryItem, RecruitmentCandidate, RecruitmentSettings as RecruitmentSettingsType, SendQueueItem } from "@/lib/recruitment-types";
import { getCandidates, saveCandidates } from "@/services/recruitment/candidates.service";
import { getContactHistory, saveContactHistory } from "@/services/recruitment/history.service";
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
  | "importar-candidatos"
  | "candidatos-recrutamento"
  | "fila-envio"
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
  { key: "importar-candidatos", label: "Importar Candidatos" },
  { key: "candidatos-recrutamento", label: "Candidatos" },
  { key: "fila-envio", label: "Fila de Envio" },
  { key: "historico-contatos", label: "Historico de Contatos" },
  { key: "configuracoes-recrutamento", label: "Configuracoes" }
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
  "importar-candidatos": { eyebrow: "Area de Recrutamento", title: "Importar Candidatos" },
  "candidatos-recrutamento": { eyebrow: "Area de Recrutamento", title: "Candidatos" },
  "fila-envio": { eyebrow: "Area de Recrutamento", title: "Fila de Envio" },
  "historico-contatos": { eyebrow: "Area de Recrutamento", title: "Historico de Contatos" },
  "configuracoes-recrutamento": { eyebrow: "Area de Recrutamento", title: "Configuracoes" }
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

async function loadRecruitmentDataSnapshot() {
  const stored = loadRecruitmentStorage();
  let nextCandidates = stored.candidates ?? importedCandidates;
  let nextQueue = stored.queue ?? sendQueue;
  let nextHistory = stored.history ?? contactHistory;
  let nextSettings = normalizeRecruitmentSettings(stored.settings ?? defaultRecruitmentSettings);

  try {
    const supabaseCandidates = await getCandidates();
    if (supabaseCandidates.length) nextCandidates = supabaseCandidates;
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
    if (supabaseHistory.length) nextHistory = supabaseHistory;
  } catch (error) {
    console.error("Falha ao carregar recruitment_contact_history do Supabase. Usando localStorage.", error);
  }

  try {
    const supabaseSettings = await loadSettings();
    if (supabaseSettings) nextSettings = normalizeRecruitmentSettings(supabaseSettings);
  } catch (error) {
    console.error("Falha ao carregar recruitment_settings do Supabase. Usando localStorage.", error);
  }

  return {
    candidates: nextCandidates,
    queue: nextQueue,
    history: nextHistory,
    settings: nextSettings
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

export default function Page() {
  const [active, setActive] = useState<ModuleKey>("dashboard-recrutamento");
  const [importRows, setImportRows] = useState<RecruitmentCandidate[]>(importedCandidates);
  const [importSummary, setImportSummary] = useState<RecruitmentImportSummary | null>(null);
  const [importError, setImportError] = useState("");
  const [generatedQueue, setGeneratedQueue] = useState<SendQueueItem[]>(sendQueue);
  const [contactHistoryRows, setContactHistoryRows] = useState<ContactHistoryItem[]>(contactHistory);
  const [recruitmentSettingsState, setRecruitmentSettingsState] = useState<RecruitmentSettingsType>(defaultRecruitmentSettings);
  const [settingsDraft, setSettingsDraft] = useState<RecruitmentSettingsType>(defaultRecruitmentSettings);
  const [storageReady, setStorageReady] = useState(false);
  const [isRecruitmentRefreshing, setIsRecruitmentRefreshing] = useState(false);
  const [sendingQueueItemId, setSendingQueueItemId] = useState<number | null>(null);
  const [whatsappSendFeedback, setWhatsappSendFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const latest = conversionByMonth[conversionByMonth.length - 1];
  const conversionRate = Math.round((latest.vendas / latest.leads) * 1000) / 10;
  const title = titles[active];
  const whatsappTodayDateKey = getLocalDateKey();
  const whatsappDailyLimit = getWhatsAppDailyLimit(recruitmentSettingsState);
  const whatsappSendsToday = contactHistoryRows.filter((item) => isWhatsAppHistoryForDate(item, whatsappTodayDateKey)).length;

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
      settings: recruitmentSettingsState
    });
  }, [contactHistoryRows, generatedQueue, importRows, recruitmentSettingsState, storageReady]);

  async function handleRefreshRecruitmentData() {
    setIsRecruitmentRefreshing(true);
    try {
      const nextData = await loadRecruitmentDataSnapshot();
      setImportRows(nextData.candidates);
      setGeneratedQueue(nextData.queue);
      setContactHistoryRows(nextData.history);
      setRecruitmentSettingsState(nextData.settings);
      setSettingsDraft(nextData.settings);
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
          mensagem: "Mensagem enviada pelo CRM Home Life."
        })
      });
      const result = (await response.json()) as {
        success?: boolean;
        simulated?: boolean;
        provider?: string;
        messageId?: string;
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
        envioDateKey
      };

      setGeneratedQueue(updatedQueue);
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
    clearRecruitmentStorage();
    setImportRows(importedCandidates);
    setImportSummary(null);
    setImportError("");
    setGeneratedQueue(sendQueue);
    setContactHistoryRows(contactHistory);
    setRecruitmentSettingsState(defaultRecruitmentSettings);
    setSettingsDraft(defaultRecruitmentSettings);

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

  function CandidateTable({ rows }: { rows: RecruitmentCandidate[] }) {
    return (
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="bg-mist text-xs uppercase tracking-normal text-steel">
            <tr>
              <th className="px-5 py-3">Nome</th>
              <th className="px-5 py-3">Telefone</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Cidade</th>
              <th className="px-5 py-3">Cargo</th>
              <th className="px-5 py-3">Fonte</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((candidate) => (
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function RecruitmentDashboard() {
    const validCandidates = importRows.filter((candidate) => candidate.status === "Valido").length;
    const pendingMessages = generatedQueue.filter((item) => item.status_envio === "pendente_envio").length;
    const sentMessages = contactHistoryRows.filter((item) => item.status === "mensagem_enviada").length;

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Metric label="Candidatos importados" value={String(importRows.length)} icon={Users} detail="Total recebido por planilhas" />
          <Metric label="Candidatos validos" value={String(validCandidates)} icon={CheckCircle2} detail="Aptos para contato" />
          <Metric label="Fila de hoje" value={String(generatedQueue.length)} icon={FileText} detail="Limite diario configurado" />
          <Metric label="Mensagens pendentes" value={String(pendingMessages)} icon={Activity} detail="Aguardando envio" />
          <Metric label="Mensagens enviadas" value={String(sentMessages)} icon={BadgeCheck} detail="Contatos do ciclo" />
          <Metric label="Proxima apresentacao" value="14:00" icon={Target} detail="Terca e quinta" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <SectionTitle icon={Users} title="Candidatos recentes" />
            <CandidateTable rows={importRows.slice(0, 5)} />
          </Card>
          <Card>
            <SectionTitle icon={Gauge} title="Ritmo operacional" />
            <div className="space-y-3 p-5">
              <MiniProgress label="Base higienizada" value={78} />
              <MiniProgress label="Fila preparada" value={100} />
              <MiniProgress label="Retornos confirmados" value={42} />
            </div>
          </Card>
        </div>
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
              <p className="mt-2 text-sm text-steel">Mock visual para CSV ou Excel. Nenhum arquivo sera enviado nesta etapa.</p>
              <label className="mt-4 inline-flex h-10 cursor-pointer items-center rounded-md bg-navy px-4 text-sm font-semibold text-white">
                Selecionar arquivo
                <input className="sr-only" type="file" accept=".csv,text/csv" onChange={handleCandidateCsv} />
              </label>
            </div>
            <div className="rounded-lg border border-line p-4 text-sm text-steel">
              <p className="font-semibold text-ink">Colunas esperadas</p>
              <p className="mt-3">Nome, Telefone, Email, Cidade, Cargo, Fonte e Status.</p>
              <p className="mt-3">A validacao final sera conectada ao banco em outra fase.</p>
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
    return (
      <Card>
        <SectionTitle icon={Users} title="Lista de candidatos" />
        <CandidateTable rows={importRows.length ? importRows : candidateList} />
      </Card>
    );
  }

  function SendQueue() {
    return (
      <Card>
        <SectionTitle
          icon={FileText}
          title="50 candidatos simulados para envio"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleGenerateQueue} className="h-9 rounded-md bg-navy px-3 text-sm font-semibold text-white">Gerar fila de hoje</button>
              <button type="button" onClick={handleSimulateSend} className="h-9 rounded-md border border-line bg-white px-3 text-sm font-semibold text-navy">Simular envio</button>
            </div>
          }
        />
        <div className="border-t border-line px-5 py-3 text-sm text-steel">
          Modo teste: o envio atual usa o template configurado na Meta. Aguarde aprovacao do modelo oficial da Home Life.
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
                      className="h-9 rounded-md border border-line bg-white px-3 text-xs font-semibold text-navy transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
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

  function ContactHistory() {
    return (
      <Card>
        <SectionTitle icon={FileText} title="Historico de contatos" />
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {contactHistoryRows.map((item, index) => (
            <div key={`${item.nome}-${item.status}-${index}`} className="rounded-lg border border-line p-4">
              <p className="font-semibold text-ink">{item.nome}</p>
              <p className="mt-1 text-sm text-steel">{item.telefone}</p>
              <p className="mt-1 text-sm text-steel">{item.fonte}</p>
              <span className="mt-3 inline-flex rounded-md bg-mist px-2 py-1 text-xs font-semibold text-navy">{item.status}</span>
              <p className="mt-3 text-xs text-steel">Envio: {item.data_envio}</p>
              <p className="mt-1 text-xs text-steel">Apresentacao: {item.data_apresentacao}</p>
              {item.origem ? <p className="mt-1 text-xs text-steel">Origem: {item.origem}</p> : null}
              {item.messageId ? <p className="mt-1 break-all text-xs text-steel">MessageId: {item.messageId}</p> : null}
              <p className="mt-3 text-xs leading-5 text-steel">{item.mensagem}</p>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  function RecruitmentSettings() {
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
        <div className="flex flex-wrap gap-3 border-t border-line p-5">
          <button type="button" onClick={handleSaveRecruitmentSettings} className="h-10 rounded-md bg-navy px-4 text-sm font-semibold text-white transition hover:bg-ocean">
            Salvar configurações
          </button>
          <button type="button" onClick={handleClearRecruitmentData} className="h-10 rounded-md border border-line bg-white px-4 text-sm font-semibold text-navy transition hover:border-gold hover:text-ink">
            Limpar dados de teste
          </button>
        </div>
      </Card>
    );
  }

  function RecruitmentArea() {
    if (active === "dashboard-recrutamento") return <RecruitmentDashboard />;
    if (active === "importar-candidatos") return <ImportCandidates />;
    if (active === "candidatos-recrutamento") return <RecruitmentCandidates />;
    if (active === "fila-envio") return <SendQueue />;
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
