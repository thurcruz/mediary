import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];

/**
 * Edge-safe half of the Auth.js config: no Credentials provider, no Prisma,
 * no bcryptjs. This is the only auth config middleware.ts is allowed to
 * import - Prisma's query engine can't run on the Edge runtime, and
 * importing the Credentials provider here would pull bcryptjs (Node-only)
 * into the Edge bundle even if it's never called. The full config (with the
 * real provider) lives in auth.ts and is only ever imported from Node
 * runtime code (route handlers, server actions, server components).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = Boolean(auth?.user);
      const isPublicRoute = PUBLIC_ROUTES.some((route) =>
        request.nextUrl.pathname.startsWith(route),
      );

      if (isPublicRoute) {
        if (isLoggedIn) {
          return NextResponse.redirect(new URL("/", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
