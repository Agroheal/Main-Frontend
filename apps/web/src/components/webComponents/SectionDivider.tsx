import { cn } from "@/lib/utils";

type SectionDividerProps = {
  position?: "top" | "bottom";
  className?: string;
};

/**
 * Organic section divider using currentColor fill.
 * Use with semantic text color classes (e.g. text-background, text-muted).
 */
export function SectionDivider({
  position = "bottom",
  className,
}: SectionDividerProps) {
  const isTop = position === "top";

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute left-0 right-0 w-full",
        isTop ? "top-0 -translate-y-full" : "bottom-0 translate-y-full",
        className,
      )}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
    >
      <path
        d="M0,64 C120,80 240,108 360,96 C480,84 600,32 720,36 C840,40 960,92 1080,96 C1200,100 1320,64 1440,44 L1440,120 L0,120 Z"
        fill="currentColor"
      />
    </svg>
  );
}
