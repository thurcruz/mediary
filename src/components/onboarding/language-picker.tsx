import { CONTENT_LANGUAGES, CONTENT_LANGUAGE_LABELS, type ContentLanguage } from "@/lib/media-types";

/** Same peer-checked pattern as MediaTypePicker, but single-select (radio). */
export function LanguagePicker({ defaultValue = "PT_BR" }: { defaultValue?: ContentLanguage }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-3">
        {CONTENT_LANGUAGES.map((lang) => (
          <label key={lang} className="cursor-pointer">
            <input
              type="radio"
              name="language"
              value={lang}
              defaultChecked={lang === defaultValue}
              className="peer sr-only"
            />
            <div className="flex items-center justify-center rounded-2xl border border-border bg-surface p-3 text-center text-sm font-medium text-muted transition-colors peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary">
              {CONTENT_LANGUAGE_LABELS[lang]}
            </div>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted">
        Define o idioma dos títulos exibidos. Japonês é usado principalmente para animes e mangás.
      </p>
    </div>
  );
}
