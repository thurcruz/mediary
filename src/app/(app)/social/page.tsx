import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { suggestUsersToFollow } from "@/lib/services/user-search";
import { UserSearch } from "@/components/friends/user-search";
import { SocialTabs } from "@/components/social/social-tabs";
import { CommunityPlaceholder } from "@/components/social/community-placeholder";
import type { MediaType } from "@/lib/media-types";

export default async function SocialPage() {
  const session = await auth();
  if (!session?.user) return null;

  const settings = await prisma.userSettings.findUnique({ where: { userId: session.user.id } });
  const enabledMediaTypes = (settings?.enabledMediaTypes as MediaType[] | undefined) ?? [];

  const initialSuggestions = await suggestUsersToFollow(session.user.id, enabledMediaTypes);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Social</h1>
        <p className="mt-1 text-sm text-muted">Encontre outras pessoas e comunidades no Mediary.</p>
      </div>
      <SocialTabs
        amigos={
          <UserSearch initialSuggestions={initialSuggestions} viewerMediaTypes={enabledMediaTypes} />
        }
        comunidade={<CommunityPlaceholder />}
      />
    </div>
  );
}
