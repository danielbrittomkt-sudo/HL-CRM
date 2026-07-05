export type RecruitmentFunnelStatus =
  | "Novo candidato"
  | "Na fila de envio"
  | "WhatsApp enviado"
  | "Respondeu"
  | "Confirmou interesse"
  | "Apresentação agendada"
  | "Compareceu"
  | "Não compareceu"
  | "Sem interesse"
  | "Telefone inválido";

export type RecruitmentCandidate = {
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  cargo: string;
  fonte: string;
  status: "Valido" | "Revisar" | "Duplicado" | "Invalido";
  funilStatus?: RecruitmentFunnelStatus;
};

export type SendQueueItem = {
  id: number;
  nome: string;
  telefone: string;
  fonte: string;
  cargo: string;
  data_apresentacao: string;
  horario_apresentacao: string;
  apresentacao: string;
  mensagem: string;
  status_envio: "pendente_envio" | "mensagem_enviada";
};

export type ContactHistoryItem = {
  nome: string;
  telefone: string;
  fonte: string;
  data_envio: string;
  data_apresentacao: string;
  status: "mensagem_enviada" | "erro_envio" | "confirmado" | "nao_respondeu" | "alteracao_funil";
  mensagem: string;
  data: string;
  origem?: "WhatsApp" | "Simulacao" | "Manual";
  messageId?: string;
  envioDateKey?: string;
  funilStatus?: RecruitmentFunnelStatus;
};

export type RecruitmentSettings = {
  quantidadePorDia: number;
  horarioEnvio: string;
  diasApresentacao: string[];
  horarioApresentacao: string;
  limiteDiario: number;
  limiteSemanal: number;
  limiteMensal: number;
  orcamentoMensalWhatsApp: number;
};
