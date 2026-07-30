import type { ContentLanguage, TitleLanguageKey } from "@/lib/media-types";

const LANGUAGE_TO_TITLE_KEY: Partial<Record<ContentLanguage, TitleLanguageKey>> = {
  EN: "en",
  JA: "ja",
};

/**
 * Resolves the title to show a given viewer, based on their preferred
 * language. Falls back to the media's default title whenever the provider
 * didn't supply a variant for that language (true for every provider except
 * AniList today, and always true for PT_BR - no provider gives us
 * Portuguese titles yet).
 */
export function getDisplayTitle(
  titles: unknown,
  fallbackTitle: string,
  preferredLanguage: ContentLanguage,
): string {
  const key = LANGUAGE_TO_TITLE_KEY[preferredLanguage];
  if (!key) return fallbackTitle;

  const map = titles as Partial<Record<TitleLanguageKey, string>> | null | undefined;
  return map?.[key] || fallbackTitle;
}

const ALTERNATE_TITLE_LABELS: Record<TitleLanguageKey, string> = {
  en: "Inglês",
  ja: "Japonês",
  romaji: "Romaji",
};

/** Title variants other than the one already shown as primary - for the "also known as" section on the detail page. */
export function getAlternateTitles(
  titles: unknown,
  primaryTitle: string,
): { key: TitleLanguageKey; label: string; value: string }[] {
  const map = titles as Partial<Record<TitleLanguageKey, string>> | null | undefined;
  if (!map) return [];

  return (Object.keys(map) as TitleLanguageKey[])
    .filter((key) => map[key] && map[key] !== primaryTitle)
    .map((key) => ({ key, label: ALTERNATE_TITLE_LABELS[key], value: map[key]! }));
}
