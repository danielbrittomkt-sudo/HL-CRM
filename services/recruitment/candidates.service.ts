import {
  findRecruitmentCandidateByNormalizedPhone,
  listRecruitmentCandidates,
  upsertRecruitmentCandidates
} from "@/repositories/recruitment/candidates.repository";
import { normalizePhone } from "@/lib/recruitment-mappers";
import type { RecruitmentCandidate } from "@/lib/recruitment-types";

export async function getCandidates() {
  return listRecruitmentCandidates();
}

export async function saveCandidates(candidates: RecruitmentCandidate[]) {
  const seenPhones = new Set<string>();
  const candidatesReadyForDatabase = candidates.filter((candidate) => {
    const normalizedPhone = normalizePhone(candidate.telefone);
    if (!normalizedPhone || seenPhones.has(normalizedPhone)) return false;
    seenPhones.add(normalizedPhone);
    return true;
  });

  if (!candidatesReadyForDatabase.length) return [];

  return upsertRecruitmentCandidates(candidatesReadyForDatabase);
}

export async function candidateExistsByPhone(telefone: string) {
  const normalizedPhone = normalizePhone(telefone);
  if (!normalizedPhone) return false;
  const candidate = await findRecruitmentCandidateByNormalizedPhone(normalizedPhone);
  return Boolean(candidate);
}
