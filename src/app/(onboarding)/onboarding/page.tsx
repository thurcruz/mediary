"use client";

import { useActionState } from "react";
import { completeOnboardingAction } from "@/actions/onboarding";
import { MediaTypePicker } from "@/components/onboarding/media-type-picker";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const [state, formAction, isPending] = useActionState(completeOnboardingAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">O que você quer registrar?</h1>
        <p className="mt-2 text-sm text-muted">
          Escolha os tipos de mídia que fazem parte da sua vida cultural. Você só verá conteúdo
          desses tipos no Mediary - dá para ajustar isso depois em Configurações.
        </p>
      </div>

      <MediaTypePicker />

      {state.error && <p className="text-center text-sm text-danger">{state.error}</p>}

      <Button type="submit" size="lg" loading={isPending} className="w-full">
        Começar
      </Button>
    </form>
  );
}
