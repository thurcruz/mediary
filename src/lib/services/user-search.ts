import { prisma } from "@/lib/prisma";
import type { MediaType } from "@/lib/media-types";

export type UserSearchResult = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isFollowing: boolean;
};

async function withFollowStatus(viewerId: string, users: Array<Omit<UserSearchResult, "isFollowing">>) {
  if (users.length === 0) return [];

  const follows = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: users.map((u) => u.id) } },
    select: { followingId: true },
  });
  const followingIds = new Set(follows.map((f) => f.followingId));

  return users.map((user) => ({ ...user, isFollowing: followingIds.has(user.id) }));
}

const SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  bio: true,
  settings: { select: { enabledMediaTypes: true } },
} as const;

type CandidateWithSettings = { settings: { enabledMediaTypes: unknown } | null };

/** Only people who share at least one enabled media type with the viewer show up as candidates. */
function hasOverlappingMediaTypes(candidate: CandidateWithSettings, viewerMediaTypes: MediaType[]) {
  const candidateTypes = (candidate.settings?.enabledMediaTypes as MediaType[] | undefined) ?? [];
  return candidateTypes.some((type) => viewerMediaTypes.includes(type));
}

function dropSettings<T extends { settings: unknown }>(user: T): Omit<T, "settings"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { settings: _settings, ...rest } = user;
  return rest;
}

export async function searchUsers(
  viewerId: string,
  query: string,
  viewerMediaTypes: MediaType[],
): Promise<UserSearchResult[]> {
  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId },
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    select: SELECT,
    take: 40,
  });

  const matched = users.filter((user) => hasOverlappingMediaTypes(user, viewerMediaTypes)).slice(0, 20);
  return withFollowStatus(viewerId, matched.map(dropSettings));
}

/** Users not yet followed who share a media type, most-followed first - shown when the search box is empty. */
export async function suggestUsersToFollow(
  viewerId: string,
  viewerMediaTypes: MediaType[],
): Promise<UserSearchResult[]> {
  const alreadyFollowing = await prisma.follow.findMany({
    where: { followerId: viewerId },
    select: { followingId: true },
  });

  const users = await prisma.user.findMany({
    where: {
      id: { not: viewerId, notIn: alreadyFollowing.map((f) => f.followingId) },
    },
    select: SELECT,
    orderBy: { followers: { _count: "desc" } },
    take: 50,
  });

  const matched = users.filter((user) => hasOverlappingMediaTypes(user, viewerMediaTypes)).slice(0, 12);
  return withFollowStatus(viewerId, matched.map(dropSettings));
}
