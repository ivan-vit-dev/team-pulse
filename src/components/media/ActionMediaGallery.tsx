"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteMediaAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { ReportButton } from "@/components/reports/ReportButton";
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
import { Button } from "@/components/ui/button";
import type { Media } from "@/lib/types/media";

type ClientSafeMedia = Omit<Media, "createdAt">;

interface ActionMediaGalleryProps {
  media: ClientSafeMedia[];
  isTeamAdmin: boolean;
  currentUid: string | null;
}

export function ActionMediaGallery({ media, isTeamAdmin, currentUid }: ActionMediaGalleryProps) {
  const t = useTranslations("media");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(mediaId: string) {
    setDeletingId(mediaId);
    try {
      await deleteMediaAction(mediaId);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setDeletingId(null);
    }
  }

  if (media.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noMediaYet")}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {media.map((item) => (
        <div key={item.id} className="group relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt=""
            className="aspect-square w-full rounded-lg object-cover"
          />
          <ReportButton
            contentType="media"
            contentId={item.id}
            isSignedIn={currentUid !== null}
            className="absolute top-1.5 left-1.5 bg-background/70"
          />
          {isTeamAdmin && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={deletingId === item.id}
                    className="absolute right-1.5 top-1.5"
                  >
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
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      ))}
    </div>
  );
}
