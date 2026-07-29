"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validations/onboarding";
import type { ActionResult } from "@/types/actions";

export async function completeOnboardingAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  const enabledMediaTypes = formData.getAll("enabledMediaTypes");
  const parsed = onboardingSchema.safeParse({ enabledMediaTypes });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Selecione ao menos um tipo de mídia" };
  }

  await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, enabledMediaTypes: parsed.data.enabledMediaTypes, theme: "dark" },
    update: { enabledMediaTypes: parsed.data.enabledMediaTypes },
  });

  redirect("/");
}
