import type { Metadata } from "next";
import { Roboto, Roboto_Condensed } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { AmbientBackground } from "@/components/layout/AmbientBackground";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import "../globals.css";

const fontSans = Roboto({
  variable: "--font-sans",
  weight: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
});

const fontDisplay = Roboto({
  variable: "--font-display",
  weight: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
});

// Used sparingly — hero headlines and scoreline numerals only, never body text.
// Roboto Condensed rather than an unrelated display face, so headlines still
// read as part of the same Roboto family as the rest of the UI.
const fontImpact = Roboto_Condensed({
  variable: "--font-impact",
  weight: "700",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "TeamPulse",
  description: "Follow your team's season — matches, trainings, and moments that matter.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontImpact.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <ThemeProvider>
            <AuthProvider>
              <AmbientBackground />
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
