import { analyzeBroker, analyzeClient } from "./scoring";
import { maskCpf, maskPhone } from "./security";
import type { Broker, Client, Folder } from "./types";

export const brokers: Broker[] = [
  {
    id: "8f4a5fb5-33b0-4dd2-8797-6cdbf8d9a101",
    nome: "Marina Albuquerque",
    foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    email: "marina.albuquerque@imob.ai",
    telefone: "11987654321",
    equipe: "Prime Norte",
    supervisor: "Renato Silva",
    data_entrada: "2024-02-12",
    tempo_empresa: 27,
    status_operacional: "Ativo",
    pastas_subidas: 33,
    leads_recebidos: 128,
    leads_respondidos: 119,
    tempo_medio_resposta: 7,
    followups: 78,
    visitas_agendadas: 46,
    visitas_realizadas: 39,
    propostas_enviadas: 18,
    ligacoes_realizadas: 210,
    plantoes: 15,
    frequencia_operacional: 91,
    origem_leads: ["Meta Ads", "Indicação", "Portal"],
    vendas_historicas: 14
  },
  {
    id: "f6f19080-9ef2-46ef-a930-4bc7da2c3991",
    nome: "Daniel Moretti",
    foto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    email: "daniel.moretti@imob.ai",
    telefone: "21988997766",
    equipe: "Expansão Rio",
    supervisor: "Camila Nogueira",
    data_entrada: "2023-08-04",
    tempo_empresa: 34,
    status_operacional: "Ativo",
    pastas_subidas: 27,
    leads_recebidos: 104,
    leads_respondidos: 91,
    tempo_medio_resposta: 12,
    followups: 64,
    visitas_agendadas: 32,
    visitas_realizadas: 25,
    propostas_enviadas: 13,
    ligacoes_realizadas: 184,
    plantoes: 11,
    frequencia_operacional: 84,
    origem_leads: ["Portal", "WhatsApp", "Orgânico"],
    vendas_historicas: 11
  },
  {
    id: "51cdcd1f-5e21-4db6-9c0a-3bbd0367c255",
    nome: "Bianca Tavares",
    foto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
    email: "bianca.tavares@imob.ai",
    telefone: "31994445566",
    equipe: "Lançamentos BH",
    supervisor: "Renato Silva",
    data_entrada: "2025-01-20",
    tempo_empresa: 16,
    status_operacional: "Atenção",
    pastas_subidas: 15,
    leads_recebidos: 88,
    leads_respondidos: 65,
    tempo_medio_resposta: 23,
    followups: 38,
    visitas_agendadas: 24,
    visitas_realizadas: 15,
    propostas_enviadas: 6,
    ligacoes_realizadas: 106,
    plantoes: 8,
    frequencia_operacional: 61,
    origem_leads: ["Meta Ads", "Plantão"],
    vendas_historicas: 4
  },
  {
    id: "91b3ed71-2d1b-41ec-a891-606590d9c00f",
    nome: "Rafael Campos",
    foto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=160&q=80",
    email: "rafael.campos@imob.ai",
    telefone: "41998881234",
    equipe: "Alto Padrão Sul",
    supervisor: "Camila Nogueira",
    data_entrada: "2022-11-18",
    tempo_empresa: 42,
    status_operacional: "Ativo",
    pastas_subidas: 41,
    leads_recebidos: 141,
    leads_respondidos: 134,
    tempo_medio_resposta: 5,
    followups: 96,
    visitas_agendadas: 53,
    visitas_realizadas: 47,
    propostas_enviadas: 23,
    ligacoes_realizadas: 246,
    plantoes: 18,
    frequencia_operacional: 96,
    origem_leads: ["Indicação", "CRM", "Portal"],
    vendas_historicas: 19
  }
];

export const clients: Client[] = [
  {
    id: "19598490-91fe-476b-8b22-0e32d5c4ccaa",
    nome_cliente: "Aline Costa",
    cpf: "12345678901",
    idade: 34,
    estado_civil: "Casado",
    renda_mensal: 11800,
    mora_de_aluguel: true,
    mora_com_pais: false,
    fgts_disponivel: 62000,
    valor_entrada: 85000,
    dependentes: 1,
    profissao: "Gerente comercial",
    score_credito: 782,
    cidade: "São Paulo",
    tipo_imovel_interesse: "Apartamento 3 quartos",
    valor_imovel_interesse: 690000,
    origem: "Meta Ads"
  },
  {
    id: "f94539ce-d080-4802-934f-f55948395bd3",
    nome_cliente: "Bruno Martins",
    cpf: "98765432100",
    idade: 29,
    estado_civil: "Solteiro",
    renda_mensal: 7300,
    mora_de_aluguel: true,
    mora_com_pais: false,
    fgts_disponivel: 28000,
    valor_entrada: 42000,
    dependentes: 0,
    profissao: "Analista de dados",
    score_credito: 711,
    cidade: "Rio de Janeiro",
    tipo_imovel_interesse: "Studio premium",
    valor_imovel_interesse: 420000,
    origem: "Portal"
  },
  {
    id: "4195ec32-4013-412b-8d65-903b22d36a44",
    nome_cliente: "Carolina Dias",
    cpf: "45678912344",
    idade: 42,
    estado_civil: "Casado",
    renda_mensal: 9200,
    mora_de_aluguel: false,
    mora_com_pais: false,
    fgts_disponivel: 17000,
    valor_entrada: 26000,
    dependentes: 2,
    profissao: "Enfermeira",
    score_credito: 649,
    cidade: "Belo Horizonte",
    tipo_imovel_interesse: "Casa em condomínio",
    valor_imovel_interesse: 610000,
    origem: "WhatsApp"
  },
  {
    id: "8b1a2960-e9f2-4ca8-b4e3-f927ed7489b3",
    nome_cliente: "Eduardo Lima",
    cpf: "32165498777",
    idade: 25,
    estado_civil: "Solteiro",
    renda_mensal: 4600,
    mora_de_aluguel: false,
    mora_com_pais: true,
    fgts_disponivel: 9000,
    valor_entrada: 14000,
    dependentes: 0,
    profissao: "Designer",
    score_credito: 588,
    cidade: "Curitiba",
    tipo_imovel_interesse: "Apartamento 2 quartos",
    valor_imovel_interesse: 360000,
    origem: "Orgânico"
  }
];

