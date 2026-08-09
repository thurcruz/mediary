"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchUsersAction } from "@/actions/social";
import type { UserSearchResult } from "@/lib/services/user-search";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { FollowButton } from "@/components/diary/follow-button";
import type { MediaType } from "@/lib/media-types";

export function UserSearch({
  initialSuggestions,
  viewerMediaTypes,
}: {
  initialSuggestions: UserSearchResult[];
  viewerMediaTypes: MediaType[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>(initialSuggestions);
  const [isPending, startTransition] = useTransition();

  const trimmedQuery = query.trim();

  useEffect(() => {
    const timeout = setTimeout(() => {
      startTransition(async () => {
        setResults(await searchUsersAction(trimmedQuery, viewerMediaTypes));
      });
    }, 350);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery]);

  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou @usuário"
          className="pl-11"
          autoFocus
        />
        {isPending && (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted" />
        )}
      </div>

      {trimmedQuery.length < 2 && (
        <p className="text-sm text-muted">Sugestões para você seguir</p>
      )}

      {!isPending && trimmedQuery.length >= 2 && results.length === 0 && (
        <p className="text-center text-sm text-muted">Nenhum usuário encontrado para &quot;{trimmedQuery}&quot;.</p>
      )}

      <div className="flex flex-col gap-2">
        {results.map((user) => (
          <UserResultCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function UserResultCard({ user }: { user: UserSearchResult }) {
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <Link href={`/profile/${user.username}`} className="flex flex-1 items-center gap-3 min-w-0">
        <Avatar src={user.avatarUrl} name={user.name ?? user.username} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{user.name ?? user.username}</p>
          <p className="truncate text-xs text-muted">@{user.username}</p>
        </div>
      </Link>
      <FollowButton
        targetUserId={user.id}
        initialIsFollowing={isFollowing}
        onToggled={setIsFollowing}
      />
    </div>
  );
}
