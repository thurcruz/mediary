"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ProfileEditForm({
  defaultValues,
}: {
  defaultValues: {
    name: string | null;
    bio: string | null;
    profession: string | null;
    country: string | null;
    city: string | null;
    avatarUrl: string | null;
    socialLinks: { instagram?: string; twitter?: string; letterboxd?: string };
  };
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" defaultValue={defaultValues.name ?? ""} />
      </Field>

      <Field label="Bio" htmlFor="bio">
        <Textarea id="bio" name="bio" rows={3} defaultValue={defaultValues.bio ?? ""} />
      </Field>

      <Field label="Profissão" htmlFor="profession">
        <Input id="profession" name="profession" defaultValue={defaultValues.profession ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="País" htmlFor="country">
          <Input id="country" name="country" defaultValue={defaultValues.country ?? ""} />
        </Field>
        <Field label="Cidade" htmlFor="city">
          <Input id="city" name="city" defaultValue={defaultValues.city ?? ""} />
        </Field>
      </div>

      <Field label="URL do avatar" htmlFor="avatarUrl">
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          placeholder="https://..."
          defaultValue={defaultValues.avatarUrl ?? ""}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Instagram" htmlFor="instagram">
          <Input id="instagram" name="instagram" defaultValue={defaultValues.socialLinks.instagram ?? ""} />
        </Field>
        <Field label="Twitter/X" htmlFor="twitter">
          <Input id="twitter" name="twitter" defaultValue={defaultValues.socialLinks.twitter ?? ""} />
        </Field>
        <Field label="Letterboxd" htmlFor="letterboxd">
          <Input id="letterboxd" name="letterboxd" defaultValue={defaultValues.socialLinks.letterboxd ?? ""} />
        </Field>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-primary">Perfil atualizado.</p>}

      <Button type="submit" loading={isPending} className="self-start">
        Salvar perfil
      </Button>
    </form>
  );
}
