import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("common");

  return (
    <footer className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground sm:px-6">
      © {new Date().getFullYear()} {t("appName")}
    </footer>
  );
}
