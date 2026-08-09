"use client";

import { useActionState, useState } from "react";
import { createListAction } from "@/actions/lists";
import { LIST_VISIBILITIES, type ListVisibility } from "@/lib/media-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const VISIBILITY_LABEL: Record<ListVisibility, string> = {
  PUBLIC: "Pública",
  PRIVATE: "Privada",
  UNLISTED: "Não listada",
};

type Friend = { id: string; username: string; name: string | null; avatarUrl: string | null };

export function NewListForm({ friends }: { friends: Friend[] }) {
  const [state, formAction, isPending] = useActionState(createListAction, {});
  const [isCollaborative, setIsCollaborative] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Título" htmlFor="title">
        <Input id="title" name="title" placeholder="Melhores filmes de 2025" required />
      </Field>

      <Field label="Descrição" htmlFor="description">
        <Textarea id="description" name="description" rows={3} placeholder="Opcional" />
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Visibilidade</span>
        <div className="flex gap-2">
          {LIST_VISIBILITIES.map((visibility) => (
            <label key={visibility} className="cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value={visibility}
                defaultChecked={visibility === "PUBLIC"}
                className="peer sr-only"
              />
              <span className="inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
                {VISIBILITY_LABEL[visibility]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isCollaborative"
          checked={isCollaborative}
          onChange={(e) => setIsCollaborative(e.target.checked)}
          className="accent-primary"
        />
        Colaborativa
      </label>

      {isCollaborative && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-3">
          <span className="text-xs font-medium text-muted">
            Escolha ao menos um amigo para colaborar
          </span>
          {friends.length === 0 && (
            <p className="text-sm text-muted">
              Você ainda não segue ninguém - siga alguém em Social para poder convidar.
            </p>
          )}
          {friends.map((friend) => (
            <label key={friend.id} className="flex cursor-pointer items-center gap-2 py-1">
              <input type="checkbox" name="collaboratorIds" value={friend.id} className="accent-primary" />
              <Avatar src={friend.avatarUrl} name={friend.name ?? friend.username} size={28} />
              <span className="text-sm">{friend.name ?? friend.username}</span>
            </label>
          ))}
        </div>
      )}

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" loading={isPending}>
        Criar lista
      </Button>
    </form>
  );
}
