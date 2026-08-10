import type { UnlockedBadge } from "@/lib/services/badges";

export type ActionResult = { error?: string; success?: boolean; unlockedBadges?: UnlockedBadge[] };
