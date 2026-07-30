"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema, updateSettingsSchema, updateLanguageSchema } from "@/lib/validations/profile";
import { uploadAvatar } from "@/lib/services/avatar-upload";
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
    socialLinks: {
      instagram: formData.get("instagram") || undefined,
      twitter: formData.get("twitter") || undefined,
      tiktok: formData.get("tiktok") || undefined,
      letterboxd: formData.get("letterboxd") || undefined,
      youtube: formData.get("youtube") || undefined,
      other: formData.get("other") || undefined,
    },
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatarFile");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      avatarUrl = await uploadAvatar(session.user.id, avatarFile);
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Falha no upload da imagem" };
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...parsed.data, ...(avatarUrl ? { avatarUrl } : {}) },
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

export async function updateLanguageAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const parsed = updateLanguageSchema.safeParse({ language: formData.get("language") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Idioma inválido" };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { language: parsed.data.language },
  });

  revalidatePath("/", "layout");
  return { success: true };
}
