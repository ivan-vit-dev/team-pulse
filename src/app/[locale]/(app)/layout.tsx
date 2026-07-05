import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  if (!user) {
    redirect({ href: "/login", locale });
  }

  return <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>;
}
