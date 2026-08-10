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
    name: "O Crítico",
    description: "Publicou 20 reviews.",
    category: "Início",
    iconUrl: "/badges/critico.png",
    criteria: { type: "review_count", min: 20 },
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
    iconUrl: "/badges/curador.png",
    criteria: { type: "list_count", min: 1 },
  },
  {
    code: 5,
    key: "rated_first",
    name: "Avaliado",
    description: "Deu sua primeira nota.",
    category: "Início",
    iconUrl: "/badges/avaliado.png",
    criteria: { type: "rating_count", min: 1 },
  },
  {
    code: 6,
    key: "first_words",
    name: "Primeiras Palavras",
    description: "Escreveu sua primeira review.",
    category: "Início",
    iconUrl: "/badges/primeiras-palavras.png",
    criteria: { type: "review_count", min: 1 },
  },
  {
    code: 7,
    key: "favorited_first",
    name: "Meu Favorito",
    description: "Favoritou sua primeira obra.",
    category: "Início",
    iconUrl: "/badges/meu-favorito.png",
    criteria: { type: "favorite_count", min: 1 },
  },
  {
    code: 8,
    key: "exit",
    name: "EXIT (Não Era Pra Mim)",
    description: "Abandonou uma obra.",
    category: "Diário",
    iconUrl: "/badges/exit.png",
    criteria: { type: "dropped_count", min: 1 },
  },
  {
    code: 9,
    key: "three_day_streak",
    name: "Pegando o Ritmo",
    description: "Registrou obras em 3 dias seguidos.",
    category: "Diário",
    iconUrl: "/badges/pegando-o-ritmo.png",
    criteria: { type: "streak_days", min: 3 },
  },
  {
    code: 10,
    key: "shared_media",
    name: "Você Precisa Ouvir Isso",
    description: "Compartilhou uma obra.",
    category: "Social",
    iconUrl: "/badges/voce-precisa-ouvir-isso.png",
    criteria: { type: "share_count", min: 1 },
  },
  {
    code: 11,
    key: "commented_on_other",
    name: "Entrosando",
    description: "Comentou pela primeira vez na review de outra pessoa.",
    category: "Social",
    iconUrl: "/badges/entrosando.png",
    criteria: { type: "comment_on_other_count", min: 1 },
  },
  {
    code: 12,
    key: "pepper",
    name: "Pimenta",
    description: "Uma de suas reviews recebeu 30 comentários.",
    category: "Social",
    iconUrl: "/badges/pimenta.png",
    criteria: { type: "review_comment_max", min: 30 },
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
