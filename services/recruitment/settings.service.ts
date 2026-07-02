import { getRecruitmentSettings, upsertRecruitmentSettings } from "@/repositories/recruitment/settings.repository";
import type { RecruitmentSettings } from "@/lib/recruitment-types";

export async function loadSettings() {
  return getRecruitmentSettings();
}

export async function saveSettings(settings: RecruitmentSettings) {
  return upsertRecruitmentSettings(settings);
}
