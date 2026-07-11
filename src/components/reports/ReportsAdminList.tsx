"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  dismissReportAction,
  removeReportedContentAction,
  resolveReportAction,
} from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ReportContentType, ReportReason } from "@/lib/types/report";

export interface ReportSummary {
  id: string;
  contentType: ReportContentType;
  reason: ReportReason;
  details: string | null;
  createdAt: string;
  previewLabel: string | null;
  previewHref: string | null;
}

export function ReportsAdminList({ reports }: { reports: ReportSummary[] }) {
  const t = useTranslations("reports");
  const ta = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [actingId, setActingId] = useState<string | null>(null);

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noPendingReports")}</p>;
  }

  async function handleDismiss(reportId: string) {
    setActingId(reportId);
    try {
      await dismissReportAction(reportId);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setActingId(null);
    }
  }

  async function handleResolve(reportId: string) {
    setActingId(reportId);
    try {
      await resolveReportAction(reportId);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setActingId(null);
    }
  }

  async function handleRemoveContent(reportId: string) {
    setActingId(reportId);
    try {
      await removeReportedContentAction(reportId);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setActingId(null);
    }
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id} className="space-y-2 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t(`contentType.${report.contentType}`)}</Badge>
            <span className="text-sm font-medium">{t(`reason.${report.reason}`)}</span>
            <span className="text-xs text-muted-foreground">{report.createdAt}</span>
          </div>
          {report.details && <p className="text-sm text-muted-foreground">{report.details}</p>}
          {report.previewLabel ? (
            <Link
              href={report.previewHref ?? "#"}
              className="block truncate text-sm text-muted-foreground hover:text-foreground hover:underline"
            >
              {report.previewLabel}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground italic">{t("contentUnavailable")}</p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={actingId === report.id}
              onClick={() => handleDismiss(report.id)}
            >
              {t("dismiss")}
            </Button>
            {report.contentType === "team" ? (
              <Button
                variant="outline"
                size="sm"
                disabled={actingId === report.id}
                onClick={() => handleResolve(report.id)}
              >
                {t("resolve")}
              </Button>
            ) : (
              report.previewLabel && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button variant="destructive" size="sm" disabled={actingId === report.id}>
                        {t("removeContent")}
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("confirmRemoveTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>{t("confirmRemoveDescription")}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        disabled={actingId === report.id}
                        onClick={() => handleRemoveContent(report.id)}
                      >
                        {t("removeContent")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
