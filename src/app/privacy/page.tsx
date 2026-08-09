import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-muted hover:text-primary">
        ← Voltar ao Mediary
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Política de Privacidade</h1>
        <p className="mt-1 text-xs text-muted">Última atualização: agosto de 2026</p>
      </div>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/90">
        <p>
          O Mediary é um projeto independente. Esta página explica, em termos simples, quais
          dados coletamos e como usamos.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">Dados que coletamos</h2>
          <p>
            Nome, nome de usuário, e-mail, senha (armazenada de forma criptografada), avatar,
            bio e demais informações de perfil que você escolher preencher, além dos registros
            que você cria no seu diário (filmes, séries, livros, notas, reviews, listas).
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">Como usamos seus dados</h2>
          <p>
            Usamos seus dados exclusivamente para operar o Mediary: exibir seu perfil, seu
            diário, suas listas e a atividade que você opta por compartilhar publicamente. Não
            vendemos seus dados a terceiros.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">Serviços de terceiros</h2>
          <p>
            Usamos provedores externos (como TMDb, AniList, Open Library e Google Books) apenas
            para buscar informações públicas sobre filmes, séries, animes e livros - nenhum dado
            pessoal seu é enviado a eles.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">Seus direitos</h2>
          <p>
            Você pode editar ou apagar seus dados de perfil e registros a qualquer momento pelas
            Configurações. Para excluir sua conta por completo, entre em contato conosco.
          </p>
        </section>

        <p className="text-xs text-muted">
          Este documento pode ser atualizado conforme o Mediary evolui. Mudanças relevantes serão
          comunicadas dentro do app.
        </p>
      </div>
    </div>
  );
}
