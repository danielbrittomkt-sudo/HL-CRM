import { getSupabaseClient } from "@/lib/supabase";
import {
  queueRowToSendQueueItem,
  sendQueueItemToDbInsert,
  type RecruitmentQueueRow
} from "@/lib/recruitment-mappers";
import type { SendQueueItem } from "@/lib/recruitment-types";

const tableName = "recruitment_queue";

export async function listRecruitmentQueue() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return ((data || []) as RecruitmentQueueRow[]).map(queueRowToSendQueueItem);
}

export async function replaceRecruitmentQueue(items: SendQueueItem[]) {
  const supabase = getSupabaseClient();
  const deleteResult = await supabase.from(tableName).delete().not("id", "is", null);
  if (deleteResult.error) throw deleteResult.error;
  if (!items.length) return [];

  const rows = items.map(sendQueueItemToDbInsert);
  const { data, error } = await supabase.from(tableName).insert(rows).select("*");
  if (error) throw error;
  return ((data || []) as RecruitmentQueueRow[]).map(queueRowToSendQueueItem);
}
