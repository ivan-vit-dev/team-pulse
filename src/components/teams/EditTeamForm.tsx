"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateTeamAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Team } from "@/lib/types/team";

const hexColor = /^#[0-9a-fA-F]{6}$/;
const urlOrEmpty = z.union([z.url(), z.literal("")]);

const schema = z.object({
  name: z.string().min(2),
  category: z.string().min(1),
  club: z.string(),
  location: z.string().min(1),
  homePitch: z.string().min(1),
  primaryColor: z.string().regex(hexColor),
  secondaryColor: z.string().regex(hexColor),
  website: urlOrEmpty,
  facebook: urlOrEmpty,
  instagram: urlOrEmpty,
  twitter: urlOrEmpty,
});

type FormValues = z.infer<typeof schema>;

// Server Components can't pass Firestore Timestamp instances (createdAt/
// updatedAt) to Client Components — only plain serializable data crosses
// that boundary. Neither field is used here, so the caller strips them.
type ClientSafeTeam = Omit<Team, "createdAt" | "updatedAt">;

export function EditTeamForm({ team }: { team: ClientSafeTeam }) {
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
      name: team.name,
      category: team.category,
      club: team.club ?? "",
      location: team.location,
      homePitch: team.homePitch,
      primaryColor: team.colors?.primary ?? "#1a7a4c",
      secondaryColor: team.colors?.secondary ?? "#12294f",
      website: team.socialLinks.website ?? "",
      facebook: team.socialLinks.facebook ?? "",
      instagram: team.socialLinks.instagram ?? "",
      twitter: team.socialLinks.twitter ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await updateTeamAction(team.id, {
        name: values.name,
        category: values.category,
        club: values.club || null,
        location: values.location,
        homePitch: values.homePitch,
        colors: { primary: values.primaryColor, secondary: values.secondaryColor },
        socialLinks: {
          website: values.website,
          facebook: values.facebook,
          instagram: values.instagram,
          twitter: values.twitter,
        },
      });
      toast.success(t("updated"));
      router.refresh();
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
        <Input id="category" {...register("category")} />
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
          <Input
            id="primaryColor"
            type="color"
            className="h-9 w-full"
            {...register("primaryColor")}
          />
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

      <div className="space-y-3 border-t border-border pt-4">
        <Label className="text-sm font-medium">{t("socialLinks")}</Label>
        <div className="space-y-1.5">
          <Label htmlFor="website">{t("website")}</Label>
          <Input id="website" placeholder="https://" {...register("website")} />
          {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="facebook">{t("facebook")}</Label>
          <Input id="facebook" placeholder="https://" {...register("facebook")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instagram">{t("instagram")}</Label>
          <Input id="instagram" placeholder="https://" {...register("instagram")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="twitter">{t("twitter")}</Label>
          <Input id="twitter" placeholder="https://" {...register("twitter")} />
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tc("saving") : tc("save")}
      </Button>
    </form>
  );
}
