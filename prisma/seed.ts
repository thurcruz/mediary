import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { syncBadgeCatalog } from "../src/lib/services/badges";

async function main() {
  // Emblemas catalog also self-syncs on every Emblemas page load (see
  // syncBadgeCatalog) - running it here too just makes a fresh `db seed`
  // populate it immediately.
  await syncBadgeCatalog();

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

  console.log(`Seed concluído. Usuário demo: ${demo.email} / senha: mediary123`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
