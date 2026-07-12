import { ActionTypeBadge } from "@/components/actions/ActionTypeBadge";
import { SquadChips, type ClientSafePlayer } from "@/components/timeline/SquadChips";
import { ReactionPicker } from "@/components/timeline/ReactionPicker";
import { Link } from "@/i18n/navigation";
import { getReactionCounts } from "@/lib/actions/reaction-utils";
import type { Action } from "@/lib/types/action";

type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

interface ActionCardProps {
  action: ClientSafeAction;
  players: ClientSafePlayer[];
  variant: "next" | "past" | "upcoming" | "detail";
  teamId: string;
  currentUid: string | null;
  commentsLabel?: string;
  nextLabel?: string;
}

export function ActionCard({
  action,
  players,
  variant,
  teamId,
  currentUid,
  commentsLabel,
  nextLabel,
}: ActionCardProps) {
  const tileBackground =
    variant === "next"
      ? "var(--timeline-next-bg)"
      : variant === "past"
        ? "var(--timeline-past-bg)"
        : variant === "upcoming"
          ? "var(--timeline-upcoming-bg)"
          : undefined;

  return (
    <div
      className="animate-timeline-in relative space-y-2 rounded-xl border border-border p-4"
      style={{ background: tileBackground ?? "var(--card)" }}
    >
      {variant === "next" && nextLabel && (
        <span
          className="font-display text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--floodlight)" }}
        >
          {nextLabel}
        </span>
      )}
      {variant === "past" && (
        <>
          <span className="ticket-notch -left-[9px] top-[26px]" />
          <span className="ticket-notch -right-[9px] top-[26px]" />
        </>
      )}
      <div className="flex items-center gap-2">
        <ActionTypeBadge type={action.type} />
        <span className="font-display font-bold">{action.title}</span>
        {action.opponent && (
          // "vs." is deliberately untranslated — ActionCard receives all its
          // labels as props (no useTranslations), and the abbreviation reads
          // fine in both locales.
          <span className="font-display text-muted-foreground">vs. {action.opponent}</span>
        )}
        {action.result && (
          <span className="font-impact text-lg">
            {action.result.ourScore}&thinsp;:&thinsp;{action.result.theirScore}
          </span>
        )}
      </div>
      {variant === "past" && <div className="ticket-seam" />}
      <p className="font-display text-sm text-muted-foreground">
        {action.date}
        {action.time ? ` · ${action.time}` : ""}
        {action.location ? ` · ${action.location}` : ""}
      </p>
      {variant === "detail" && action.description && (
        <p className="text-sm">{action.description}</p>
      )}
      <SquadChips playerIds={action.squadPlayerIds} players={players} />
      {variant !== "detail" && (
        <div className="flex items-center gap-2 pt-1">
          {currentUid && (
            <ReactionPicker
              actionId={action.id}
              initialCounts={getReactionCounts(action.reactions ?? {})}
              initialMyReaction={(action.reactions ?? {})[currentUid] ?? null}
            />
          )}
          <Link
            href={`/teams/${teamId}/actions/${action.id}`}
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {commentsLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
