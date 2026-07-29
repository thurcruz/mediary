# Mediary — Arquitetura

Diário de vida cultural (filmes, séries, animes, mangás, livros/HQs, álbuns,
músicas, jogos). Este documento registra as decisões técnicas da fundação e o
que falta para as próximas fases.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (config CSS-first em `src/app/globals.css`)
- Prisma ORM 7.9.1 — Postgres (Supabase)
- Auth.js v5 (beta) — Credentials (e-mail + senha), sessão JWT
- `bcryptjs`, `zod`, `class-variance-authority`, `lucide-react`, `next-themes`

## Banco de dados: Supabase Postgres

O projeto começou no SQLite local (sem Docker/Postgres disponíveis no
ambiente de dev original) e foi migrado para Postgres na Supabase assim que
o app foi deployado na Vercel (SQLite não funciona lá - filesystem
somente-leitura em funções serverless, sem persistência entre invocações).

**Uma única connection string para tudo** (`DATABASE_URL`), apontando para o
**session pooler** da Supabase (porta 5432), tanto para o app em runtime
quanto para comandos de schema (`db push`, `db seed`). Isso não é o setup
"ideal" documentado pela Supabase (que recomenda pooler de transação/6543
para runtime serverless + conexão direta para migrations) - é o que
efetivamente funciona nesta versão do Prisma. Gotchas descobertos na prática:

- **"Direct connection" (`db.<ref>.supabase.co:5432`) é IPv6-only** em
  projetos novos da Supabase e trava indefinidamente em redes sem rota IPv6
  - use o **session pooler** (`aws-0-<region>.pooler.supabase.com:5432`,
    usuário `postgres.<project-ref>`) para qualquer operação que precise de
    conexão não-pooled/DDL.
- **Pooler de transação (porta 6543) rejeita os comandos de schema.** Tanto
  `prisma migrate dev` quanto `prisma db push` falham (`Schema engine
  error:` genérico, sem detalhe) quando `DATABASE_URL` aponta pra lá -
  PgBouncer em modo transação não suporta o que o schema-engine precisa. Use
  o session pooler (porta 5432, mesmo host) para essas operações.
