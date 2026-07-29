import { z } from "zod";

export const createCommentSchema = z
  .object({
    diaryEntryId: z.string().min(1).optional(),
    listId: z.string().min(1).optional(),
    parentId: z.string().min(1).optional(),
    text: z.string().trim().min(1, "Escreva algo").max(2000),
  })
  .refine((data) => Boolean(data.diaryEntryId) !== Boolean(data.listId), {
    message: "Um comentário pertence a exatamente um registro do diário ou uma lista",
    path: ["diaryEntryId"],
  });
export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const followSchema = z.object({
  targetUserId: z.string().min(1),
});
export type FollowInput = z.infer<typeof followSchema>;
