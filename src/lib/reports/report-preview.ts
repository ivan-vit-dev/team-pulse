import "server-only";

import { getComment } from "@/lib/comments/comment-repository";
import { getMedia } from "@/lib/media/media-repository";
import { getPlayerPublic } from "@/lib/players/player-repository";
import { getTeam } from "@/lib/teams/team-repository";
import type { Report } from "@/lib/types/report";

export interface ReportPreview {
  /** Null when the underlying content is already gone (deleted by its
   *  author, or removed via a previous report against the same item) — the
   *  UI shows "content no longer available" and hides Remove-content. */
  label: string | null;
  href: string | null;
}

export async function buildReportPreview(teamId: string, report: Report): Promise<ReportPreview> {
  switch (report.contentType) {
    case "comment": {
      const comment = await getComment(report.contentId);
      if (!comment) return { label: null, href: null };
      return { label: comment.text.slice(0, 80), href: `/teams/${teamId}/actions/${comment.actionId}` };
    }
    case "media": {
      const media = await getMedia(report.contentId);
      if (!media) return { label: null, href: null };
      return { label: media.url, href: `/teams/${teamId}/actions/${media.actionId}` };
    }
    case "player": {
      const player = await getPlayerPublic(report.contentId);
      if (!player) return { label: null, href: null };
      return { label: player.displayName, href: `/teams/${teamId}` };
    }
    case "team": {
      const team = await getTeam(report.contentId);
      if (!team) return { label: null, href: null };
      return { label: team.name, href: `/teams/${teamId}` };
    }
  }
}
