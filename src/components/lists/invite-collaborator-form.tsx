"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { inviteCollaboratorAction } from "@/actions/lists";
import { Avatar } from "@/components/ui/avatar";

type Friend = { id: string; username: string; name: string | null; avatarUrl: string | null };

export function InviteCollaboratorForm({ listId, friends }: { listId: string; friends: Friend[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [invited, setInvited] = useState<string[]>([]);

  if (friends.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
      <span className="text-xs font-medium text-muted">Convidar amigo para colaborar</span>
      <div className="flex flex-col gap-1">
        {friends.map((friend) => {
          const isInvited = invited.includes(friend.id);
          return (
            <button
              key={friend.id}
              type="button"
              disabled={isPending || isInvited}
              onClick={() =>
                startTransition(async () => {
                  await inviteCollaboratorAction(listId, friend.id);
                  setInvited((prev) => [...prev, friend.id]);
                  router.refresh();
                })
              }
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-surface-elevated disabled:opacity-50"
            >
              <Avatar src={friend.avatarUrl} name={friend.name ?? friend.username} size={28} />
              <span className="flex-1">{friend.name ?? friend.username}</span>
              {isInvited ? (
                <span className="text-xs text-primary">Convidado</span>
              ) : (
                <UserPlus className="h-4 w-4 text-muted" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
