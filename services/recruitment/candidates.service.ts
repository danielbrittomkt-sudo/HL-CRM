import { listRecruitmentCandidates, upsertRecruitmentCandidates } from "@/repositories/recruitment/candidates.repository";
import type { RecruitmentCandidate } from "@/lib/recruitment-types";

export async function getCandidates() {
  return listRecruitmentCandidates();
}

export async function saveCandidates(candidates: RecruitmentCandidate[]) {
  return upsertRecruitmentCandidates(candidates);
}
