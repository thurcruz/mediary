"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema, updateSettingsSchema } from "@/lib/validations/profile";
import type { ActionResult } from "@/types/actions";

export async function updateProfileAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name") || undefined,
    bio: formData.get("bio") || undefined,
    profession: formData.get("profession") || undefined,
    country: formData.get("country") || undefined,
    city: formData.get("city") || undefined,
    avatarUrl: formData.get("avatarUrl") || undefined,
    socialLinks: {
      instagram: formData.get("instagram") || undefined,
      twitter: formData.get("twitter") || undefined,
      letterboxd: formData.get("letterboxd") || undefined,
    },
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { avatarUrl, ...rest } = parsed.data;
  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...rest, avatarUrl: avatarUrl || null },
  });

  revalidatePath("/settings");
  revalidatePath(`/profile/${session.user.username}`);
  return { success: true };
}

export async function updateMediaTypesAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const parsed = updateSettingsSchema.safeParse({
    enabledMediaTypes: formData.getAll("enabledMediaTypes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Selecione ao menos um tipo de mídia" };
  }

  await prisma.userSettings.update({
    where: { userId: session.user.id },
    data: { enabledMediaTypes: parsed.data.enabledMediaTypes },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
