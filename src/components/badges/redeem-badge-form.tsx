"use client";

import { useActionState } from "react";
import { redeemSecretBadgeAction } from "@/actions/badges";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RedeemBadgeForm() {
  const [state, formAction, isPending] = useActionState(redeemSecretBadgeAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <span className="text-sm font-medium">Resgatar emblema secreto</span>
      <div className="flex gap-2">
        <Input name="secretWord" placeholder="Palavra secreta" className="flex-1" />
        <Button type="submit" size="sm" loading={isPending}>
          Resgatar
        </Button>
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-primary">Emblema resgatado!</p>}
    </form>
  );
}
