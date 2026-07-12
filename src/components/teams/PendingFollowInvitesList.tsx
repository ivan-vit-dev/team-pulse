"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { revokeFollowInviteAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Button } from "@/components/ui/button";
import type { FollowInvite } from "@/lib/types/team";

// Server Components can't pass Firestore Timestamp instances to Client
// Components — the caller strips createdAt/updatedAt before passing down.
type ClientSafeInvite = Omit<FollowInvite, "createdAt" | "updatedAt">;

export function PendingFollowInvitesList({
  teamId,
  invites,
}: {
  teamId: string;
  invites: ClientSafeInvite[];
}) {
  const t = useTranslations("teams");
  const router = useRouter();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const pending = invites.filter((invite) => invite.status === "pending");
  if (pending.length === 0) return null;

  async function handleRevoke(inviteId: string) {
    setRevokingId(inviteId);
    try {
      await revokeFollowInviteAction(teamId, inviteId);
      router.refresh();
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{t("pendingFollowInvites")}</p>
      <ul className="divide-y divide-border">
        {pending.map((invite) => (
          <li key={invite.id} className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{invite.invitedEmail}</span>
            <Button
              variant="ghost"
              size="sm"
              disabled={revokingId === invite.id}
              onClick={() => handleRevoke(invite.id)}
            >
              {t("revoke")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
