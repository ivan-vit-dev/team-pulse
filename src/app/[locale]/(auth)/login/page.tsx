import { getLocale, getTranslations } from "next-intl/server";

import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoginForm } from "@/components/auth/LoginForm";
import { Separator } from "@/components/ui/separator";
import { Link } from "@/i18n/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const [{ redirect }, locale, t] = await Promise.all([
    searchParams,
    getLocale(),
    getTranslations("auth"),
  ]);
  const redirectTo = redirect ?? `/${locale}/settings`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">{t("loginTitle")}</h1>
      <LoginForm redirectTo={redirectTo} />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">{t("orContinueWith")}</span>
        <Separator className="flex-1" />
      </div>
      <GoogleSignInButton redirectTo={redirectTo} />
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")} <Link href="/register" className="text-primary underline">{t("signUp")}</Link>
      </p>
    </div>
  );
}
