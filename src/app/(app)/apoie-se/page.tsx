import { Sparkles, Clock, Award } from "lucide-react";

export default function ApoieSePage() {
  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Apoie-se</h1>
        <p className="mt-1 text-sm text-muted">Ajude o Mediary a continuar existindo.</p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-border bg-surface p-5 text-sm leading-relaxed text-foreground/90">
        <p>
          O Mediary é um projeto independente, feito e mantido por uma pessoa só, sem
          financiamento de grandes empresas. Servidores, banco de dados e as APIs que trazem
          informações de filmes, séries, animes e livros têm custo real todo mês.
        </p>
        <p>
          Se o Mediary te ajuda a organizar e lembrar do que você assiste, joga e lê, considere
          apoiar o projeto. Isso ajuda a cobrir esses custos e a manter o desenvolvimento de novas
          funcionalidades vivo.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Benefícios de quem apoia</h2>
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Acesso antecipado</p>
            <p className="text-xs text-muted">Experimente novidades antes de todo mundo.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium">Moldura de perfil dourada</p>
            <p className="text-xs text-muted">Seu avatar ganha um contorno dourado exclusivo.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
          <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Emblema exclusivo de apoiador</p>
            <p className="text-xs text-muted">Um emblema que só quem apoia o projeto tem.</p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted">
        O checkout de apoio ainda está sendo preparado - volte em breve.
      </p>
    </div>
  );
}
