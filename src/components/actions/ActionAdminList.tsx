"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { deleteActionAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { ActionTypeBadge } from "@/components/actions/ActionTypeBadge";
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
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Action } from "@/lib/types/action";

type ClientSafeAction = Omit<Action, "createdAt" | "updatedAt">;

interface ActionAdminListProps {
  teamId: string;
  seasonId: string;
  actions: ClientSafeAction[];
}

export function ActionAdminList({ teamId, seasonId, actions }: ActionAdminListProps) {
  const t = useTranslations("actions");
  const tc = useTranslations("common");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(actionId: string) {
    setDeletingId(actionId);
    try {
      await deleteActionAction(actionId);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setDeletingId(null);
    }
  }

  if (actions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noActionsYet")}</p>;
  }

  return (
    <div className="divide-y divide-border">
      {actions.map((action) => (
        <div key={action.id} className="flex items-center justify-between gap-3 py-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ActionTypeBadge type={action.type} />
              <span className="font-medium">{action.title}</span>
              {action.result && (
                <span className="text-sm text-muted-foreground">
                  {action.result.ourScore} : {action.result.theirScore}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {action.date}
              {action.time ? ` · ${action.time}` : ""}
              {action.location ? ` · ${action.location}` : ""}
              {" · "}
              {t("squadCount", { count: action.squadPlayerIds.length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={
                <Link href={`/teams/${teamId}/admin/seasons/${seasonId}/actions/${action.id}/edit`}>
                  {t("editAction")}
                </Link>
              }
            />
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="sm" disabled={deletingId === action.id}>
                    {t("delete")}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("confirmDeleteDescription")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deletingId === action.id}
                    onClick={() => handleDelete(action.id)}
                  >
                    {t("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
}
