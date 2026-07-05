"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // The FOUC-prevention script next-themes injects is only meant to run
      // once, during initial HTML parsing (server-emitted "text/javascript").
      // React 19 warns when a <script> tag appears from a client re-render,
      // since browsers never execute those — so on the client we mark it
      // "text/plain" (inert), matching Next.js's documented workaround.
      // suppressHydrationWarning is already force-set internally by next-themes.
      scriptProps={{
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
    >
      {children}
    </NextThemesProvider>
  );
}
