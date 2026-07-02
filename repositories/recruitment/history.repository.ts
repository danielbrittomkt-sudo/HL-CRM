import { getSupabaseClient } from "@/lib/supabase";
import {
  contactHistoryItemToDbInsert,
  historyRowToContactHistoryItem,
  type RecruitmentContactHistoryRow
} from "@/lib/recruitment-mappers";
import type { ContactHistoryItem } from "@/lib/recruitment-types";

const tableName = "recruitment_contact_history";

export async function listRecruitmentContactHistory() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as RecruitmentContactHistoryRow[]).map(historyRowToContactHistoryItem);
}

export async function insertRecruitmentContactHistory(items: ContactHistoryItem[]) {
  const supabase = getSupabaseClient();
  const rows = items.map(contactHistoryItemToDbInsert);
  const { data, error } = await supabase.from(tableName).insert(rows).select("*");
  if (error) throw error;
  return ((data || []) as RecruitmentContactHistoryRow[]).map(historyRowToContactHistoryItem);
}
