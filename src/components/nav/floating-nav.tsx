"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, UserPlus, Newspaper, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function FloatingNav({ username }: { username: string }) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: "Início", icon: Home },
    { href: "/search", label: "Buscar", icon: Search },
    { href: "/friends", label: "Amigos", icon: UserPlus },
    { href: "/news", label: "Notícias", icon: Newspaper },
    { href: `/profile/${username}`, label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-full border border-border/80 bg-surface/70 p-1.5 shadow-2xl shadow-black/20 backdrop-blur-xl backdrop-saturate-150">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition-colors sm:w-auto sm:gap-2 sm:px-4",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="hidden text-sm font-medium sm:inline">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
