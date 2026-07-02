import type { RecruitmentCandidate, RecruitmentSettings, SendQueueItem } from "./recruitment-types";

function getNextPresentationDate(referenceDate = new Date()) {
  const day = referenceDate.getDay();
  const targetDay = day === 2 || day === 3 ? 4 : 2;
  const daysUntilTarget = (targetDay - day + 7) % 7 || 7;
  const nextDate = new Date(referenceDate);
  nextDate.setDate(referenceDate.getDate() + daysUntilTarget);
  return nextDate;
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getNextPresentationLabel(referenceDate = new Date()) {
  return getNextPresentationDate(referenceDate).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  });
}

export function generateTodaySendQueue(
  candidates: RecruitmentCandidate[],
  settings: RecruitmentSettings,
  referenceDate = new Date()
): SendQueueItem[] {
  const presentationDate = getNextPresentationDate(referenceDate);
  const dataApresentacao = formatLocalDate(presentationDate);
  const apresentacao = presentationDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  });

  return candidates
    .filter((candidate) => candidate.status === "Valido")
    .slice(0, settings.quantidadePorDia)
    .map((candidate, index) => ({
      id: index + 1,
      nome: candidate.nome,
      telefone: candidate.telefone,
      fonte: candidate.fonte,
      cargo: candidate.cargo,
      data_apresentacao: dataApresentacao,
      horario_apresentacao: settings.horarioApresentacao,
      apresentacao,
      mensagem: `Ola, ${candidate.nome}. Temos uma apresentacao Home Life para ${candidate.cargo} as ${settings.horarioApresentacao}. Posso te enviar os detalhes?`,
      status_envio: "pendente_envio"
    }));
}
