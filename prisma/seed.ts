import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

// Proof-of-concept catalog (~24 entries), not the eventual 300+. The rules
// engine that actually unlocks these is a later phase - see ARCHITECTURE.md.
const ACHIEVEMENTS = [
  { key: "first_log", name: "Primeira Página", description: "Registre sua primeira mídia no diário.", category: "Exploração", criteria: { type: "diary_entry_count", count: 1 } },
  { key: "ten_logs", name: "Colecionador Iniciante", description: "Registre 10 mídias no diário.", category: "Colecionador", criteria: { type: "diary_entry_count", count: 10 } },
  { key: "fifty_logs", name: "Bibliotecário", description: "Registre 50 mídias no diário.", category: "Colecionador", criteria: { type: "diary_entry_count", count: 50 } },
  { key: "hundred_logs", name: "Arquivista", description: "Registre 100 mídias no diário.", category: "Colecionador", criteria: { type: "diary_entry_count", count: 100 } },
  { key: "first_movie", name: "Luzes, Câmera...", description: "Registre seu primeiro filme.", category: "Cinema", criteria: { type: "media_type_count", mediaType: "MOVIE", count: 1 } },
  { key: "ten_movies", name: "Cinéfilo", description: "Assista 10 filmes.", category: "Cinema", criteria: { type: "media_type_count", mediaType: "MOVIE", count: 10 } },
  { key: "fifty_movies", name: "Crítico de Cinema", description: "Assista 50 filmes.", category: "Cinema", criteria: { type: "media_type_count", mediaType: "MOVIE", count: 50 } },
  { key: "first_book", name: "Primeira Página Virada", description: "Registre seu primeiro livro.", category: "Livros", criteria: { type: "media_type_count", mediaType: "BOOK", count: 1 } },
  { key: "ten_books", name: "Leitor Voraz", description: "Leia 10 livros.", category: "Livros", criteria: { type: "media_type_count", mediaType: "BOOK", count: 10 } },
  { key: "fifty_books", name: "Rato de Biblioteca", description: "Leia 50 livros.", category: "Livros", criteria: { type: "media_type_count", mediaType: "BOOK", count: 50 } },
  { key: "first_anime", name: "Primeiro Episódio", description: "Registre seu primeiro anime.", category: "Anime", criteria: { type: "media_type_count", mediaType: "ANIME", count: 1 } },
  { key: "anime_marathon", name: "Maratonista", description: "Assista 10 animes.", category: "Anime", criteria: { type: "media_type_count", mediaType: "ANIME", count: 10 } },
  { key: "first_album", name: "Primeira Faixa", description: "Registre seu primeiro álbum.", category: "Música", criteria: { type: "media_type_count", mediaType: "ALBUM", count: 1 } },
  { key: "audiophile", name: "Audiófilo", description: "Ouça 25 álbuns.", category: "Música", criteria: { type: "media_type_count", mediaType: "ALBUM", count: 25 } },
  { key: "first_game", name: "Player One", description: "Registre seu primeiro jogo.", category: "Jogos", criteria: { type: "media_type_count", mediaType: "GAME", count: 1 } },
  { key: "streak_7", name: "Semana Cheia", description: "Mantenha uma sequência de 7 dias registrando atividades.", category: "Sequência", criteria: { type: "daily_streak", days: 7 } },
  { key: "streak_30", name: "Hábito Formado", description: "Mantenha uma sequência de 30 dias.", category: "Sequência", criteria: { type: "daily_streak", days: 30 } },
  { key: "streak_100", name: "Inabalável", description: "Mantenha uma sequência de 100 dias.", category: "Sequência", criteria: { type: "daily_streak", days: 100 } },
  { key: "first_review", name: "Crítico Estreante", description: "Escreva sua primeira review.", category: "Social", criteria: { type: "review_count", count: 1 } },
  { key: "first_follow", name: "Bem-Vindo à Comunidade", description: "Siga seu primeiro usuário.", category: "Social", criteria: { type: "follow_count", count: 1 } },
  { key: "ten_followers", name: "Voz Ativa", description: "Conquiste 10 seguidores.", category: "Social", criteria: { type: "follower_count", count: 10 } },
  { key: "first_list", name: "Curador", description: "Crie sua primeira lista.", category: "Colecionador", criteria: { type: "list_count", count: 1 } },
  { key: "explorer_5_types", name: "Explorador Cultural", description: "Registre mídias de 5 tipos diferentes.", category: "Exploração", criteria: { type: "distinct_media_types", count: 5 } },
  { key: "early_adopter", name: "Primeira Hora", description: "Crie sua conta durante o lançamento do Mediary.", category: "Eventos", criteria: { type: "manual" } },
];

async function main() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: achievement.key },
      create: achievement,
      update: achievement,
    });
  }

  const demoPasswordHash = await bcrypt.hash("mediary123", 10);
  const demo = await prisma.user.upsert({
    where: { email: "demo@mediary.app" },
    create: {
      email: "demo@mediary.app",
      username: "demo",
      passwordHash: demoPasswordHash,
      name: "Usuário Demo",
      bio: "Conta de demonstração do Mediary.",
      settings: {
        create: {
          enabledMediaTypes: ["MOVIE", "BOOK"],
          theme: "dark",
        },
      },
    },
    update: {},
  });

  await prisma.announcement.upsert({
    where: { id: "welcome" },
    create: {
      id: "welcome",
      title: "Bem-vindo ao Mediary",
      body: "Seu diário de vida cultural começa aqui. Registre filmes, livros e muito mais.",
    },
    update: {},
  });

  console.log(`Seed concluído. Usuário demo: ${demo.email} / senha: mediary123`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
