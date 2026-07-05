import { getSupabaseClient } from "@/lib/supabase";
import {
  presentationCandidateRowToRecruitmentPresentationCandidate,
  presentationRowToRecruitmentPresentation,
  recruitmentPresentationCandidateToDbUpsert,
  recruitmentPresentationToDbUpsert,
  type RecruitmentPresentationCandidateRow,
  type RecruitmentPresentationRow
} from "@/lib/recruitment-mappers";
import type { RecruitmentPresentation, RecruitmentPresentationCandidate } from "@/lib/recruitment-types";

const presentationsTable = "recruitment_presentations";
const presentationCandidatesTable = "recruitment_presentation_candidates";

export async function listRecruitmentPresentations() {
  const supabase = getSupabaseClient();
  const { data: presentations, error: presentationsError } = await supabase
    .from(presentationsTable)
    .select("*")
    .order("data", { ascending: true })
    .order("horario", { ascending: true });

  if (presentationsError) throw presentationsError;

  const { data: candidates, error: candidatesError } = await supabase
    .from(presentationCandidatesTable)
    .select("*")
    .order("created_at", { ascending: true });

  if (candidatesError) throw candidatesError;

  const candidateRows = ((candidates || []) as RecruitmentPresentationCandidateRow[]).map(
    presentationCandidateRowToRecruitmentPresentationCandidate
  );

  return ((presentations || []) as RecruitmentPresentationRow[]).map((presentation) =>
    presentationRowToRecruitmentPresentation(
      presentation,
      candidateRows.filter((candidate) => candidate.presentationId === presentation.id)
    )
  );
}

export async function upsertRecruitmentPresentations(presentations: RecruitmentPresentation[]) {
  const supabase = getSupabaseClient();
  const presentationRows = presentations.map(recruitmentPresentationToDbUpsert);
  const candidateRows = presentations.flatMap((presentation) =>
    presentation.candidates.map(recruitmentPresentationCandidateToDbUpsert)
  );

  if (presentationRows.length) {
    const { error } = await supabase.from(presentationsTable).upsert(presentationRows, { onConflict: "id" });
    if (error) throw error;
  }

  if (candidateRows.length) {
    const { error } = await supabase.from(presentationCandidatesTable).upsert(candidateRows, { onConflict: "id" });
    if (error) throw error;
  }

  return presentations;
}

export async function upsertRecruitmentPresentationCandidate(candidate: RecruitmentPresentationCandidate) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(presentationCandidatesTable)
    .upsert(recruitmentPresentationCandidateToDbUpsert(candidate), { onConflict: "presentation_id,telefone_normalizado" });

  if (error) throw error;
  return candidate;
}
