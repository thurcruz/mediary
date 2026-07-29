"use client";

import { useActionState } from "react";
import { createListAction } from "@/actions/lists";
import { LIST_VISIBILITIES, type ListVisibility } from "@/lib/media-types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const VISIBILITY_LABEL: Record<ListVisibility, string> = {
  PUBLIC: "Pública",
  PRIVATE: "Privada",
  UNLISTED: "Não listada",
};

export default function NewListPage() {
  const [state, formAction, isPending] = useActionState(createListAction, {});

  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-xl font-semibold tracking-tight">Nova lista</h1>

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
          <input type="checkbox" name="isCollaborative" className="accent-primary" />
          Colaborativa
        </label>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <Button type="submit" loading={isPending}>
          Criar lista
        </Button>
      </form>
    </div>
  );
}
