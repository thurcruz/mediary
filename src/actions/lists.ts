"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createListSchema } from "@/lib/validations/lists";
import { resolveOrCacheMedia } from "@/lib/services/media-cache";
import { toggleFavorite } from "@/lib/services/favorites";
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
    collaboratorIds: formData.getAll("collaboratorIds"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const { collaboratorIds, ...listData } = parsed.data;
  const list = await prisma.list.create({ data: { ...listData, userId: session.user.id } });

  if (collaboratorIds.length > 0) {
    await prisma.listCollaborator.createMany({
      data: collaboratorIds.map((userId) => ({ listId: list.id, userId, role: "EDITOR" as const })),
      skipDuplicates: true,
    });
  }

  redirect(`/lists/${list.id}`);
}

async function assertListOwner(listId: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== userId) return null;
  return list;
}

/** Owner or an EDITOR collaborator - covers collaborative lists too. */
async function assertListEditor(listId: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list) return null;
  if (list.userId === userId) return list;

  const collaborator = await prisma.listCollaborator.findUnique({
    where: { listId_userId: { listId, userId } },
  });
  return collaborator?.role === "EDITOR" ? list : null;
}

export async function addMediaToListAction(
  listId: string,
  mediaType: MediaType,
  provider: Provider,
  externalId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const list = await assertListEditor(listId, session.user.id);
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

  const list = await assertListEditor(listId, session.user.id);
  if (!list) return;

  await prisma.listItem.deleteMany({ where: { listId, mediaId } });
  revalidatePath(`/lists/${listId}`);
}

export async function toggleFavoriteAction(
  mediaType: MediaType,
  provider: Provider,
  externalId: string,
): Promise<{ error?: string; isFavorited?: boolean }> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const media = await resolveOrCacheMedia(provider, mediaType, externalId);
  if (!media) return { error: "Não foi possível encontrar este item." };

  const isFavorited = await toggleFavorite(session.user.id, media.id);
  revalidatePath("/lists");
  return { isFavorited };
}

export async function toggleListFollowAction(listId: string, isFollowing: boolean): Promise<void> {
  const session = await auth();
  if (!session?.user) return;

  const list = await prisma.list.findUnique({ where: { id: listId }, select: { userId: true } });
  if (!list || list.userId === session.user.id) return;

  if (isFollowing) {
    await prisma.listFollow.deleteMany({ where: { listId, userId: session.user.id } });
  } else {
    await prisma.listFollow.create({ data: { listId, userId: session.user.id } });
  }
  revalidatePath(`/lists/${listId}`);
  revalidatePath("/lists");
}

export async function inviteCollaboratorAction(listId: string, userId: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user) return { error: "Faça login." };

  const list = await assertListOwner(listId, session.user.id);
  if (!list) return { error: "Você não pode editar esta lista." };

  await prisma.$transaction([
    prisma.listCollaborator.upsert({
      where: { listId_userId: { listId, userId } },
      create: { listId, userId, role: "EDITOR" },
      update: {},
    }),
    prisma.list.update({ where: { id: listId }, data: { isCollaborative: true } }),
  ]);

  revalidatePath(`/lists/${listId}`);
  return { success: true };
}
