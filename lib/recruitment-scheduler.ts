import type { RecruitmentCandidate, RecruitmentSettings, SendQueueItem } from "./recruitment-types";

const fallbackDailyQuantity = 10;
const presentationHour = 14;
const presentationMinute = 0;

export function getNextPresentationDate(referenceDate = new Date()) {
  const day = referenceDate.getDay();
  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const cutoffMinutes = presentationHour * 60 + presentationMinute;
  let targetDay = 2;

  if (day === 2) {
    targetDay = currentMinutes <= cutoffMinutes ? 2 : 4;
  } else if (day === 3) {
    targetDay = 4;
  } else if (day === 4) {
    targetDay = currentMinutes <= cutoffMinutes ? 4 : 2;
  }

  const daysUntilTarget = (targetDay - day + 7) % 7;
  const nextDate = new Date(referenceDate);
  nextDate.setDate(referenceDate.getDate() + daysUntilTarget);
  nextDate.setHours(presentationHour, presentationMinute, 0, 0);
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

export function getOperationalDailyLimit(settings: RecruitmentSettings) {
  const quantidadePorDia = Number(settings.quantidadePorDia);
  const limiteDiario = Number(settings.limiteDiario);
  const validQuantity = quantidadePorDia >= 1 ? quantidadePorDia : fallbackDailyQuantity;
  const validDailyLimit = limiteDiario >= 1 ? limiteDiario : validQuantity;
  return Math.min(validQuantity, validDailyLimit);
}

export function generateTodaySendQueue(
  candidates: RecruitmentCandidate[],
  settings: RecruitmentSettings,
  referenceDate = new Date()
): SendQueueItem[] {
  const presentationDate = getNextPresentationDate(referenceDate);
  const dataApresentacao = formatLocalDate(presentationDate);
  const horarioApresentacao = "14:00";
  const apresentacao = presentationDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  });
  const dailyLimit = getOperationalDailyLimit(settings);

  return candidates
    .filter((candidate) => candidate.status === "Valido")
    .slice(0, dailyLimit)
    .map((candidate, index) => ({
      id: index + 1,
      nome: candidate.nome,
      telefone: candidate.telefone,
      fonte: candidate.fonte,
      cargo: candidate.cargo,
      data_apresentacao: dataApresentacao,
      horario_apresentacao: horarioApresentacao,
      apresentacao,
      mensagem: `Ola, ${candidate.nome}. Temos uma apresentacao Home Life para ${candidate.cargo || "consultor comercial"} no dia ${apresentacao} as ${horarioApresentacao}. Posso te enviar os detalhes?`,
      status_envio: "pendente_envio"
    }));
}
