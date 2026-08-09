import { Users2, Sparkles } from "lucide-react";

export function CommunityPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-border p-10 text-center">
      <Users2 className="h-8 w-8 text-muted" />
      <div>
        <p className="font-medium">Comunidade chegando em breve</p>
        <p className="mt-1 text-sm text-muted">
          Espaços para discutir suas obras favoritas com outros fãs.
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
        <Sparkles className="h-3.5 w-3.5" />
        Clubes - em breve
      </div>
    </div>
  );
}
