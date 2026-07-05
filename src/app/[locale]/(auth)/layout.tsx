import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect({ href: "/settings", locale: user.locale });
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
