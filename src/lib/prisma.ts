import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Passed as a PoolConfig (not a raw connection string) so `ssl` is set
// explicitly here rather than relying on `?sslmode=...` query-string parsing,
// which behaves inconsistently between Prisma's schema-engine (Rust) and the
// `pg` package's own connection-string parser (Node) - Supabase's certificate
// chain isn't in Node's default trust store either way.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
