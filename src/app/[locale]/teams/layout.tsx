// Public team pages (directory, team home, action detail) had no outer page
// container at all — content ran edge-to-edge with zero padding, unlike the
// (app) group's `layout.tsx`. Matches that same max-w-3xl/py-8 rhythm so the
// public and protected sides of the app read as one coherent product.
export default function PublicTeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">{children}</div>;
}
