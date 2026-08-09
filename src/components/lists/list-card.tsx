import Link from "next/link";
import { Lock, Users, Globe } from "lucide-react";
import { MediaCover } from "@/components/media/media-cover";
import type { ListVisibility } from "@/lib/media-types";

const VISIBILITY_ICON: Record<ListVisibility, typeof Lock> = {
  PUBLIC: Globe,
  PRIVATE: Lock,
  UNLISTED: Users,
};

export function ListCard({
  id,
  title,
  visibility,
  itemCount,
  covers,
  creatorName,
}: {
  id: string;
  title: string;
  visibility: ListVisibility;
  itemCount: number;
  covers: (string | null)[];
  /** Shown below the title for lists you follow but didn't create. */
  creatorName?: string;
}) {
  const Icon = VISIBILITY_ICON[visibility];

  return (
    <Link
      href={`/lists/${id}`}
      className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-4 hover:border-primary/50"
    >
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <MediaCover key={i} src={covers[i]} title={title} className="aspect-square" />
        ))}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <Icon className="h-3.5 w-3.5" />
          <span>{itemCount} itens</span>
        </div>
        {creatorName && <p className="mt-1 text-xs text-muted">por {creatorName}</p>}
      </div>
    </Link>
  );
}
