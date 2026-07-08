import { ActionTypeBadge } from "@/components/actions/ActionTypeBadge";
import { SquadChips, type ClientSafePlayer } from "@/components/timeline/SquadChips";
import { LikeButton } from "@/components/timeline/LikeButton";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
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
  return (
    <div
      className={cn(
        "animate-timeline-in relative space-y-2 rounded-xl border border-border bg-card p-4",
        variant === "next" && "animate-pulse-next overflow-hidden",
      )}
      style={{
        boxShadow: variant === "next" ? "var(--timeline-next-ring)" : undefined,
        opacity: variant === "past" ? "var(--timeline-past-opacity)" : undefined,
        filter: variant === "upcoming" ? "var(--timeline-upcoming-filter)" : undefined,
      }}
    >
      {variant === "next" && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-[1]"
            style={{
              background:
                "radial-gradient(120% 140% at 0% 0%, color-mix(in oklch, var(--floodlight) 16%, transparent), transparent 60%)",
            }}
          />
          {nextLabel && (
            <span
              className="font-display text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--floodlight)" }}
            >
              {nextLabel}
            </span>
          )}
        </>
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
      <SquadChips playerIds={action.squadPlayerIds} players={players} />
      {variant !== "detail" && (
        <div className="flex items-center gap-2 pt-1">
          {currentUid && (
            <LikeButton
              actionId={action.id}
              initialIsLiked={action.likedByUids?.includes(currentUid) ?? false}
              initialCount={action.likedByUids?.length ?? 0}
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
