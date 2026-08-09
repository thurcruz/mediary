import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Built from the Edge-safe config only - see auth.config.ts.
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  // Public static assets under /public must be excluded here, not just from
  // page auth - next/image's optimizer fetches local files through this same
  // middleware chain, and a redirect-to-/login response instead of the raw
  // file breaks image rendering even for logged-in users (found via the
  // OG badge failing to render after adding public/badges).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|manifest.webmanifest|brand/|badges/|icons/).*)",
  ],
};
