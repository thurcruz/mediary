"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createCommentAction } from "@/actions/social";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CommentForm({ diaryEntryId }: { diaryEntryId: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createCommentAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="diaryEntryId" value={diaryEntryId} />
      <Input name="text" placeholder="Adicionar um comentário..." className="h-9 text-sm" required />
      <Button type="submit" size="sm" variant="secondary" loading={isPending}>
        Enviar
      </Button>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
