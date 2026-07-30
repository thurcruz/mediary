"use client";

import { useActionState } from "react";
import { updateLanguageAction } from "@/actions/settings";
import { LanguagePicker } from "@/components/onboarding/language-picker";
import { Button } from "@/components/ui/button";
import type { ContentLanguage } from "@/lib/media-types";

export function LanguageForm({ defaultValue }: { defaultValue: ContentLanguage }) {
  const [state, formAction, isPending] = useActionState(updateLanguageAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <LanguagePicker defaultValue={defaultValue} />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-primary">Idioma atualizado.</p>}
      <Button type="submit" loading={isPending} className="self-start">
        Salvar
      </Button>
    </form>
  );
}
