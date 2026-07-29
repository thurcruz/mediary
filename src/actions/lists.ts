"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createListSchema } from "@/lib/validations/lists";
import { resolveOrCacheMedia } from "@/lib/services/media-cache";
import type { MediaType, Provider } from "@/lib/media-types";
import type { ActionResult } from "@/types/actions";

export async function createListAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const parsed = createListSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility") ?? "PUBLIC",
    isCollaborative: formData.get("isCollaborative") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const list = await prisma.list.create({ data: { ...parsed.data, userId: session.user.id } });
  redirect(`/lists/${list.id}`);
}

async function assertListOwner(listId: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) return null;
  return list;
}

export async function addMediaToListAction(
  listId: string,
  mediaType: MediaType,
  provider: Provider,
  externalId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const list = await assertListOwner(listId, session.user.id);
  if (!list) return { error: "Você não pode editar esta lista." };

  const media = await resolveOrCacheMedia(provider, mediaType, externalId);
  if (!media) return { error: "Não foi possível encontrar este item." };

  const itemCount = await prisma.listItem.count({ where: { listId } });
  await prisma.listItem.upsert({
    where: { listId_mediaId: { listId, mediaId: media.id } },
    create: { listId, mediaId: media.id, position: itemCount },
    update: {},
  });

  revalidatePath(`/lists/${listId}`);
  return { success: true };
}

export async function removeMediaFromListAction(listId: string, mediaId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const list = await assertListOwner(listId, session.user.id);
  if (!list) return;

  await prisma.listItem.deleteMany({ where: { listId, mediaId } });
  revalidatePath(`/lists/${listId}`);
}
