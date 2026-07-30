import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MediaSearch } from "@/components/media/media-search";
import type { MediaType } from "@/lib/media-types";

export default async function LogPage() {
  const session = await auth();
  const settings = session?.user
    ? await prisma.userSettings.findUnique({ where: { userId: session.user.id } })
    : null;
  const enabledMediaTypes = (settings?.enabledMediaTypes as MediaType[] | undefined) ?? [];

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Registrar</h1>
        <p className="mt-1 text-sm text-muted">
          Busque o que você assistiu, leu ou ouviu para registrar no seu diário.
        </p>
      </div>
      <MediaSearch
        placeholder="O que você quer registrar?"
        enabledMediaTypes={enabledMediaTypes}
        language={session?.user?.language ?? "PT_BR"}
      />
    </div>
  );
}
