"use server";

import {
  listPastActionsForSeasonPage,
  PAST_ACTIONS_PAGE_SIZE,
  type ActionPageCursor,
} from "@/lib/actions/action-repository";
import type { Action } from "@/lib/types/action";
import { omit } from "@/lib/utils/omit";

export interface ClientActionPage {
  actions: Omit<Action, "createdAt" | "updatedAt">[];
  nextCursor: ActionPageCursor | null;
}

// Public read passthrough — no admin check needed, actions are world-readable
// per firestore.rules, same trust level as loading the page itself. Strips
// Timestamp fields before returning: a Server Action's return value crosses
// the client boundary the same way Server Component props do.
export async function loadMorePastActionsAction(
  seasonId: string,
  cursor: ActionPageCursor,
): Promise<ClientActionPage> {
  const page = await listPastActionsForSeasonPage(seasonId, {
    pageSize: PAST_ACTIONS_PAGE_SIZE,
    cursor,
  });
  return {
    actions: page.actions.map((action) => omit(action, "createdAt", "updatedAt")),
    nextCursor: page.nextCursor,
  };
}
