import type { ContactHistoryItem, RecruitmentCandidate, RecruitmentSettings, SendQueueItem } from "./recruitment-types";

const storageKeys = {
  candidates: "home-life-recruitment:candidates",
  queue: "home-life-recruitment:queue",
  history: "home-life-recruitment:history",
  settings: "home-life-recruitment:settings"
};

function readArray<T>(key: string): T[] | null | "corrupt" {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : "corrupt";
  } catch {
    return "corrupt";
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isRecruitmentSettings(value: unknown): value is RecruitmentSettings {
  if (!value || typeof value !== "object") return false;
  const settings = value as Partial<RecruitmentSettings>;
  return (
    typeof settings.quantidadePorDia === "number" &&
    typeof settings.horarioEnvio === "string" &&
    Array.isArray(settings.diasApresentacao) &&
    settings.diasApresentacao.every((day) => typeof day === "string") &&
    typeof settings.horarioApresentacao === "string"
  );
}

function readSettings(key: string): RecruitmentSettings | null | "corrupt" {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isRecruitmentSettings(parsed) ? parsed : "corrupt";
  } catch {
    return "corrupt";
  }
}

export function loadRecruitmentStorage() {
  const candidates = readArray<RecruitmentCandidate>(storageKeys.candidates);
  const queue = readArray<SendQueueItem>(storageKeys.queue);
  const history = readArray<ContactHistoryItem>(storageKeys.history);
  const settings = readSettings(storageKeys.settings);

  if (candidates === "corrupt" || queue === "corrupt" || history === "corrupt" || settings === "corrupt") {
    clearRecruitmentStorage();
    return { candidates: null, queue: null, history: null, settings: null };
  }

  return {
    candidates,
    queue,
    history,
    settings
  };
}

export function saveRecruitmentStorage(data: {
  candidates: RecruitmentCandidate[];
  queue: SendQueueItem[];
  history: ContactHistoryItem[];
  settings: RecruitmentSettings;
}) {
  writeJson(storageKeys.candidates, data.candidates);
  writeJson(storageKeys.queue, data.queue);
  writeJson(storageKeys.history, data.history);
  writeJson(storageKeys.settings, data.settings);
}

export function clearRecruitmentStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKeys.candidates);
  window.localStorage.removeItem(storageKeys.queue);
  window.localStorage.removeItem(storageKeys.history);
  window.localStorage.removeItem(storageKeys.settings);
}
