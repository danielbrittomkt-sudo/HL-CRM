import { listRecruitmentQueue, replaceRecruitmentQueue } from "@/repositories/recruitment/queue.repository";
import type { SendQueueItem } from "@/lib/recruitment-types";

export async function getQueue() {
  return listRecruitmentQueue();
}

export async function saveQueue(items: SendQueueItem[]) {
  return replaceRecruitmentQueue(items);
}
