import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Renders posters/covers from the known, fixed provider image hosts
 * (TMDb, Open Library, Google Books - all whitelisted in next.config.ts).
 * Unlike Avatar, this can safely use next/image since the set of hosts is
 * closed and known ahead of time.
 */
export function MediaCover({
  src,
  title,
  className,
  sizes = "(min-width: 1024px) 180px, 33vw",
}: {
  src?: string | null;
  title: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <div className={cn("relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-surface-elevated", className)}>
      {src ? (
        <Image src={src} alt={title} fill sizes={sizes} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted">
          <ImageOff className="h-6 w-6" />
        </div>
      )}
    </div>
  );
}
