"use client";

import { Pin, PinOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  deleteMediaAction,
  pinMediaAction,
  unpinMediaAction,
} from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
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
import { getVideoEmbedUrl } from "@/lib/media/video-url";
import type { Media } from "@/lib/types/media";
import { cn } from "@/lib/utils";

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
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(mediaId: string) {
    setPendingId(mediaId);
    try {
      await deleteMediaAction(mediaId);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  async function handleTogglePin(item: ClientSafeMedia) {
    setPendingId(item.id);
    try {
      if (item.isPinned) {
        await unpinMediaAction(item.id);
      } else {
        await pinMediaAction(item.id);
      }
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setPendingId(null);
    }
  }

  if (media.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noMediaYet")}</p>;
  }

  const sortedMedia = [...media].sort((a, b) => Number(b.isPinned) - Number(a.isPinned));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {sortedMedia.map((item) => (
        <div key={item.id} className={cn("group relative", item.kind === "videoLink" && "col-span-2")}>
          {item.kind === "videoLink" ? (
            <iframe
              src={getVideoEmbedUrl(item.url) ?? undefined}
              title={t("videoTitle")}
              className="aspect-video w-full rounded-lg border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt=""
              className="aspect-square w-full rounded-lg object-cover"
            />
          )}
          <ReportButton
            contentType="media"
            contentId={item.id}
            isSignedIn={currentUid !== null}
            className="absolute top-1.5 left-1.5 bg-background/70"
          />
          {item.isPinned && !isTeamAdmin && (
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-background/70 p-1">
              <Pin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            </span>
          )}
          {isTeamAdmin && (
            <div className="absolute right-1.5 top-1.5 flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={item.isPinned ? t("unpin") : t("pin")}
                disabled={pendingId === item.id}
                className="bg-background/70"
                onClick={() => handleTogglePin(item)}
              >
                {item.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={pendingId === item.id}
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
                      disabled={pendingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    >
                      {t("delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
