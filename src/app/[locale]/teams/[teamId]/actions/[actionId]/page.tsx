import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { CommentList } from "@/components/comments/CommentList";
import { ActionMediaGallery } from "@/components/media/ActionMediaGallery";
import { ActionMediaUploader } from "@/components/media/ActionMediaUploader";
import { ActionCard } from "@/components/timeline/ActionCard";
import { LikeButton } from "@/components/timeline/LikeButton";
import { Link } from "@/i18n/navigation";
import { getAction } from "@/lib/actions/action-repository";
import { getCurrentUser } from "@/lib/auth/session";
import { listCommentsForAction } from "@/lib/comments/comment-repository";
import { listMediaForAction } from "@/lib/media/media-repository";
import { listPlayersForTeam } from "@/lib/players/player-repository";
import { getTeam } from "@/lib/teams/team-repository";
import { omit } from "@/lib/utils/omit";

export default async function ActionDetailPage({
  params,
}: {
  params: Promise<{ teamId: string; actionId: string }>;
}) {
  const { teamId, actionId } = await params;

  const [team, action] = await Promise.all([getTeam(teamId), getAction(actionId)]);
  if (!team || !action || action.teamId !== teamId) {
    notFound();
  }

  const [players, comments, media, user, tc, tm] = await Promise.all([
    listPlayersForTeam(teamId),
    listCommentsForAction(actionId),
    listMediaForAction(actionId),
    getCurrentUser(),
    getTranslations("comments"),
    getTranslations("media"),
  ]);

  const isAdmin = user !== null && team.adminUids.includes(user.uid);
  const teamScopeStyle = team.colors
    ? ({
        "--team-primary": team.colors.primary,
        "--team-secondary": team.colors.secondary,
      } as React.CSSProperties)
    : undefined;

  const sortedComments = [...comments].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return a.createdAt.toMillis() - b.createdAt.toMillis();
  });

  return (
    <div className="team-scope space-y-6" style={teamScopeStyle}>
      <Link href={`/teams/${teamId}`} className="text-sm text-muted-foreground hover:underline">
        ← {team.name}
      </Link>

      <ActionCard
        action={omit(action, "createdAt", "updatedAt")}
        players={players.map((player) => omit(player, "createdAt", "updatedAt"))}
        variant="detail"
        teamId={teamId}
        currentUid={user?.uid ?? null}
      />

      {user && (
        <LikeButton
          actionId={action.id}
          initialIsLiked={action.likedByUids?.includes(user.uid) ?? false}
          initialCount={action.likedByUids?.length ?? 0}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{tm("title")}</h2>
          {isAdmin && <ActionMediaUploader actionId={actionId} teamId={teamId} />}
        </div>
        <ActionMediaGallery
          media={media.map((item) => omit(item, "createdAt"))}
          isTeamAdmin={isAdmin}
        />
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold">{tc("title")}</h2>
        <CommentList
          actionId={actionId}
          teamId={teamId}
          initialComments={sortedComments.map((comment) => omit(comment, "createdAt", "updatedAt"))}
          currentUid={user?.uid ?? null}
          isTeamAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
