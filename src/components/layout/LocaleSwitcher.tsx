"use client";

import { Globe } from "lucide-react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const LOCALE_LABELS: Record<AppLocale, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇺🇸" },
  cs: { name: "Čeština", flag: "🇨🇿" },
};

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  const current = LOCALE_LABELS[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" aria-label="Language" className="px-2 sm:px-2.5">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:mr-1 sm:inline">{current.flag}</span>
            <span className="hidden sm:inline">{current.name}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {routing.locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            className={cn(loc === locale && "bg-accent text-accent-foreground")}
            onClick={() => {
              router.replace(pathname, { locale: loc });
              router.refresh();
            }}
          >
            <span className="mr-2">{LOCALE_LABELS[loc].flag}</span>
            {LOCALE_LABELS[loc].name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
