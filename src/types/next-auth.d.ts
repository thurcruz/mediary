import type { DefaultSession } from "next-auth";
import type { ContentLanguage } from "@/lib/media-types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      language: ContentLanguage;
    } & DefaultSession["user"];
  }
}
