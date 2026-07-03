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

export async function findRecruitmentCandidateByNormalizedPhone(normalizedPhone: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("telefone_normalizado", normalizedPhone)
    .maybeSingle();

  if (error) throw error;
  return data ? candidateRowToRecruitmentCandidate(data as RecruitmentCandidateRow) : null;
}

export async function upsertRecruitmentCandidates(candidates: RecruitmentCandidate[]) {
  const supabase = getSupabaseClient();
  const rows = candidates.map(recruitmentCandidateToDbInsert);
  const results = await Promise.all(rows.map((row) => supabase.from(tableName).insert(row)));
  const error = results.find((result) => result.error && result.error.code !== "23505")?.error;

  if (error) throw error;

  return candidates;
}
