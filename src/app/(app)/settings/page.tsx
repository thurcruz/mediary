import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signOutAction } from "@/actions/auth";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { ProfileEditForm } from "@/components/settings/profile-edit-form";
import { MediaTypesForm } from "@/components/settings/media-types-form";
import { LanguageForm } from "@/components/settings/language-form";
import { Button } from "@/components/ui/button";
import type { MediaType } from "@/lib/media-types";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.userSettings.findUnique({ where: { userId: session.user.id } }),
  ]);
  if (!user) redirect("/login");

  const enabledMediaTypes = (settings?.enabledMediaTypes as MediaType[] | undefined) ?? [];
  const socialLinks = (user.socialLinks as Record<string, string> | null) ?? {};

  return (
    <div className="flex flex-col gap-10 pt-6 pb-6">
      <h1 className="text-xl font-semibold tracking-tight">Configurações</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Tema</h2>
        <ThemeToggle />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Tipos de mídia</h2>
        <p className="text-sm text-muted">
          Você só vê conteúdo dos tipos selecionados aqui - inclusive de outras pessoas.
        </p>
        <MediaTypesForm defaultValues={enabledMediaTypes} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Idioma dos títulos</h2>
        <LanguageForm defaultValue={user.language} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted">Perfil</h2>
        <ProfileEditForm
          defaultValues={{
            name: user.name,
            bio: user.bio,
            profession: user.profession,
            country: user.country,
            city: user.city,
            avatarUrl: user.avatarUrl,
            socialLinks,
          }}
        />
      </section>

      <form action={signOutAction}>
        <Button type="submit" variant="secondary" className="self-start">
          Sair da conta
        </Button>
      </form>
    </div>
  );
}
