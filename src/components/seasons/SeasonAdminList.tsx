"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  archiveSeasonAction,
  deleteSeasonAction,
  setActiveSeasonAction,
  unarchiveSeasonAction,
} from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Season } from "@/lib/types/season";

type ClientSafeSeason = Omit<Season, "createdAt" | "updatedAt">;

interface SeasonAdminListProps {
  teamId: string;
  seasons: ClientSafeSeason[];
}

export function SeasonAdminList({ teamId, seasons }: SeasonAdminListProps) {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleSetActive(seasonId: string) {
    setPendingId(seasonId);
    try {
      await setActiveSeasonAction(seasonId);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(seasonId: string) {
    setPendingId(seasonId);
    try {
      await deleteSeasonAction(seasonId);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  async function handleToggleArchived(season: ClientSafeSeason) {
    setPendingId(season.id);
    try {
      if (season.isArchived) {
        await unarchiveSeasonAction(season.id);
      } else {
        await archiveSeasonAction(season.id);
      }
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  if (seasons.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noSeasonsYet")}</p>;
  }

  return (
    <div className="divide-y divide-border">
      {seasons.map((season) => (
        <div key={season.id} className="flex items-center justify-between gap-3 py-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{season.name}</span>
              {season.isActive && <Badge>{t("active")}</Badge>}
              {season.isArchived && <Badge variant="outline">{t("archived")}</Badge>}
            </div>
            {(season.startDate || season.endDate) && (
              <p className="text-xs text-muted-foreground">
                {season.startDate ?? "…"} – {season.endDate ?? "…"}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!season.isActive && !season.isArchived && (
              <Button
                variant="outline"
                size="sm"
                disabled={pendingId === season.id}
                onClick={() => handleSetActive(season.id)}
              >
                {t("setActive")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={pendingId === season.id}
              onClick={() => handleToggleArchived(season)}
            >
              {season.isArchived ? t("unarchive") : t("archive")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/teams/${teamId}/admin/seasons/${season.id}/edit`}>{t("editSeason")}</Link>}
            />
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="sm" disabled={pendingId === season.id}>
                    {t("delete")}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("confirmDeleteDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={pendingId === season.id}
                    onClick={() => handleDelete(season.id)}
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
