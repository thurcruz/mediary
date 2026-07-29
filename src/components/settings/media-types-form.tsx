"use client";

import { useActionState } from "react";
import { updateMediaTypesAction } from "@/actions/settings";
import { MediaTypePicker } from "@/components/onboarding/media-type-picker";
import { Button } from "@/components/ui/button";
import type { MediaType } from "@/lib/media-types";

export function MediaTypesForm({ defaultValues }: { defaultValues: MediaType[] }) {
  const [state, formAction, isPending] = useActionState(updateMediaTypesAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <MediaTypePicker defaultValues={defaultValues} />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-primary">Preferências atualizadas.</p>}
      <Button type="submit" loading={isPending} className="self-start">
        Salvar
      </Button>
    </form>
  );
}
