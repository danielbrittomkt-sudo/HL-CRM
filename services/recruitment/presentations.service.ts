import {
  listRecruitmentPresentations,
  upsertRecruitmentPresentationCandidate,
  upsertRecruitmentPresentations
} from "@/repositories/recruitment/presentations.repository";
import type { RecruitmentPresentation, RecruitmentPresentationCandidate } from "@/lib/recruitment-types";

export async function getPresentations() {
  return listRecruitmentPresentations();
}

export async function savePresentations(presentations: RecruitmentPresentation[]) {
  return upsertRecruitmentPresentations(presentations);
}

export async function savePresentationCandidate(candidate: RecruitmentPresentationCandidate) {
  return upsertRecruitmentPresentationCandidate(candidate);
}
