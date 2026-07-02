import type { ContactHistoryItem, RecruitmentCandidate, RecruitmentSettings, SendQueueItem } from "./recruitment-types";

export const importedCandidates: RecruitmentCandidate[] = [
  { nome: "Mariana Alves", telefone: "(11) 98888-1001", email: "mariana.alves@email.com", cidade: "Sao Paulo", cargo: "Consultora comercial", fonte: "LinkedIn", status: "Valido" },
  { nome: "Diego Ramos", telefone: "(21) 97777-1002", email: "diego.ramos@email.com", cidade: "Rio de Janeiro", cargo: "Closer imobiliario", fonte: "Indicacao", status: "Valido" },
  { nome: "Camila Rocha", telefone: "(31) 96666-1003", email: "camila.rocha@email.com", cidade: "Belo Horizonte", cargo: "SDR", fonte: "Planilha", status: "Revisar" },
  { nome: "Lucas Mendes", telefone: "(41) 95555-1004", email: "lucas.mendes@email.com", cidade: "Curitiba", cargo: "Corretor trainee", fonte: "Formulario", status: "Valido" },
  { nome: "Patricia Gomes", telefone: "(51) 94444-1005", email: "patricia.gomes@email.com", cidade: "Porto Alegre", cargo: "Atendimento", fonte: "Instagram", status: "Duplicado" }
];

export const candidateList: RecruitmentCandidate[] = [
  ...importedCandidates,
  { nome: "Renato Martins", telefone: "(11) 93333-1006", email: "renato.martins@email.com", cidade: "Campinas", cargo: "Consultor senior", fonte: "Portal", status: "Valido" },
  { nome: "Juliana Pires", telefone: "(19) 92222-1007", email: "juliana.pires@email.com", cidade: "Sorocaba", cargo: "SDR", fonte: "LinkedIn", status: "Valido" },
  { nome: "Andre Oliveira", telefone: "(13) 91111-1008", email: "andre.oliveira@email.com", cidade: "Santos", cargo: "Closer", fonte: "Indicacao", status: "Revisar" }
];

export const recruitmentSettings: RecruitmentSettings = {
  quantidadePorDia: 50,
  horarioEnvio: "07:00",
  diasApresentacao: ["Terca", "Quinta"],
  horarioApresentacao: "14:00"
};

export const sendQueue: SendQueueItem[] = Array.from({ length: recruitmentSettings.quantidadePorDia }, (_, index) => {
  const candidate = candidateList[index % candidateList.length];
  const dayOffset = index < 25 ? 2 : 4;
  const presentationDate = new Date();
  presentationDate.setDate(presentationDate.getDate() + dayOffset);
  const dataApresentacao = `${presentationDate.getFullYear()}-${String(presentationDate.getMonth() + 1).padStart(2, "0")}-${String(presentationDate.getDate()).padStart(2, "0")}`;

  return {
    id: index + 1,
    nome: `${candidate.nome} ${index + 1}`,
    telefone: candidate.telefone,
    fonte: candidate.fonte,
    cargo: candidate.cargo,
    data_apresentacao: dataApresentacao,
    horario_apresentacao: recruitmentSettings.horarioApresentacao,
    apresentacao: presentationDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" }),
    mensagem: `Ola, ${candidate.nome}. Temos uma apresentacao Home Life para ${candidate.cargo} as ${recruitmentSettings.horarioApresentacao}. Posso te enviar os detalhes?`,
    status_envio: "pendente_envio"
  };
});

export const contactHistory: ContactHistoryItem[] = [
  { nome: "Mariana Alves", telefone: "(11) 98888-1001", fonte: "LinkedIn", data_envio: "Hoje 07:02", data_apresentacao: "Terca 14:00", status: "mensagem_enviada", mensagem: "Convite enviado para apresentacao Home Life.", data: "Hoje 07:02" },
  { nome: "Diego Ramos", telefone: "(21) 97777-1002", fonte: "Indicacao", data_envio: "Hoje 07:08", data_apresentacao: "Terca 14:00", status: "confirmado", mensagem: "Candidato confirmou presenca.", data: "Hoje 07:08" },
  { nome: "Camila Rocha", telefone: "(31) 96666-1003", fonte: "Planilha", data_envio: "Ontem 07:11", data_apresentacao: "Quinta 14:00", status: "erro_envio", mensagem: "Falha simulada no envio.", data: "Ontem 07:11" },
  { nome: "Lucas Mendes", telefone: "(41) 95555-1004", fonte: "Formulario", data_envio: "Ontem 07:18", data_apresentacao: "Quinta 14:00", status: "nao_respondeu", mensagem: "Mensagem enviada sem resposta.", data: "Ontem 07:18" }
];
