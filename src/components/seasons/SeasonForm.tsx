"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  createSeasonAction,
  updateSeasonAction,
} from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import type { Season } from "@/lib/types/season";

// The date inputs produce "" when left blank — onSubmit normalizes "" to
// null so the payload matches the server-side seasonSchema.
function buildSchema(dateRangeError: string) {
  return z
    .object({
      name: z.string().min(2).max(20),
      startDate: z.string(),
      endDate: z.string(),
    })
    .refine(
      // ISO yyyy-mm-dd strings compare correctly as plain strings.
      (season) => !season.startDate || !season.endDate || season.startDate <= season.endDate,
      { message: dateRangeError, path: ["endDate"] },
    );
}

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

// Server Components can't pass Firestore Timestamp instances to Client
// Components — the caller strips createdAt/updatedAt before passing down.
type ClientSafeSeason = Omit<Season, "createdAt" | "updatedAt">;

interface SeasonFormProps {
  teamId: string;
  season?: ClientSafeSeason;
}

export function SeasonForm({ teamId, season }: SeasonFormProps) {
  const t = useTranslations("seasons");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(buildSchema(t("dateRangeInvalid"))),
    defaultValues: {
      name: season?.name ?? "",
      startDate: season?.startDate ?? "",
      endDate: season?.endDate ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
      };
      if (season) {
        await updateSeasonAction(season.id, payload);
      } else {
        await createSeasonAction(teamId, payload);
      }
      toast.success(t(season ? "updated" : "created"));
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
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" placeholder={t("namePlaceholder")} {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">{t("startDate")}</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-xs text-destructive">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">{t("endDate")}</Label>
          <Input id="endDate" type="date" {...register("endDate")} />
          {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tc("saving") : tc("save")}
      </Button>
    </form>
  );
}
