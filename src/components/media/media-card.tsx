import Link from "next/link";
import { MediaCover } from "@/components/media/media-cover";
import { MEDIA_TYPE_LABELS, type MediaType } from "@/lib/media-types";

export function MediaCard({
  href,
  title,
  cover,
  mediaType,
  year,
}: {
  href: string;
  title: string;
  cover?: string | null;
  mediaType: MediaType;
  year?: string | null;
}) {
  return (
    <Link href={href} className="group flex flex-col gap-2">
      <MediaCover src={cover} title={title} />
      <div>
        <p className="line-clamp-2 text-sm font-medium leading-snug group-hover:text-primary">{title}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <span>{MEDIA_TYPE_LABELS[mediaType]}</span>
          {year && <span>· {year}</span>}
        </div>
      </div>
    </Link>
  );
}
