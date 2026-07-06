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
      <h1 className="font-display text-2xl font-bold">{t("title")}</h1>

      <Card>
        <CardHeader>
          <h2 className="font-display text-lg font-bold">{t("avatar")}</h2>
        </CardHeader>
        <CardContent>
          <AvatarUploader displayName={user.displayName} photoURL={user.photoURL} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <ProfileForm displayName={user.displayName} locale={user.locale} />
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
