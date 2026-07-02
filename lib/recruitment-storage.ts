import type { ContactHistoryItem, RecruitmentCandidate, SendQueueItem } from "./recruitment-types";

const storageKeys = {
  candidates: "home-life-recruitment:candidates",
  queue: "home-life-recruitment:queue",
  history: "home-life-recruitment:history"
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

export function loadRecruitmentStorage() {
  const candidates = readArray<RecruitmentCandidate>(storageKeys.candidates);
  const queue = readArray<SendQueueItem>(storageKeys.queue);
  const history = readArray<ContactHistoryItem>(storageKeys.history);

  if (candidates === "corrupt" || queue === "corrupt" || history === "corrupt") {
    clearRecruitmentStorage();
    return { candidates: null, queue: null, history: null };
  }

  return {
    candidates,
    queue,
    history
  };
}

export function saveRecruitmentStorage(data: {
  candidates: RecruitmentCandidate[];
  queue: SendQueueItem[];
  history: ContactHistoryItem[];
}) {
  writeJson(storageKeys.candidates, data.candidates);
  writeJson(storageKeys.queue, data.queue);
  writeJson(storageKeys.history, data.history);
}

export function clearRecruitmentStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKeys.candidates);
  window.localStorage.removeItem(storageKeys.queue);
  window.localStorage.removeItem(storageKeys.history);
}
