import Link from "next/link";
import Image from "next/image";
import { Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function TopBar({ unreadCount = 0 }: { unreadCount?: number }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/brand/MEDIARY_FAVICON_AZUL.png" alt="Mediary" width={32} height={32} className="rounded-lg" />
        <span className="hidden text-lg font-semibold tracking-tight sm:inline">Mediary</span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          aria-label="Atividades"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-primary",
              )}
            />
          )}
        </Link>
        <Link
          href="/settings"
          aria-label="Configurações"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
