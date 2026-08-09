"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { redeemSecretBadge } from "@/lib/services/badges";
import type { ActionResult } from "@/types/actions";

export async function redeemSecretBadgeAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const word = String(formData.get("secretWord") ?? "");

  try {
    await redeemSecretBadge(session.user.id, word);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível resgatar." };
  }

  revalidatePath(`/profile/${session.user.username}/achievements`);
  return { success: true };
}
