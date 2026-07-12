"use client";

import { getToken } from "firebase/messaging";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  registerFcmTokenAction,
  unregisterFcmTokenAction,
  updateNotificationPrefsAction,
} from "@/app/[locale]/(app)/settings/actions";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { firebaseVapidKey } from "@/lib/firebase/config";
import { getFcmMessaging } from "@/lib/firebase/client";
import type { NotificationCategory, NotificationPreferences } from "@/lib/types/user";

const CATEGORIES: NotificationCategory[] = [
  "newAction",
  "actionUpdated",
  "adminInvite",
  "commentReply",
  "followInvite",
];

interface NotificationPrefsFormProps {
  preferences: NotificationPreferences;
}

export function NotificationPrefsForm({ preferences }: NotificationPrefsFormProps) {
  const t = useTranslations("profile");
  const ta = useTranslations("auth");
  const router = useRouter();
  const [prefs, setPrefs] = useState(preferences);
  const [isSaving, setIsSaving] = useState(false);

  async function handleEmailChange(value: boolean) {
    const next = { ...prefs, email: value };
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

  // Not optimistic like email: a browser permission prompt can take a while
  // to resolve, and we don't want the switch to appear "on" before a token
  // is actually registered.
  async function handlePushChange(checked: boolean) {
    setIsSaving(true);
    try {
      if (checked) {
        const messaging = await getFcmMessaging();
        if (!messaging) {
          toast.error(t("pushNotSupported"));
          return;
        }
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error(t("pushPermissionDenied"));
          return;
        }
        if (!firebaseVapidKey) {
          toast.error(ta("genericError"));
          return;
        }
        const token = await getToken(messaging, { vapidKey: firebaseVapidKey });
        await registerFcmTokenAction(token);
      } else {
        const messaging = await getFcmMessaging();
        if (messaging && firebaseVapidKey) {
          const token = await getToken(messaging, { vapidKey: firebaseVapidKey });
          await unregisterFcmTokenAction(token);
        }
      }
      const next = { ...prefs, push: checked };
      await updateNotificationPrefsAction(next);
      setPrefs(next);
      router.refresh();
    } catch {
      toast.error(ta("genericError"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCategoryChange(category: NotificationCategory, checked: boolean) {
    const next = { ...prefs, categories: { ...prefs.categories, [category]: checked } };
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
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications">{t("emailNotifications")}</Label>
          <Switch
            id="email-notifications"
            checked={prefs.email}
            disabled={isSaving}
            onCheckedChange={(checked: boolean) => handleEmailChange(checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notifications">{t("pushNotifications")}</Label>
          <Switch
            id="push-notifications"
            checked={prefs.push}
            disabled={isSaving}
            onCheckedChange={(checked: boolean) => handlePushChange(checked)}
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <p className="text-sm font-medium">{t("notifyMeAbout")}</p>
        {CATEGORIES.map((category) => (
          <div key={category} className="flex items-center justify-between">
            <Label htmlFor={`category-${category}`}>{t(`category.${category}`)}</Label>
            <Switch
              id={`category-${category}`}
              checked={prefs.categories[category]}
              disabled={isSaving}
              onCheckedChange={(checked: boolean) => handleCategoryChange(category, checked)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
