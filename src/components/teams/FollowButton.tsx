"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { followTeamAction, unfollowTeamAction } from "@/app/[locale]/teams/[teamId]/actions";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  teamId: string;
  initialIsFollowing: boolean;
}

export function FollowButton({ teamId, initialIsFollowing }: FollowButtonProps) {
  const t = useTranslations("teams");
  const ta = useTranslations("auth");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      await (next ? followTeamAction(teamId) : unfollowTeamAction(teamId));
    } catch {
      setIsFollowing(!next);
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
    >
      {isFollowing ? t("following") : t("follow")}
    </Button>
  );
}
