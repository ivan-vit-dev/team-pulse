// Fixed, viewport-relative backdrop: paints the base --background color and
// a handful of soft blurred turf/floodlight/navy shapes behind everything.
// Deliberately fixed (not absolute down the page) so it reads as constant
// atmosphere regardless of how long any given page is.
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background" aria-hidden="true">
      <span
        className="absolute -left-32 -top-40 h-[32rem] w-[32rem] rounded-full opacity-40 blur-[90px] dark:opacity-25"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, color-mix(in oklch, var(--primary) 55%, transparent), transparent 70%)",
        }}
      />
      <span
        className="absolute -right-40 top-1/4 h-[28rem] w-[28rem] rounded-full opacity-35 blur-[90px] dark:opacity-20"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, color-mix(in oklch, var(--floodlight) 55%, transparent), transparent 70%)",
        }}
      />
      <span
        className="absolute -left-40 bottom-0 h-[26rem] w-[26rem] rounded-full opacity-30 blur-[90px] dark:opacity-20"
        style={{
          background:
            "radial-gradient(circle at 40% 60%, color-mix(in oklch, var(--brand-accent) 50%, transparent), transparent 70%)",
        }}
      />
      <span
        className="absolute -bottom-32 -right-24 h-[24rem] w-[24rem] rounded-full opacity-30 blur-[90px] dark:opacity-20"
        style={{
          background:
            "radial-gradient(circle at 55% 45%, color-mix(in oklch, var(--primary) 45%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}
