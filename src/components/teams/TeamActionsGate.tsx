"use client";

import { Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { FollowButton } from "@/components/teams/FollowButton";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface TeamActionsGateProps {
  teamId: string;
  isLoggedIn: boolean;
}

// Team actions (matches/trainings/results) are world-readable in
// firestore.rules — this is an engagement nudge, not a security boundary.
// The page only fetches/renders the real timeline when the visitor already
// follows the team or administers it; this component is what non-followers
// see in its place.
export function TeamActionsGate({ teamId, isLoggedIn }: TeamActionsGateProps) {
  const t = useTranslations("teams");
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="glass flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{ background: "color-mix(in oklch, var(--primary) 14%, transparent)", color: "var(--primary)" }}
      >
        <Lock className="h-4.5 w-4.5" aria-hidden="true" />
      </div>
      <p className="max-w-sm text-sm text-muted-foreground">
        {isLoggedIn ? t("followGateMessage") : t("followGateMessageLoggedOut")}
      </p>
      {isLoggedIn ? (
        <FollowButton
          teamId={teamId}
          initialIsFollowing={false}
          onFollowingChange={(following) => {
            if (following) router.refresh();
          }}
        />
      ) : (
        <Button
          render={
            <Link href={{ pathname: "/login", query: { redirect: `/${locale}/teams/${teamId}` } }}>
              {t("signInToFollow")}
            </Link>
          }
        />
      )}
    </div>
  );
}
