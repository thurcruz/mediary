"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from "@/lib/services/diary";
import { diaryEntrySchema } from "@/lib/validations/diary";
import type { ActionResult } from "@/types/actions";

export async function logDiaryEntryAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login para registrar." };

  const ratingRaw = formData.get("rating");
  const parsed = diaryEntrySchema.safeParse({
    mediaId: formData.get("mediaId"),
    status: formData.get("status"),
    rating: ratingRaw ? Number(ratingRaw) : null,
    reviewText: formData.get("reviewText") || undefined,
    containsSpoiler: formData.get("containsSpoiler") === "on",
    isFavorite: formData.get("isFavorite") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await logDiaryEntry(session.user.id, parsed.data);
  revalidatePath("/", "layout");

  return { success: true };
}

export async function updateDiaryEntryAction(
  entryId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const ratingRaw = formData.get("rating");
  const parsed = diaryEntrySchema.safeParse({
    mediaId: formData.get("mediaId"),
    status: formData.get("status"),
    rating: ratingRaw ? Number(ratingRaw) : null,
    reviewText: formData.get("reviewText") || undefined,
    containsSpoiler: formData.get("containsSpoiler") === "on",
    isFavorite: formData.get("isFavorite") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await updateDiaryEntry(session.user.id, entryId, parsed.data);
  } catch {
    return { error: "Não foi possível editar este registro." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteDiaryEntryAction(entryId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  await deleteDiaryEntry(session.user.id, entryId).catch(() => {});
  revalidatePath("/", "layout");
}
