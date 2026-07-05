"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateProfileAction } from "@/app/[locale]/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SupportedLocale } from "@/lib/types/user";

const schema = z.object({
  displayName: z.string().min(2),
  locale: z.enum(["en", "cs"]),
});

type FormValues = z.infer<typeof schema>;

interface ProfileFormProps {
  displayName: string;
  locale: SupportedLocale;
}

export function ProfileForm({ displayName, locale }: ProfileFormProps) {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName, locale },
  });

  const selectedLocale = watch("locale");

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await updateProfileAction(values);
      toast.success(t("saved"));
      router.refresh();
    } catch {
      toast.error(t("saved"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">{t("displayName")}</Label>
        <Input id="displayName" {...register("displayName")} />
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="locale">{t("language")}</Label>
        <Select
          value={selectedLocale}
          onValueChange={(value: string | null) => {
            if (value) setValue("locale", value as SupportedLocale);
          }}
        >
          <SelectTrigger id="locale" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="cs">Čeština</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? tc("saving") : tc("save")}
      </Button>
    </form>
  );
}
