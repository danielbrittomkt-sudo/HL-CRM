import { insertRecruitmentContactHistory, listRecruitmentContactHistory } from "@/repositories/recruitment/history.repository";
import type { ContactHistoryItem } from "@/lib/recruitment-types";

export async function getContactHistory() {
  return listRecruitmentContactHistory();
}

export async function saveContactHistory(items: ContactHistoryItem[]) {
  return insertRecruitmentContactHistory(items);
}
