"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppLocale } from "@/i18n/routing";
import { signUpWithEmail } from "@/lib/auth/client-actions";
import { getFirebaseErrorMessageKey } from "@/lib/utils/firebase-errors";

const schema = z.object({
  displayName: z.string().min(2),
  email: z.email(),
  password: z.string().min(8),
});

type FormValues = z.infer<typeof schema>;

export function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await signUpWithEmail(values.email, values.password, values.displayName, locale);
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      const code = error instanceof Error && "code" in error ? String(error.code) : "";
      toast.error(t(getFirebaseErrorMessageKey(code)));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">{t("auth.displayName")}</Label>
        <Input id="displayName" autoComplete="name" {...register("displayName")} />
        {errors.displayName && (
          <p className="text-xs text-destructive">{errors.displayName.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full gradient-brand">
        {isSubmitting ? t("common.saving") : t("auth.registerButton")}
      </Button>
    </form>
  );
}
