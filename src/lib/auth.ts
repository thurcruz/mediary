import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations/auth";

// Full, Node-runtime Auth.js instance. Only import this from server actions,
// route handlers, or server components - never from middleware.ts (see
// auth.config.ts for why).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
        if (!user) return null;

        const passwordsMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!passwordsMatch) return null;

        // Only a minimal shape - this object is serialized into the JWT, so
        // passwordHash must never be included.
        return { id: user.id, email: user.email, name: user.name, image: user.avatarUrl };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, email: true, username: true, name: true, avatarUrl: true, language: true },
        });
        if (user) {
          session.user.id = user.id;
          session.user.username = user.username;
          session.user.name = user.name;
          session.user.email = user.email;
          session.user.image = user.avatarUrl;
          session.user.language = user.language;
        }
      }
      return session;
    },
  },
});
