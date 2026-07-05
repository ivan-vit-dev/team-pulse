"use client";

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export function YouthPrivacyBadge({ className }: { className?: string }) {
  const t = useTranslations("players");

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full p-0.5",
        className,
      )}
      style={{ backgroundColor: "color-mix(in oklch, var(--primary) 15%, transparent)" }}
      role="img"
      aria-label={t("privacyProtected")}
      title={t("privacyProtected")}
    >
      <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
    </span>
  );
}
