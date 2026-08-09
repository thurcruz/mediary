import { cn } from "@/lib/utils/cn";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  src,
  name,
  size = 40,
  className,
  isSupporter = false,
}: {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  /** Golden ring - Apoie-se supporter perk. */
  isSupporter?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-elevated border text-foreground font-medium",
        isSupporter ? "border-2 border-amber-400" : "border border-border",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        // Arbitrary user-supplied URL (avatar upload/link) - next/image would
        // require whitelisting every possible host, so a plain <img> is used
        // here on purpose. Media covers (TMDb/Open Library/Google Books, all
        // fixed known hosts) use next/image instead - see MediaCover.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name) || "?"}</span>
      )}
    </div>
  );
}
