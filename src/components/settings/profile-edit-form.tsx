"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/settings";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { PrefixedInput } from "@/components/ui/prefixed-input";
import { AvatarUploadField } from "@/components/settings/avatar-upload-field";

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
    socialLinks: {
      instagram?: string;
      twitter?: string;
      tiktok?: string;
      letterboxd?: string;
      youtube?: string;
      other?: string;
    };
  };
}) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, {});
  const social = defaultValues.socialLinks;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AvatarUploadField
        name="avatarFile"
        defaultAvatarUrl={defaultValues.avatarUrl}
        displayName={defaultValues.name ?? "?"}
      />

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

      <div className="flex flex-col gap-3">
        <span className="text-sm font-medium text-foreground">Redes sociais</span>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Instagram" htmlFor="instagram">
            <PrefixedInput
              id="instagram"
              name="instagram"
              prefix="instagram.com/"
              placeholder="seuusuario"
              defaultValue={social.instagram ?? ""}
            />
          </Field>
          <Field label="Twitter/X" htmlFor="twitter">
            <PrefixedInput
              id="twitter"
              name="twitter"
              prefix="x.com/"
              placeholder="seuusuario"
              defaultValue={social.twitter ?? ""}
            />
          </Field>
          <Field label="TikTok" htmlFor="tiktok">
            <PrefixedInput
              id="tiktok"
              name="tiktok"
              prefix="tiktok.com/@"
              placeholder="seuusuario"
              defaultValue={social.tiktok ?? ""}
            />
          </Field>
          <Field label="Letterboxd" htmlFor="letterboxd">
            <PrefixedInput
              id="letterboxd"
              name="letterboxd"
              prefix="letterboxd.com/"
              placeholder="seuusuario"
              defaultValue={social.letterboxd ?? ""}
            />
          </Field>
        </div>

        <Field label="YouTube" htmlFor="youtube">
          <Input
            id="youtube"
            name="youtube"
            type="url"
            placeholder="https://youtube.com/@seucanal"
            defaultValue={social.youtube ?? ""}
          />
        </Field>
        <Field label="Outra rede" htmlFor="other">
          <Input
            id="other"
            name="other"
            type="url"
            placeholder="https://..."
            defaultValue={social.other ?? ""}
          />
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
