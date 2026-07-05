"use client";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/i18n/navigation";
import { signOutClient } from "@/lib/auth/client-actions";

interface UserMenuProps {
  displayName: string;
  photoURL: string | null;
}

export function UserMenu({ displayName, photoURL }: UserMenuProps) {
  const t = useTranslations("nav");
  const router = useRouter();

  async function handleLogout() {
    await signOutClient();
    router.push("/");
    router.refresh();
  }

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="rounded-full focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={displayName}
          >
            <Avatar className="h-8 w-8">
              {photoURL && <AvatarImage src={photoURL} alt="" />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<Link href="/settings">{t("settings")}</Link>} />
        <DropdownMenuItem onClick={handleLogout}>{t("logout")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
