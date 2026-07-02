export type RecruitmentCandidate = {
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  cargo: string;
  fonte: string;
  status: "Valido" | "Revisar" | "Duplicado" | "Invalido";
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
  status: "mensagem_enviada" | "erro_envio" | "confirmado" | "nao_respondeu";
  mensagem: string;
  data: string;
};

export type RecruitmentSettings = {
  quantidadePorDia: number;
  horarioEnvio: string;
  diasApresentacao: string[];
  horarioApresentacao: string;
};
