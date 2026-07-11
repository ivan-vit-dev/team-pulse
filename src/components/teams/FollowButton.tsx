"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { followTeamAction, unfollowTeamAction } from "@/app/[locale]/teams/[teamId]/actions";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  teamId: string;
  initialIsFollowing: boolean;
  className?: string;
  onFollowingChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  teamId,
  initialIsFollowing,
  className,
  onFollowingChange,
}: FollowButtonProps) {
  const t = useTranslations("teams");
  const ta = useTranslations("auth");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    const next = !isFollowing;
    setIsFollowing(next);
    onFollowingChange?.(next);
    try {
      await (next ? followTeamAction(teamId) : unfollowTeamAction(teamId));
    } catch {
      setIsFollowing(!next);
      onFollowingChange?.(!next);
      toast.error(ta("genericError"));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      variant={isFollowing ? "default" : "outline"}
      size="sm"
      disabled={isPending}
      onClick={handleClick}
      className={className}
    >
      {isFollowing ? t("following") : t("follow")}
    </Button>
  );
}
