import { z } from "zod";
import { DiaryStatusSchema } from "@/lib/media-types";

export const diaryEntrySchema = z.object({
  mediaId: z.string().min(1),
  status: DiaryStatusSchema,
  rating: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
  reviewText: z.string().trim().max(5000).optional(),
  containsSpoiler: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  loggedAt: z.coerce.date().optional(),
});
export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>;
