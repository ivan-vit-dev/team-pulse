"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createPlayerAction,
  updatePlayerAction,
} from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { PlayerAvatarUploader } from "@/components/players/PlayerAvatarUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { computeIsYouth } from "@/lib/players/youth";
import type { PlayerWithPrivate } from "@/lib/types/player";

const schema = z.object({
  displayName: z.string().min(1),
  realName: z.string().min(1),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jerseyNumber: z.number().int().min(0).max(99).nullable(),
});

type FormValues = z.infer<typeof schema>;

// Server Components can't pass Firestore Timestamp instances to Client
// Components — the caller strips createdAt/updatedAt before passing down.
type ClientSafePlayer = Omit<PlayerWithPrivate, "createdAt" | "updatedAt">;

interface PlayerFormProps {
  teamId: string;
  player?: ClientSafePlayer;
}

export function PlayerForm({ teamId, player }: PlayerFormProps) {
  const t = useTranslations("players");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarURL, setAvatarURL] = useState<string | null>(player?.avatarURL ?? null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: player?.displayName ?? "",
      realName: player?.realName ?? "",
      birthdate: player?.birthdate ?? "",
      jerseyNumber: player?.jerseyNumber ?? null,
    },
  });

  const birthdate = watch("birthdate");
  const isYouth = birthdate && /^\d{4}-\d{2}-\d{2}$/.test(birthdate)
    ? computeIsYouth(birthdate)
    : player?.isYouth ?? false;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const input = { ...values, avatarURL: isYouth ? null : avatarURL };
      if (player) {
        await updatePlayerAction(player.id, input);
      } else {
        await createPlayerAction(teamId, input);
      }
      // No router.refresh() here: calling it immediately after push()
      // interrupts the in-flight transition (confirmed via live testing) —
      // push() to a route not yet in the router cache already fetches a
      // fresh RSC payload for the destination on its own.
      router.push(`/teams/${teamId}/admin`);
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {player && (
        <div className="space-y-1.5">
          <Label>{t("avatar")}</Label>
          {isYouth ? (
            <p className="text-xs text-muted-foreground">{t("youthNotice", { age: 18 })}</p>
          ) : (
            <PlayerAvatarUploader
              playerId={player.id}
              displayName={watch("displayName")}
              avatarURL={avatarURL}
              onUploaded={setAvatarURL}
            />
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input id="displayName" {...register("displayName")} />
        <p className="text-xs text-muted-foreground">{t("displayNameHint")}</p>
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="realName">{t("realName")}</Label>
        <Input id="realName" {...register("realName")} />
        <p className="text-xs text-muted-foreground">{t("realNameHint")}</p>
        {errors.realName && <p className="text-xs text-destructive">{errors.realName.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="birthdate">{t("birthdate")}</Label>
        <Input id="birthdate" type="date" {...register("birthdate")} />
        {errors.birthdate && (
          <p className="text-xs text-destructive">{errors.birthdate.message}</p>
        )}
        {isYouth && !player && (
          <p className="text-xs text-muted-foreground">{t("youthNotice", { age: 18 })}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="jerseyNumber">{t("jerseyNumber")}</Label>
        <Input
          id="jerseyNumber"
          type="number"
          min={0}
          max={99}
          {...register("jerseyNumber", {
            setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
          })}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tc("saving") : t("save")}
      </Button>
    </form>
  );
}
