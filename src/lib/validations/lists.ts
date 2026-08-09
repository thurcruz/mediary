import { z } from "zod";
import { ListVisibilitySchema } from "@/lib/media-types";

export const createListSchema = z
  .object({
    title: z.string().trim().min(1, "Dê um título à lista").max(120),
    description: z.string().trim().max(2000).optional(),
    visibility: ListVisibilitySchema.default("PUBLIC"),
    isCollaborative: z.boolean().default(false),
    collaboratorIds: z.array(z.string()).default([]),
  })
  .refine((data) => !data.isCollaborative || data.collaboratorIds.length > 0, {
    message: "Escolha ao menos um amigo para uma lista colaborativa",
    path: ["collaboratorIds"],
  });
export type CreateListInput = z.infer<typeof createListSchema>;

export const addListItemSchema = z.object({
  listId: z.string().min(1),
  mediaId: z.string().min(1),
  note: z.string().trim().max(500).optional(),
});
export type AddListItemInput = z.infer<typeof addListItemSchema>;
