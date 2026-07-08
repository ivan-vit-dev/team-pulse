import { getTranslations } from "next-intl/server";

import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { FollowedTeamsList } from "@/components/profile/FollowedTeamsList";
import { NotificationPrefsForm } from "@/components/profile/NotificationPrefsForm";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getTeamsByIds } from "@/lib/teams/team-repository";

export default async function SettingsPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getTranslations("profile")]);

  if (!user) {
    // The (app) layout already redirects unauthenticated requests; this is
    // just a type-narrowing guard for the render below.
    return null;
  }

  const followedTeams = await getTeamsByIds(user.followedTeamIds);

  return (
    <div className="space-y-6">
      <h1 className="font-impact text-4xl uppercase">{t("title")}</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-display text-lg font-bold">{t("avatar")}</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <AvatarUploader displayName={user.displayName} photoURL={user.photoURL} />
            <div className="border-t border-border pt-6">
              <ProfileForm displayName={user.displayName} locale={user.locale} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-display text-lg font-bold">{t("notifications")}</h2>
          </CardHeader>
          <CardContent>
            <NotificationPrefsForm preferences={user.notificationPreferences} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-bold">{t("myTeams")}</h2>
        </CardHeader>
        <CardContent>
          <FollowedTeamsList teams={followedTeams} />
        </CardContent>
      </Card>
    </div>
  );
}
