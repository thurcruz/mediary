import { Film, Tv, Sparkles, BookOpen, Book, BookMarked, Disc3, Music2, Gamepad2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MEDIA_TYPES, MEDIA_TYPE_LABELS, LIVE_MEDIA_TYPES, type MediaType } from "@/lib/media-types";

const ICONS: Record<MediaType, LucideIcon> = {
  MOVIE: Film,
  TV_SHOW: Tv,
  ANIME: Sparkles,
  MANGA: BookOpen,
  BOOK: Book,
  COMIC: BookMarked,
  ALBUM: Disc3,
  TRACK: Music2,
  GAME: Gamepad2,
};

/** Pure checkbox-card grid - no client JS needed, styling is peer-checked driven. */
export function MediaTypePicker({ defaultValues = [] }: { defaultValues?: MediaType[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {MEDIA_TYPES.map((type) => {
        const Icon = ICONS[type];
        const isLive = LIVE_MEDIA_TYPES.includes(type);
        return (
          <label key={type} className="group cursor-pointer">
            <input
              type="checkbox"
              name="enabledMediaTypes"
              value={type}
              defaultChecked={defaultValues.includes(type)}
              className="peer sr-only"
            />
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center text-muted transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
              <Icon className="h-6 w-6" strokeWidth={2} />
              <span className="text-sm font-medium text-foreground">{MEDIA_TYPE_LABELS[type]}</span>
              {!isLive && <span className="text-[11px] text-muted">Em breve</span>}
            </div>
          </label>
        );
      })}
    </div>
  );
}
