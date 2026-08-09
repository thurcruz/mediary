/**
 * Emblemas (badges) catalog - the source of truth synced into the Achievement
 * table on demand (see syncBadgeCatalog in src/lib/services/badges.ts).
 *
 * To add a badge: drop the PNG in public/badges/<code>.png, add an entry
 * below with a unique `code` and, if it should show up right away, set
 * `iconUrl` to "/badges/<code>.png". Badges without a matching `criteria`
 * rule are only granted manually (SQL) or via `secretWord` redemption.
 */
export type BadgeCatalogEntry = {
  code: number;
  key: string;
  name: string;
  description: string;
  category: string;
  iconUrl: string | null;
  /** Case-insensitive. Set only for badges unlocked via "resgatar emblema secreto". */
  secretWord?: string;
  /**
   * Granted automatically to every new account at registration (see
   * grantSignupBadges in src/lib/services/badges.ts). This is meant to be
   * temporary - flip to false (or delete the flag) here when told to stop,
   * no other code change needed.
   */
  autoGrantOnSignup?: boolean;
  criteria: Record<string, unknown>;
};

export const BADGES_CATALOG: BadgeCatalogEntry[] = [
  {
    code: 0,
    key: "og",
    name: "OG",
    description: "Criou a conta durante o lançamento do Mediary.",
    category: "Especial",
    iconUrl: "/badges/OG.png",
    autoGrantOnSignup: true,
    criteria: { type: "manual" },
  },
  {
    code: 1,
    key: "first_log",
    name: "Primeiro registro",
    description: "Registrou sua primeira obra no diário.",
    category: "Início",
    iconUrl: null,
    criteria: { type: "diary_entry_count", min: 1 },
  },
  {
    code: 2,
    key: "first_review",
    name: "Primeira crítica",
    description: "Escreveu sua primeira review.",
    category: "Início",
    iconUrl: null,
    criteria: { type: "review_count", min: 1 },
  },
  {
    code: 3,
    key: "first_follower",
    name: "Primeiro fã",
    description: "Conquistou seu primeiro fã.",
    category: "Social",
    iconUrl: null,
    criteria: { type: "follower_count", min: 1 },
  },
  {
    code: 4,
    key: "list_maker",
    name: "Curador",
    description: "Criou sua primeira lista.",
    category: "Listas",
    iconUrl: null,
    criteria: { type: "list_count", min: 1 },
  },
  {
    code: 100,
    key: "founder",
    name: "Fundador",
    description: "Esteve aqui desde o início do Mediary.",
    category: "Especial",
    iconUrl: null,
    secretWord: "mediaryfundador",
    criteria: { type: "manual" },
  },
];
