import { getSupabaseClient } from "@/lib/supabase";
import {
  candidateRowToRecruitmentCandidate,
  recruitmentCandidateToDbInsert,
  type RecruitmentCandidateRow
} from "@/lib/recruitment-mappers";
import type { RecruitmentCandidate } from "@/lib/recruitment-types";

const tableName = "recruitment_candidates";

export async function listRecruitmentCandidates() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(tableName).select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return ((data || []) as RecruitmentCandidateRow[]).map(candidateRowToRecruitmentCandidate);
}

export async function upsertRecruitmentCandidates(candidates: RecruitmentCandidate[]) {
  const supabase = getSupabaseClient();
  const rows = candidates.map(recruitmentCandidateToDbInsert);
  const { data, error } = await supabase
    .from(tableName)
    .upsert(rows, { onConflict: "telefone_normalizado" })
    .select("*");
  if (error) throw error;
  return ((data || []) as RecruitmentCandidateRow[]).map(candidateRowToRecruitmentCandidate);
}
