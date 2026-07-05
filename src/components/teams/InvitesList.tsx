"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { acceptInviteAction, declineInviteAction } from "@/app/[locale]/(app)/invites/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { AdminInvite } from "@/lib/types/team";

// Server Components can't pass Firestore Timestamp instances to Client
// Components — the caller strips createdAt/updatedAt before passing down.
export interface InviteWithTeamName extends Omit<AdminInvite, "createdAt" | "updatedAt"> {
  teamName: string;
}

export function InvitesList({ invites }: { invites: InviteWithTeamName[] }) {
  const t = useTranslations("invites");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (invites.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noneTitle")}</p>;
  }

  async function handleAccept(inviteId: string) {
    setBusyId(inviteId);
    try {
      await acceptInviteAction(inviteId);
      toast.success(t("accepted"));
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDecline(inviteId: string) {
    setBusyId(inviteId);
    try {
      await declineInviteAction(inviteId);
      toast.success(t("declined"));
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {invites.map((invite) => (
        <Card key={invite.id}>
          <CardContent className="flex items-center justify-between gap-3 pt-6">
            <p className="text-sm">{t("invitedTo", { team: invite.teamName })}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={busyId === invite.id}
                onClick={() => handleAccept(invite.id)}
              >
                {t("accept")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === invite.id}
                onClick={() => handleDecline(invite.id)}
              >
                {t("decline")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
