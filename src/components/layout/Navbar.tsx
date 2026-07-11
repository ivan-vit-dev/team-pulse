import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { MobileNavMenu } from "@/components/layout/MobileNavMenu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserMenu } from "@/components/layout/UserMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getUnreadNotificationCount } from "@/lib/notifications/notification-repository";

export async function Navbar() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("nav")]);
  const unreadCount = user ? await getUnreadNotificationCount(user.uid) : 0;

  const mobileMenuItems = user
    ? [
        { href: "/teams", label: t("discoverTeams") },
        { href: "/teams/mine", label: t("myTeams") },
        { href: "/notifications", label: t("notifications") },
      ]
    : [
        { href: "/teams", label: t("discoverTeams") },
        { href: "/login", label: t("login") },
      ];

  return (
    <header className="glass sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
      <Link href="/" className="gradient-text font-display shrink-0 text-xl font-bold">
        TeamPulse
      </Link>
      <div className="flex items-center gap-1.5 sm:gap-3">
        <LocaleSwitcher />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex"
          render={<Link href="/teams">{t("discoverTeams")}</Link>}
        />
        {user ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              render={<Link href="/teams/mine">{t("myTeams")}</Link>}
            />
            <MobileNavMenu items={mobileMenuItems} menuLabel={t("openMenu")} />
            <NotificationBell initialUnreadCount={unreadCount} />
            <UserMenu displayName={user.displayName} photoURL={user.photoURL} />
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              render={<Link href="/login">{t("login")}</Link>}
            />
            <MobileNavMenu items={mobileMenuItems} menuLabel={t("openMenu")} />
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
