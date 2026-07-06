"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createTeamAction } from "@/app/[locale]/(app)/teams/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";

const hexColor = /^#[0-9a-fA-F]{6}$/;

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  club: z.string(),
  location: z.string().min(1),
  homePitch: z.string().min(1),
  primaryColor: z.string().regex(hexColor),
  secondaryColor: z.string().regex(hexColor),
});

type FormValues = z.infer<typeof schema>;

export function CreateTeamForm() {
  const t = useTranslations("teams");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "",
      club: "",
      location: "",
      homePitch: "",
      primaryColor: "#1a7a4c",
      secondaryColor: "#12294f",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const { teamId } = await createTeamAction({
        name: values.name,
        category: values.category,
        club: values.club || null,
        location: values.location,
        homePitch: values.homePitch,
        colors: { primary: values.primaryColor, secondary: values.secondaryColor },
      });
      toast.success(t("created"));
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
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">{t("category")}</Label>
        <Input id="category" placeholder={t("categoryPlaceholder")} {...register("category")} />
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="club">{t("club")}</Label>
        <Input id="club" {...register("club")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location">{t("location")}</Label>
        <Input id="location" {...register("location")} />
        {errors.location && (
          <p className="text-xs text-destructive">{errors.location.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="homePitch">{t("homePitch")}</Label>
        <Input id="homePitch" {...register("homePitch")} />
        {errors.homePitch && (
          <p className="text-xs text-destructive">{errors.homePitch.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="primaryColor">{t("primaryColor")}</Label>
          <Input id="primaryColor" type="color" className="h-9 w-full" {...register("primaryColor")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="secondaryColor">{t("secondaryColor")}</Label>
          <Input
            id="secondaryColor"
            type="color"
            className="h-9 w-full"
            {...register("secondaryColor")}
          />
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="gradient-brand">
        {isSubmitting ? tc("saving") : t("createTeam")}
      </Button>
    </form>
  );
}
