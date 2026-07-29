// Single source of truth for every "enum-like" string field in the Prisma
// schema. SQLite has no native enum support via Prisma, so these fields are
// plain String columns validated at the app layer (see ARCHITECTURE.md).
// When the project migrates to Postgres, these arrays become the literal
// token lists for real `enum` blocks in schema.prisma - keep casing/order
// stable so that conversion stays mechanical.

import { z } from "zod";

export const MEDIA_TYPES = [
  "MOVIE",
  "TV_SHOW",
  "ANIME",
  "MANGA",
  "BOOK",
  "COMIC",
  "ALBUM",
  "TRACK",
  "GAME",
] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];
export const MediaTypeSchema = z.enum(MEDIA_TYPES);

export const PROVIDERS = [
  "TMDB",
  "ANILIST",
  "JIKAN",
  "GOOGLE_BOOKS",
  "OPEN_LIBRARY",
  "SPOTIFY",
  "MUSICBRAINZ",
  "RAWG",
  "MANUAL",
] as const;
export type Provider = (typeof PROVIDERS)[number];
export const ProviderSchema = z.enum(PROVIDERS);

export const DIARY_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "DROPPED",
  "REPEATING",
] as const;
export type DiaryStatus = (typeof DIARY_STATUSES)[number];
export const DiaryStatusSchema = z.enum(DIARY_STATUSES);

export const LIST_VISIBILITIES = ["PUBLIC", "PRIVATE", "UNLISTED"] as const;
export type ListVisibility = (typeof LIST_VISIBILITIES)[number];
export const ListVisibilitySchema = z.enum(LIST_VISIBILITIES);

export const LIST_COLLABORATOR_ROLES = ["EDITOR", "VIEWER"] as const;
export type ListCollaboratorRole = (typeof LIST_COLLABORATOR_ROLES)[number];
export const ListCollaboratorRoleSchema = z.enum(LIST_COLLABORATOR_ROLES);

export const MEDIA_CREDIT_ROLES = [
  "DIRECTOR",
  "AUTHOR",
  "ARTIST",
  "DEVELOPER",
  "ACTOR",
] as const;
export type MediaCreditRole = (typeof MEDIA_CREDIT_ROLES)[number];
export const MediaCreditRoleSchema = z.enum(MEDIA_CREDIT_ROLES);

export const NOTIFICATION_TYPES = [
  "NEW_FOLLOWER",
  "REVIEW_LIKE",
  "COMMENT",
  "ACHIEVEMENT_UNLOCKED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export const THEMES = ["dark", "light"] as const;
export type Theme = (typeof THEMES)[number];
export const ThemeSchema = z.enum(THEMES);

// Media types with a real, working provider integration in this pass.
// Everything else in MEDIA_TYPES is schema-ready but shows an "em breve"
// state in search/onboarding until its adapter is wired up.
export const LIVE_MEDIA_TYPES: MediaType[] = ["MOVIE", "BOOK"];

// Human labels, including the per-media-type verb Mediary uses instead of a
// generic "completed" ("Assistido" for a movie, "Lido" for a book, etc).
export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  MOVIE: "Filme",
  TV_SHOW: "Série",
  ANIME: "Anime",
  MANGA: "Mangá",
  BOOK: "Livro",
  COMIC: "HQ",
  ALBUM: "Álbum",
  TRACK: "Música",
  GAME: "Jogo",
};

const COMPLETED_VERB: Record<MediaType, string> = {
  MOVIE: "Assistiu",
  TV_SHOW: "Assistiu",
  ANIME: "Assistiu",
  MANGA: "Leu",
  BOOK: "Leu",
  COMIC: "Leu",
  ALBUM: "Ouviu",
  TRACK: "Ouviu",
  GAME: "Jogou",
};

const IN_PROGRESS_VERB: Record<MediaType, string> = {
  MOVIE: "Assistindo",
  TV_SHOW: "Assistindo",
  ANIME: "Assistindo",
  MANGA: "Lendo",
  BOOK: "Lendo",
  COMIC: "Lendo",
  ALBUM: "Ouvindo",
  TRACK: "Ouvindo",
  GAME: "Jogando",
};

export function diaryStatusLabel(status: DiaryStatus, mediaType: MediaType): string {
  switch (status) {
    case "PLANNED":
      return "Quero consumir";
    case "IN_PROGRESS":
      return IN_PROGRESS_VERB[mediaType];
    case "COMPLETED":
      return COMPLETED_VERB[mediaType];
    case "DROPPED":
      return "Abandonado";
    case "REPEATING":
      return mediaType === "BOOK" || mediaType === "MANGA" || mediaType === "COMIC"
        ? "Relendo"
        : "Reassistindo";
  }
}

export function diaryEntryVerbPastTense(status: DiaryStatus, mediaType: MediaType): string {
  if (status === "COMPLETED" || status === "REPEATING") {
    return COMPLETED_VERB[mediaType];
  }
  if (status === "IN_PROGRESS") {
    return `Começou a ${IN_PROGRESS_VERB[mediaType].toLowerCase()}`;
  }
  if (status === "DROPPED") {
    return "Abandonou";
  }
  return "Adicionou à lista de desejos";
}
