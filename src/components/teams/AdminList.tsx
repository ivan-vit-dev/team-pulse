"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { removeAdminAction } from "@/app/[locale]/(app)/teams/[teamId]/admin/actions";
import { Button } from "@/components/ui/button";

export interface AdminSummary {
  uid: string;
  displayName: string;
  email: string | null;
}

interface AdminListProps {
  teamId: string;
  admins: AdminSummary[];
}

export function AdminList({ teamId, admins }: AdminListProps) {
  const t = useTranslations("teams");
  const router = useRouter();
  const [removingUid, setRemovingUid] = useState<string | null>(null);

  async function handleRemove(uid: string) {
    setRemovingUid(uid);
    try {
      await removeAdminAction(teamId, uid);
      router.refresh();
    } catch {
      toast.error(t("cannotRemoveLastAdmin"));
    } finally {
      setRemovingUid(null);
    }
  }

  return (
    <ul className="divide-y divide-border">
      {admins.map((admin) => (
        <li key={admin.uid} className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium">{admin.displayName}</p>
            {admin.email && <p className="text-xs text-muted-foreground">{admin.email}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={removingUid === admin.uid || admins.length <= 1}
            onClick={() => handleRemove(admin.uid)}
          >
            {t("removeAdmin")}
          </Button>
        </li>
      ))}
    </ul>
  );
}
