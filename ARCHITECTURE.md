# Mediary — Arquitetura

Diário de vida cultural (filmes, séries, animes, mangás, livros/HQs, álbuns,
músicas, jogos). Este documento registra as decisões técnicas da fundação e o
que falta para as próximas fases.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (config CSS-first em `src/app/globals.css`)
- Prisma ORM 7 — `provider = "sqlite"` agora, Postgres/Supabase depois
- Auth.js v5 (beta) — Credentials (e-mail + senha), sessão JWT
- `bcryptjs`, `zod`, `class-variance-authority`, `lucide-react`, `next-themes`

## Por que SQLite agora

Ambiente de desenvolvimento sem Docker/Postgres/pnpm instalados. Decisão do
usuário: rodar 100% local com SQLite via Prisma, sem provisionar nada na
nuvem nesta entrega. O schema já foi desenhado para minimizar o atrito da
troca futura — ver "Migração para Postgres" abaixo.

## Prisma 7 — pontos específicos desta versão

- Generator `prisma-client` (não `prisma-client-js`) com `output` explícito
  (`src/generated/prisma`) — pasta gerada, fora do controle de versão.
- Exige **driver adapter** mesmo para SQLite: `@prisma/adapter-better-sqlite3`
  + `better-sqlite3`. Sem adapter, o client não conecta.
- `prisma.config.ts` (não mais `.env` + schema) centraliza `datasource.url` e
  o comando de seed. `.env` só é lido porque `prisma.config.ts` importa
  `dotenv/config` explicitamente.
- Cliente Prisma é singleton em `src/lib/prisma.ts`
  (`globalThis.prisma ??= new PrismaClient({ adapter })`), guardado por
  `NODE_ENV`, para não abrir múltiplas conexões ao mesmo arquivo SQLite a
  cada hot-reload do `next dev` (gera `SQLITE_BUSY`).
- Rodar comandos Prisma diretamente (`./node_modules/.bin/prisma ...`) em vez
  de `npx prisma` neste ambiente - `npx` está sendo interceptado por um hook
  local (rtk) que não conhece o binário `prisma`. `prisma db seed` também
  precisa de `node_modules/.bin` no PATH (é assim que `npm run` já funciona;
  só é preciso ter atenção ao invocar via `./node_modules/.bin/prisma`
  diretamente).

## Modelagem "enum-like" (String, não `enum`)

SQLite não suporta `enum` nativo no Prisma. Todo campo desse tipo
(`MediaType`, `Provider`, `DiaryStatus`, `ListVisibility`,
`MediaCreditRole`, `NotificationType`) é `String` no schema, validado via Zod
no app. Fonte única de verdade: `src/lib/media-types.ts` (um array `as const`
por campo → deriva o union type TS e o `z.enum(...)`). Os nomes das colunas
já são os finais (sem sufixo `Raw`/`Str`) para que a migração para `enum`
real no Postgres seja só uma troca de tipo, não um rename.

Outras decisões de portabilidade:

- `Genre` é modelo próprio + join table `MediaGenre` (scalar arrays
  `String[]` só existem no Postgres via Prisma).
- Ratings usam `Float`, não `Decimal` (não suportado no SQLite via Prisma),
  validado em Zod com `multipleOf(0.5)`.
- `Media.metadata` é `Json` para atributos específicos por tipo (páginas,
  episódios, plataformas). **Disciplina**: nada que precise ser
  filtrado/ordenado vira coluna real - filtragem dentro de JSON
  (`path`/`array_contains`) é Postgres-only no Prisma.
- `Media.lastFetchedAt` existe desde já (mesmo sem lógica de refresh) porque
  é impossível preencher retroativamente depois.
- Nenhum atributo nativo `@db.*` no schema (preso ao provider, quebra ao
  trocar de datasource).
- `Comment` não tem CHECK constraint garantindo "exatamente um pai"
  (`diaryEntryId` xor `listId`) — SQLite não suporta isso via Prisma. A
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
  sem Prisma, sem bcryptjs. Só isso é importado por `src/middleware.ts`.
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
    middleware.ts
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
- Provisionamento em nuvem (Supabase) - documentado abaixo, não executado.

## Migração para Postgres/Supabase (checklist para quando for a hora)

1. **Histórico de migrations não é portável entre providers.** Arquivar
   `prisma/migrations`, trocar `datasource db { provider = "sqlite" }` para
   `"postgresql"`, rodar `prisma migrate dev --name init` do zero contra o
   banco novo (isso recria só o schema, não os dados).
2. **Dados** precisam de um script de export/import à parte (ex.: dois
   `PrismaClient`, um lendo do SQLite, outro escrevendo no Postgres) - não é
   algo que `prisma migrate` faça.
3. **Converter os campos `String` "enum-like" para `enum` real** na mesma
   migration que troca o datasource, usando os arrays de
   `src/lib/media-types.ts` como lista de tokens (mesma ordem/grafia).
4. **Trocar o driver adapter**: `@prisma/adapter-better-sqlite3` →
   `@prisma/adapter-pg` (ou o adapter específico do Supabase/Neon), e
   atualizar `src/lib/prisma.ts`.
5. **Connection pooling**: usar o pooler do Supabase (PgBouncer/Supavisor)
   para `datasource.url` e uma `directUrl` separada (sem pool) para rodar
   migrations - configurar os dois em `prisma.config.ts`.
6. Revisar `relationMode` (nativo vs emulado) e rodar uma checagem de
   integridade referencial logo após o corte.
7. Reativar filtros Postgres-only que hoje são contornados manualmente
   (`mode: "insensitive"`, filtragem dentro de `metadata Json`) e limpar o
   código que existia só por causa da limitação do SQLite.
8. Migrar Auth.js para usar o Supabase Auth (ou manter Credentials + Prisma
   adapter, já que nesse ponto haveria um banco real por trás) e trocar o
   armazenamento de avatar/uploads para Supabase Storage ou R2.

## Ambiente local

```bash
npm install
npm run db:migrate   # prisma migrate dev
npm run db:seed       # cria usuário demo (demo@mediary.app / mediary123)
npm run dev
```

Sem `TMDB_API_KEY`, a busca/registro de filmes funciona na íntegra
(interface, cache, diário) mas não retorna resultados reais - a mensagem é
"em breve"/lista vazia, não um erro. Livros funcionam de ponta a ponta sem
nenhuma chave (Open Library).