export const folders: Folder[] = [
  {
    id: "a7665344-9462-4043-90f9-4c9c8e0e745e",
    corretor_id: brokers[0].id,
    cliente_id: clients[0].id,
    empreendimento: "Reserva Jardim Paulista",
    tipo_imovel: "Apartamento",
    valor_imovel: 690000,
    renda_aprovada: 12100,
    status: "Banco",
    data_envio: "2026-05-08",
    observacoes: "Entrada robusta e documentação pré-validada."
  },
  {
    id: "669e5fae-baf7-420b-b7e6-910935188df6",
    corretor_id: brokers[3].id,
    cliente_id: clients[1].id,
    empreendimento: "Vista Atlântica",
    tipo_imovel: "Studio",
    valor_imovel: 420000,
    renda_aprovada: 7600,
    status: "Proposta",
    data_envio: "2026-05-14",
    observacoes: "Cliente comparando unidades de ticket similar."
  },
  {
    id: "c6be9928-9447-4cb6-aa21-6e104d70d77e",
    corretor_id: brokers[1].id,
    cliente_id: clients[2].id,
    empreendimento: "Bosque das Acácias",
    tipo_imovel: "Casa",
    valor_imovel: 610000,
    renda_aprovada: 8200,
    status: "Em análise",
    data_envio: "2026-05-11",
    observacoes: "Necessita composição de renda ou redução de ticket."
  },
  {
    id: "47031430-ff44-4efd-a9b4-c5f3f11d7cf4",
    corretor_id: brokers[2].id,
    cliente_id: clients[3].id,
    empreendimento: "Connect Centro",
    tipo_imovel: "Apartamento",
    valor_imovel: 360000,
    renda_aprovada: 4300,
    status: "Visita",
    data_envio: "2026-05-17",
    observacoes: "Lead em nutrição; baixa entrada inicial."
  }
];

export const conversionByMonth = [
  { mes: "Jan", leads: 370, visitas: 116, vendas: 31 },
  { mes: "Fev", leads: 412, visitas: 138, vendas: 37 },
  { mes: "Mar", leads: 398, visitas: 129, vendas: 35 },
  { mes: "Abr", leads: 448, visitas: 155, vendas: 44 },
  { mes: "Mai", leads: 486, visitas: 171, vendas: 52 }
];

export const funnel = [
  { etapa: "Leads", valor: 486 },
  { etapa: "Respondidos", valor: 409 },
  { etapa: "Visitas", valor: 171 },
  { etapa: "Propostas", valor: 60 },
  { etapa: "Banco", valor: 39 },
  { etapa: "Vendas", valor: 52 }
];

export const heatmap = [
  ["Seg", 72, 63, 58, 77, 81],
  ["Ter", 68, 74, 61, 82, 79],
  ["Qua", 75, 80, 67, 86, 84],
  ["Qui", 71, 78, 73, 88, 91],
  ["Sex", 66, 72, 70, 83, 87]
];

export const insights = [
  "Clientes casados com renda acima de R$8.000 possuem maior taxa de conversão.",
  "Corretores com mais de 20 pastas no primeiro mês possuem maior chance de venda.",
  "Clientes morando de aluguel possuem maior potencial de compra.",
  "Tempo médio de resposta abaixo de 10 minutos aumenta visitas agendadas.",
  "Corretores com frequência operacional acima de 85% concentram maior taxa de propostas."
];

export function getBrokerRows() {
  return brokers.map((broker) => ({
    ...broker,
    telefone: maskPhone(broker.telefone),
    analise: analyzeBroker(broker)
  }));
}

export function getClientRows() {
  return clients.map((client) => ({
    ...client,
    cpf: maskCpf(client.cpf),
    analise: analyzeClient(client)
  }));
}

export function getExecutiveMetrics() {
  const brokerAnalyses = brokers.map(analyzeBroker);
  const clientAnalyses = clients.map(analyzeClient);
  const vendas = conversionByMonth.reduce((sum, item) => sum + item.vendas, 0);
  const leadsAtivos = conversionByMonth.at(-1)?.leads ?? 0;
  const aprovacaoMedia = Math.round(clientAnalyses.reduce((sum, item) => sum + item.chanceAprovacao, 0) / clientAnalyses.length);
  const scoreMedio = Math.round(
    [...brokerAnalyses.map((item) => item.ipc), ...clientAnalyses.map((item) => item.ipc)].reduce((sum, item) => sum + item, 0) /
      (brokerAnalyses.length + clientAnalyses.length)
  );

  return {
    totalCorretores: brokers.length,
    leadsAtivos,
    conversao: 10.7,
    vendas,
    taxaAprovacao: aprovacaoMedia,
    scoreMedio,
    leadsPrioritarios: getClientRows().filter((client) => client.analise.nivelLead === "Lead quente"),
    corretoresPotenciais: getBrokerRows().filter((broker) => broker.analise.potencial === "Alto")
  };
}
