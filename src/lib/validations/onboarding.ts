import { z } from "zod";
import { MediaTypeSchema } from "@/lib/media-types";

export const onboardingSchema = z.object({
  enabledMediaTypes: z.array(MediaTypeSchema).min(1, "Escolha ao menos um tipo de mídia"),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
