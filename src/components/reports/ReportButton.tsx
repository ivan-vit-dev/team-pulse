"use client";

import { Flag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { reportContentAction } from "@/app/[locale]/teams/[teamId]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReportContentType, ReportReason } from "@/lib/types/report";

const REASONS: ReportReason[] = [
  "spam",
  "harassment",
  "inappropriate_content",
  "impersonation",
  "other",
];

interface ReportButtonProps {
  contentType: ReportContentType;
  contentId: string;
  isSignedIn: boolean;
  className?: string;
}

export function ReportButton({ contentType, contentId, isSignedIn, className }: ReportButtonProps) {
  const t = useTranslations("reports");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("spam");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isSignedIn) return null;

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      await reportContentAction(contentType, contentId, {
        reason,
        details: details.trim() || undefined,
      });
      toast.success(t("reportSubmitted"));
      setOpen(false);
      setReason("spam");
      setDetails("");
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={t("report")} className={className}>
            <Flag className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("report")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("reasonLabel")}</label>
            <Select
              value={reason}
              onValueChange={(value: string | null) => {
                if (value) setReason(value as ReportReason);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`reason.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t("detailsLabel")}</label>
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={t("detailsPlaceholder")}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border border-border bg-background p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
