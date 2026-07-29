import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MediaCover } from "@/components/media/media-cover";
import { StarRating } from "@/components/ui/star-rating";
import { LikeButton } from "@/components/diary/like-button";
import { CommentForm } from "@/components/diary/comment-form";
import { mediaDetailHref } from "@/lib/utils/media-href";
import { diaryEntryVerbPastTense, type MediaType, type DiaryStatus, type Provider } from "@/lib/media-types";

export type DiaryEntryCardData = {
  id: string;
  status: string;
  rating: number | null;
  reviewText: string | null;
  containsSpoiler: boolean;
  loggedAt: Date;
  user: { username: string; name: string | null; avatarUrl: string | null };
  media: {
    title: string;
    cover: string | null;
    mediaType: string;
    provider: string;
    externalId: string;
  };
  likesCount: number;
  isLikedByViewer: boolean;
  commentsCount: number;
  comments: { id: string; text: string; user: { username: string; name: string | null } }[];
};

export function DiaryEntryCard({ entry }: { entry: DiaryEntryCardData }) {
  const mediaType = entry.media.mediaType as MediaType;
  const href = mediaDetailHref(mediaType, entry.media.provider as Provider, entry.media.externalId);

  return (
    <div className="flex gap-3 rounded-3xl border border-border bg-surface p-4">
      <Link href={href} className="shrink-0">
        <MediaCover src={entry.media.cover} title={entry.media.title} className="w-16" />
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1.5 text-sm">
          <Avatar src={entry.user.avatarUrl} name={entry.user.name ?? entry.user.username} size={22} />
          <Link href={`/profile/${entry.user.username}`} className="font-medium hover:text-primary">
            {entry.user.name ?? entry.user.username}
          </Link>
          <span className="text-muted">
            {diaryEntryVerbPastTense(entry.status as DiaryStatus, mediaType).toLowerCase()}
          </span>
          <Link href={href} className="font-medium hover:text-primary">
            {entry.media.title}
          </Link>
        </div>

        {entry.rating != null && <StarRating value={entry.rating} readOnly size={14} />}

        {entry.reviewText &&
          (entry.containsSpoiler ? (
            <details className="text-sm text-foreground/90">
              <summary className="cursor-pointer text-muted">Contém spoiler - toque para ver</summary>
              <p className="mt-1">{entry.reviewText}</p>
            </details>
          ) : (
            <p className="text-sm text-foreground/90">{entry.reviewText}</p>
          ))}

        <div className="mt-1 flex items-center gap-4">
          <LikeButton
            diaryEntryId={entry.id}
            initialIsLiked={entry.isLikedByViewer}
            initialCount={entry.likesCount}
          />
          <span className="ml-auto text-xs text-muted">
            {entry.loggedAt.toLocaleDateString("pt-BR")}
          </span>
        </div>

        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm text-muted marker:content-none [&::-webkit-details-marker]:hidden">
            <MessageCircle className="h-4 w-4" />
            {entry.commentsCount > 0 ? `${entry.commentsCount} comentários` : "Comentar"}
          </summary>
          <div className="mt-2 flex flex-col gap-2 border-l border-border pl-3">
            {entry.comments.map((comment) => (
              <p key={comment.id} className="text-sm">
                <span className="font-medium">{comment.user.name ?? comment.user.username}</span>{" "}
                <span className="text-foreground/90">{comment.text}</span>
              </p>
            ))}
            <CommentForm diaryEntryId={entry.id} />
          </div>
        </details>
      </div>
    </div>
  );
}
