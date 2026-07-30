"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Settings, Bell } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function TopBar({ unreadCount = 0 }: { unreadCount?: number }) {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    function onScroll() {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY.current;

      if (currentScrollY < 64) {
        setHidden(false);
      } else if (delta > 4) {
        setHidden(true);
      } else if (delta < -4) {
        setHidden(false);
      }

      lastScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 items-center justify-between px-4 transition-transform duration-300 ease-in-out sm:px-6",
        hidden ? "-translate-y-full" : "translate-y-0",
      )}
    >
      <Link href="/" className="flex items-center">
        <Image
          src="/brand/MEDIARY_LOGOTIPO_BRANCO.png"
          alt="Mediary"
          width={135}
          height={32}
          priority
          className="h-8 w-auto object-contain in-data-[theme=light]:invert"
        />
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