- **Prisma 7.9.1 não suporta `directUrl` de verdade** - nem em
  `prisma.config.ts` (erro de tipo: `directUrl` não existe no tipo aceito
  por `datasource`) nem em `schema.prisma` (erro de validação: "no longer
  supported in schema files"). A despeito da documentação oficial do Prisma
  mostrar esse padrão, não funciona nesta versão. Resultado: uma única
  `DATABASE_URL` (session pooler) é usada tanto pelo app quanto pelas
  migrations - não há separação entre conexão pooled/direta por enquanto.
- **SSL**: `pg` (driver por trás do `@prisma/adapter-pg`) passou a tratar
  `sslmode=require` como alias de `verify-full` (validação estrita de
  certificado) numa versão recente, e o certificado da Supabase não bate com
  a cadeia de confiança padrão do Node (`SELF_SIGNED_CERT_IN_CHAIN`). Fix:
  `?uselibpqcompat=true&sslmode=require` na connection string restaura a
  semântica tradicional do libpq (`require` = criptografado, sem validação
  estrita).
- **`prisma.config.ts` PRECISA de `datasource.url` mesmo com `schema.prisma`
  também declarando `url = env("DATABASE_URL")`** - faltando em qualquer um
  dos dois, comandos como `db push` falham (`"datasource.url property is
  required in your Prisma config file"`). Os dois arquivos declaram a mesma
  env var, redundante mas necessário nesta versão.

## Prisma 7 — pontos específicos desta versão

- Generator `prisma-client` (não `prisma-client-js`) com `output` explícito
  (`src/generated/prisma`) — pasta gerada, fora do controle de versão.
- Exige **driver adapter**: `@prisma/adapter-pg` + `pg`. Sem adapter, o
  client não conecta. O adapter recebe um `PoolConfig` explícito (não a
  connection string crua) com `ssl: { rejectUnauthorized: false }` em
  `src/lib/prisma.ts` - mais confiável do que depender do parsing de
  `?sslmode=...` na query string, que se comporta diferente entre o
  schema-engine (Rust) e o parser de connection string do `pg` (Node).
- `prisma.config.ts` centraliza `datasource.url` e o comando de seed. `.env`
  só é lido porque `prisma.config.ts` importa `dotenv/config` explicitamente
  - na Vercel isso é um no-op inofensivo, já que as env vars vêm da
  plataforma diretamente.
- Cliente Prisma é singleton em `src/lib/prisma.ts`
  (`globalThis.prisma ??= new PrismaClient({ adapter })`), guardado por
  `NODE_ENV`, para não abrir conexões demais a cada hot-reload do `next dev`.
- Rodar comandos Prisma diretamente (`./node_modules/.bin/prisma ...`) em vez
  de `npx prisma` neste ambiente - `npx` está sendo interceptado por um hook
  local (rtk) que não conhece o binário `prisma`. `prisma db seed` também
  precisa de `node_modules/.bin` no PATH (é assim que `npm run` já funciona;
  só é preciso ter atenção ao invocar via `./node_modules/.bin/prisma`
  diretamente).
- **Rodar `next build` (ou `tsc --noEmit`) localmente depois de qualquer
  mudança em `schema.prisma`/`prisma.config.ts`** - o CLI do Prisma é mais
  tolerante em runtime do que o typecheck do Next em build (ex.: `directUrl`
  passou no `prisma validate` mas quebrou o build da Vercel só no typecheck).
- **Pendência conhecida, não resolvida**: nesta máquina de desenvolvimento
  (Windows), `PrismaClient` + `@prisma/adapter-pg` retorna `ECONNREFUSED` ao
  executar qualquer query - mesmo com a MESMA connection string e config SSL
  funcionando perfeitamente via `pg.Client`, `pg.Pool` e o adapter
  `PrismaPg` chamado diretamente (fora do `PrismaClient`). O erro acontece
  dentro de `performIO` do driver adapter, não na conexão em si. Suspeita:
  algo específico deste ambiente Windows (antivírus/interceptação de TLS
  interferindo especificamente no handshake TLS feito pelo motor compilado
  do Prisma, que é diferente do stack TLS padrão do Node usado pelo `pg`
  puro) - não confirmado se afeta a Vercel (Linux) também. Se o login falhar
  em produção mesmo com as env vars corretas, comece por aqui.

## Modelagem — enums e decisões de schema

`MediaType`, `Provider`, `DiaryStatus`, `ListVisibility`,
`ListCollaboratorRole`, `MediaCreditRole`, `NotificationType` e `Theme` são
`enum` de verdade no Postgres agora (eram `String` validada via Zod na fase
SQLite). Fonte única de verdade em app-code continua em
`src/lib/media-types.ts` (arrays `as const` → union type TS + `z.enum(...)`)
- os tokens ali têm que continuar batendo em nome/grafia com os valores do
  `enum` no `schema.prisma`, já que nada os deriva automaticamente um do
  outro.

Outras decisões de modelagem:

- `Genre` é modelo próprio + join table `MediaGenre` (em vez de scalar array
  `String[]`) - melhor modelagem relacional de qualquer forma (permite
  slug, mapeamento por provider, etc. depois).
- Ratings usam `Float`, validado em Zod com `multipleOf(0.5)`.
- `Media.metadata` é `Json` para atributos específicos por tipo (páginas,
  episódios, plataformas). **Disciplina**: nada que precise ser
  filtrado/ordenado vira coluna real - a app não usa filtragem dentro do
  JSON (`path`/`array_contains`) em nenhum lugar hoje.
- `Media.lastFetchedAt` existe desde já (mesmo sem lógica de refresh) porque
  é impossível preencher retroativamente depois.
- `Comment` não tem CHECK constraint garantindo "exatamente um pai"
  (`diaryEntryId` xor `listId`) - Prisma não tem uma forma portável de
  declarar isso no schema (precisaria de SQL bruto numa migration). A
  invariante é garantida em código, em `src/lib/services/comments.ts`
  (`createComment`), o único caminho de escrita permitido para `Comment`.
- `Follow` idem: auto-follow é bloqueado em `src/lib/services/follow.ts`, não
  no banco.
- `Notification` é denormalizada de propósito (`type` + `payload Json` com
  `fromUserId`/`fromUsername`/`fromName` já embutidos) em vez de ter FK para
  a origem (like/comment/follow) — assim ela renderiza mesmo se a origem for
  apagada depois, e não reintroduz o mesmo problema de "FK polimórfica" do
  Comment.
- Índices: `DiaryEntry(userId, loggedAt)` (timeline/perfil) e
  `DiaryEntry(userId, mediaId)` (checar "já registrei isso?" é a query mais
  frequente do app).

## Camada de providers externos

`src/lib/providers/adapter.ts` define `MediaProviderAdapter` (interface comum)
e `NormalizedMedia` (formato intermediário, distinto do modelo Prisma
`Media`). `src/lib/providers/registry.ts` mapeia `MediaType → adapters` e
expõe `searchAllMedia()` (fan-out via `Promise.allSettled`, merge/dedupe,
sort por `popularityScore` normalizado por cada adapter).

Implementados de verdade nesta entrega:

- **TMDb** (filmes/séries) — código completo; sem `TMDB_API_KEY` no `.env`,
  `isConfigured()` retorna `false` e o aggregator simplesmente pula o
  provider (não quebra a busca).
- **Open Library** (livros) — funciona agora, sem chave.
- **Google Books** (livros, enriquecimento) — funciona sem chave (quota
  menor); `GOOGLE_BOOKS_API_KEY` opcional para quota maior.

Só esqueleto (`isConfigured() => false`, `TODO` explícito no arquivo):
AniList, Jikan, Spotify, MusicBrainz, RAWG. Mesma interface, plugáveis depois
sem tocar no aggregator. AniList/Jikan/MusicBrainz não exigem chave — são os
candidatos mais rápidos para uma próxima entrega.

Cache-on-read: a primeira vez que qualquer usuário abre/registra uma mídia
externa, ela é upsertada na tabela `Media` via
`src/lib/services/media-cache.ts` (`resolveOrCacheMedia`), usando o
`@@unique([provider, externalId])` real (raça entre duas requisições
simultâneas é resolvida pelo próprio `upsert`, não por um check-then-create).

## Filtragem por tipo de mídia habilitado (onboarding)

Cada usuário escolhe no onboarding quais tipos de mídia quer usar
(`UserSettings.enabledMediaTypes`, ajustável em Configurações). Essa escolha
filtra **tudo que o usuário vê** — busca, feed, perfil (próprio e de
terceiros), timeline, favoritos — mesmo que o dono do conteúdo tenha
habilitado outros tipos. A regra é sempre "filtre pelo `enabledMediaTypes` de
quem está vendo", implementada em cada query relevante (não há um único
middleware central para isso; ver `getProfileStats`, `getUserRecentActivity`,
`getFeedForUser`).

