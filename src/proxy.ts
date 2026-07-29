import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Built from the Edge-safe config only - see auth.config.ts.
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|brand/).*)"],
};
