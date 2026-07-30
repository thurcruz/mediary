import { z } from "zod";
import { MediaTypeSchema, ContentLanguageSchema } from "@/lib/media-types";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(500).optional(),
  profession: z.string().trim().max(120).optional(),
  country: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
  socialLinks: z
    .object({
      instagram: z.string().trim().max(60).optional(),
      twitter: z.string().trim().max(60).optional(),
      tiktok: z.string().trim().max(60).optional(),
      letterboxd: z.string().trim().max(60).optional(),
      youtube: z.string().trim().url().max(200).optional().or(z.literal("")),
      other: z.string().trim().url().max(200).optional().or(z.literal("")),
    })
    .partial()
    .optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateSettingsSchema = z.object({
  enabledMediaTypes: z.array(MediaTypeSchema).min(1),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

export const updateLanguageSchema = z.object({
  language: ContentLanguageSchema,
});
export type UpdateLanguageInput = z.infer<typeof updateLanguageSchema>;
