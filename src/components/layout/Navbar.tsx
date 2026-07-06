import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export async function Navbar() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("nav")]);

  return (
    <header className="glass sticky top-0 z-40 flex items-center justify-between px-4 py-3 sm:px-6">
      <Link href="/" className="gradient-text font-display text-xl font-bold">
        TeamPulse
      </Link>
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/teams">{t("discoverTeams")}</Link>}
        />
        {user ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/teams/mine">{t("myTeams")}</Link>}
            />
            <UserMenu displayName={user.displayName} photoURL={user.photoURL} />
          </>
        ) : (
          <>
            <Button variant="ghost" size="sm" render={<Link href="/login">{t("login")}</Link>} />
            <Button
              size="sm"
              className="gradient-brand"
              render={<Link href="/register">{t("register")}</Link>}
            />
          </>
        )}
      </div>
    </header>
  );
}
