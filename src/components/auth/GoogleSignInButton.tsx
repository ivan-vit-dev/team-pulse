"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";
import { signInWithGoogle } from "@/lib/auth/client-actions";
import { getFirebaseErrorMessageKey } from "@/lib/utils/firebase-errors";

export function GoogleSignInButton({ redirectTo }: { redirectTo: string }) {
  const t = useTranslations();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleClick() {
    setIsSubmitting(true);
    try {
      await signInWithGoogle(locale);
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
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isSubmitting}
      onClick={handleClick}
    >
      {t("auth.continueWithGoogle")}
    </Button>
  );
}
