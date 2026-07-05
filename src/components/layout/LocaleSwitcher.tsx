"use client";

import { useLocale } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  cs: "Čeština",
};

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Select
      value={locale}
      onValueChange={(nextLocale: string | null) => {
        if (!nextLocale) return;
        router.replace(pathname, { locale: nextLocale as AppLocale });
        router.refresh();
      }}
    >
      <SelectTrigger aria-label="Language" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {LOCALE_LABELS[loc]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
