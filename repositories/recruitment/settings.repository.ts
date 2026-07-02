import {
  recruitmentSettingsToDbUpsert,
  settingsRowToRecruitmentSettings,
  type RecruitmentSettingsRow
} from "@/lib/recruitment-mappers";
import { getSupabaseClient } from "@/lib/supabase";
import type { RecruitmentSettings } from "@/lib/recruitment-types";

const tableName = "recruitment_settings";

export async function getRecruitmentSettings() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(tableName).select("*").eq("id", "default").maybeSingle();
  if (error) throw error;
  return data ? settingsRowToRecruitmentSettings(data as RecruitmentSettingsRow) : null;
}

export async function upsertRecruitmentSettings(settings: RecruitmentSettings) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .upsert(recruitmentSettingsToDbUpsert(settings), { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return settingsRowToRecruitmentSettings(data as RecruitmentSettingsRow);
}