## Autenticação (Auth.js v5)

- `src/lib/auth.config.ts` — metade "Edge-safe": sem Credentials provider,
  sem Prisma, sem bcryptjs. Só isso é importado por `src/proxy.ts`.
- `src/lib/auth.ts` — config completa (Credentials + Prisma), importada só
  em route handlers / server actions / server components (runtime Node).
- Motivo da separação: o motor de queries do Prisma não roda no Edge
  runtime, e importar o Credentials provider no middleware arrastaria
  bcryptjs (Node-only) para o bundle Edge mesmo sem ser chamado.
- `authorize()` retorna `null` em credencial inválida (nunca lança erro
  genérico) e nunca devolve o hash de senha - o objeto retornado é
  serializado no JWT.
- Sessão é JWT (sem adapter de banco). O callback `session` faz um
  lookup leve no Prisma a cada leitura de sessão para hidratar dados que
  podem mudar (nome, username, avatar) - aceitável na escala atual, evita
  sessão "presa" nos dados do momento do login.

## Estrutura de pastas

```
prisma/           schema.prisma, prisma.config.ts, seed.ts, migrations/
src/
  app/
    (auth)/       login, register (públicas)
    (onboarding)/ onboarding (autenticado, sem UserSettings ainda)
    (app)/        shell autenticado (nav flutuante + topo) - todo o resto
    api/auth/[...nextauth]/route.ts
    proxy.ts        (era middleware.ts - renomeado no Next.js 16)
  components/     ui/ media/ diary/ lists/ nav/ onboarding/ settings/
  lib/
    auth.config.ts, auth.ts, prisma.ts, media-types.ts
    providers/    adapter.ts, registry.ts, normalize.ts, tmdb.ts, ...
    services/     media-cache.ts, diary.ts, diary-feed.ts, comments.ts,
                  follow.ts, notifications.ts, profile-stats.ts
    validations/  zod schemas por domínio
  actions/        server actions por domínio (auth, media, diary, lists,
                  social, onboarding, settings)
  types/          next-auth.d.ts (augmentation), actions.ts
```

## Fora desta entrega (não é lacuna - é o roadmap)

- Integração real de AniList/Jikan/Spotify/MusicBrainz/RAWG (schema e
  adapters já prontos para plugar).
- Engine de conquistas/desafios (schema + seed de ~24 conquistas existe;
  regras automáticas de desbloqueio, não).
- Wrapped, geração automática de imagens de compartilhamento, motor de
  recomendação, estatísticas avançadas (mapa de calor, por diretor/autor),
  perfis de criadores verificados.
- PWA offline (service worker) - só o básico de metadata entra agora.
- Cloudflare R2 / upload de arquivos - avatar é só uma URL por enquanto.
- Provisionamento em nuvem (Supabase) - feito (ver seção acima); ainda
  faltam: migrar upload de avatar para Supabase Storage/R2, considerar
  Supabase Auth em vez de Credentials+Prisma agora que há um banco real por
  trás, e resolver a pendência de connection pooling (`directUrl`) quando o
  Prisma suportar de novo.

## Ambiente local

```bash
npm install
npm run db:migrate   # prisma migrate dev (ou `prisma db push` se pedir reset)
npm run db:seed       # cria usuário demo (demo@mediary.app / mediary123)
npm run dev
```

`DATABASE_URL` no `.env` precisa ser a connection string do session pooler
da Supabase (ver comentário no `.env.example`) - pegue em Project Settings →
Database → Connection string → "Session pooler".

Sem `TMDB_API_KEY`, a busca/registro de filmes funciona na íntegra
(interface, cache, diário) mas não retorna resultados reais - a mensagem é
"em breve"/lista vazia, não um erro. Livros funcionam de ponta a ponta sem
nenhuma chave (Open Library).
