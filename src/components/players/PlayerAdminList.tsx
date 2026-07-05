"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { deletePlayerAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { YouthPrivacyBadge } from "@/components/players/YouthPrivacyBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { PlayerWithPrivate } from "@/lib/types/player";

// Server Components can't pass Firestore Timestamp instances to Client
// Components — the caller strips createdAt/updatedAt before passing down.
type ClientSafePlayer = Omit<PlayerWithPrivate, "createdAt" | "updatedAt">;

interface PlayerAdminListProps {
  teamId: string;
  players: ClientSafePlayer[];
}

export function PlayerAdminList({ teamId, players }: PlayerAdminListProps) {
  const t = useTranslations("players");
  const tt = useTranslations("teams");
  const tc = useTranslations("common");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(playerId: string) {
    setDeletingId(playerId);
    try {
      await deletePlayerAction(playerId);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (players.length === 0) {
    return <p className="text-sm text-muted-foreground">{tt("noPlayersYet")}</p>;
  }

  return (
    <div className="divide-y divide-border">
      {players.map((player) => (
        <div key={player.id} className="flex items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {player.avatarURL && <AvatarImage src={player.avatarURL} alt="" />}
              <AvatarFallback>{player.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{player.displayName}</span>
                {player.isYouth && <YouthPrivacyBadge />}
              </div>
              <p className="text-xs text-muted-foreground">{player.realName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={`/teams/${teamId}/admin/players/${player.id}/edit`}>
                  {tt("editPlayer")}
                </Link>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="destructive" size="sm">{t("delete")}</Button>} />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("confirmDeleteDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingId === player.id}
                    onClick={() => handleDelete(player.id)}
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
