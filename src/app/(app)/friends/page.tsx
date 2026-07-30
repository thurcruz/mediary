import { auth } from "@/lib/auth";
import { suggestUsersToFollow } from "@/lib/services/user-search";
import { UserSearch } from "@/components/friends/user-search";

export default async function FriendsPage() {
  const session = await auth();
  const initialSuggestions = session?.user ? await suggestUsersToFollow(session.user.id) : [];

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Amigos</h1>
        <p className="mt-1 text-sm text-muted">Encontre e siga outras pessoas no Mediary.</p>
      </div>
      <UserSearch initialSuggestions={initialSuggestions} />
    </div>
  );
}
