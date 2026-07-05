import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LandingPage() {
  const [user, t] = await Promise.all([
    getCurrentUser(),
    getTranslations("auth"),
  ]);

  return (
    <div className="gradient-hero flex flex-col items-center gap-6 px-6 py-24 text-center">
      <h1 className="gradient-text font-display text-5xl font-bold uppercase tracking-wide">
        TeamPulse
      </h1>
      <p className="max-w-md text-muted-foreground">
        Follow your team&apos;s season — matches, trainings, and the moments that matter.
      </p>
      <div className="flex gap-3">
        {user ? (
          <Button
            size="lg"
            className="gradient-brand"
            render={<Link href="/settings">Go to your profile</Link>}
          />
        ) : (
          <>
            <Button size="lg" className="gradient-brand" render={<Link href="/register">{t("signUp")}</Link>} />
            <Button size="lg" variant="outline" render={<Link href="/login">{t("signIn")}</Link>} />
          </>
        )}
      </div>
    </div>
  );
}
