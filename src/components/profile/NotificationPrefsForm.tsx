"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { updateNotificationPrefsAction } from "@/app/[locale]/(app)/settings/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { NotificationPreferences } from "@/lib/types/user";

interface NotificationPrefsFormProps {
  preferences: NotificationPreferences;
}

export function NotificationPrefsForm({ preferences }: NotificationPrefsFormProps) {
  const t = useTranslations("profile");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [prefs, setPrefs] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(key: keyof NotificationPreferences, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setIsSaving(true);
    try {
      await updateNotificationPrefsAction(next);
      router.refresh();
    } catch {
      setPrefs(prefs);
      toast.error(ta("genericError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="email-notifications">{t("emailNotifications")}</Label>
        <Switch
          id="email-notifications"
          checked={prefs.email}
          disabled={isSaving}
          onCheckedChange={(checked: boolean) => handleChange("email", checked)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label htmlFor="push-notifications">{t("pushNotifications")}</Label>
        <Switch
          id="push-notifications"
          checked={prefs.push}
          disabled={isSaving}
          onCheckedChange={(checked: boolean) => handleChange("push", checked)}
        />
      </div>
    </div>
  );
}
