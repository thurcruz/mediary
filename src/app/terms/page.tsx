import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <Link href="/" className="text-sm text-muted hover:text-primary">
        ← Voltar ao Mediary
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Termos de Uso</h1>
        <p className="mt-1 text-xs text-muted">Última atualização: agosto de 2026</p>
      </div>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/90">
        <p>
          Ao criar uma conta no Mediary, você concorda com estes termos. Se não concordar, não
          utilize o serviço.
        </p>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">O serviço</h2>
          <p>
            O Mediary é um diário pessoal de mídia (filmes, séries, animes, mangás, livros,
            álbuns, músicas e jogos) com recursos sociais. É um projeto independente, oferecido
            &quot;como está&quot;, sem garantias de disponibilidade contínua.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">Sua conta</h2>
          <p>
            Você é responsável por manter a confidencialidade da sua senha e por toda atividade
            realizada na sua conta.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">Conteúdo publicado</h2>
          <p>
            Reviews, comentários, listas e demais conteúdos que você publica são de sua
            responsabilidade. Não são permitidos discurso de ódio, assédio, spam ou conteúdo
            ilegal. Contas que violarem essas regras podem ser suspensas.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">Apoie-se</h2>
          <p>
            Contribuições feitas através do Apoie-se são voluntárias e destinadas a cobrir os
            custos de manutenção do projeto. Os benefícios oferecidos (acesso antecipado, moldura
            de perfil, emblema de apoiador) podem mudar conforme o projeto evolui.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-foreground">Mudanças</h2>
          <p>
            Podemos atualizar estes termos conforme o Mediary evolui. Mudanças relevantes serão
            comunicadas dentro do app.
          </p>
        </section>
      </div>
    </div>
  );
}
