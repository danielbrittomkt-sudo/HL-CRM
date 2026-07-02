export type OperationalStatus = "Ativo" | "Atenção" | "Pausado";
export type LeadLevel = "Lead quente" | "Lead morno" | "Lead frio";
export type FolderStatus = "Novo" | "Em análise" | "Visita" | "Proposta" | "Banco" | "Vendido" | "Perdido";

export type Broker = {
  id: string;
  nome: string;
  foto: string;
  email: string;
  telefone: string;
  equipe: string;
  supervisor: string;
  data_entrada: string;
  tempo_empresa: number;
  status_operacional: OperationalStatus;
  pastas_subidas: number;
  leads_recebidos: number;
  leads_respondidos: number;
  tempo_medio_resposta: number;
  followups: number;
  visitas_agendadas: number;
  visitas_realizadas: number;
  propostas_enviadas: number;
  ligacoes_realizadas: number;
  plantoes: number;
  frequencia_operacional: number;
  origem_leads: string[];
  vendas_historicas: number;
};

export type Client = {
  id: string;
  nome_cliente: string;
  cpf: string;
  idade: number;
  estado_civil: string;
  renda_mensal: number;
  mora_de_aluguel: boolean;
  mora_com_pais: boolean;
  fgts_disponivel: number;
  valor_entrada: number;
  dependentes: number;
  profissao: string;
  score_credito: number;
  cidade: string;
  tipo_imovel_interesse: string;
  valor_imovel_interesse: number;
  origem: string;
};

export type Folder = {
  id: string;
  corretor_id: string;
  cliente_id: string;
  empreendimento: string;
  tipo_imovel: string;
  valor_imovel: number;
  renda_aprovada: number;
  status: FolderStatus;
  data_envio: string;
  observacoes: string;
};

export type BrokerAnalysis = {
  ipc: number;
  venda30: number;
  venda90: number;
  riscoBaixaPerformance: number;
  potencial: "Alto" | "Médio" | "Baixo";
  comparacaoHistorica: string;
};

export type ClientAnalysis = {
  ipc: number;
  chanceCompra: number;
  chanceAprovacao: number;
  potencialConversao: number;
  perfilComprador: string;
  nivelLead: LeadLevel;
  riscoReprovacao: number;
};
