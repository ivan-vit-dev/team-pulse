"use client";

import { Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";

interface ShareFollowLinkButtonProps {
  teamId: string;
  teamName: string;
}

// Deliberately just a shareable link, not an auto-follow-on-click token —
// the public team page (getPathname below) already has an explicit Follow
// button once someone lands on it, which is clearer UX than a link with a
// side effect.
export function ShareFollowLinkButton({ teamId, teamName }: ShareFollowLinkButtonProps) {
  const t = useTranslations("teams");
  const locale = useLocale();

  async function handleShare() {
    const url = `${window.location.origin}${getPathname({ href: `/teams/${teamId}`, locale })}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: teamName, url });
      } catch {
        // AbortError when the user cancels the native share sheet — not an error.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success(t("followLinkCopied"));
  }

  return (
    <Button variant="outline" onClick={handleShare}>
      <Share2 className="h-4 w-4" aria-hidden="true" />
      {t("shareFollowLink")}
    </Button>
  );
}
