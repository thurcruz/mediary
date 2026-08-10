"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { UnlockedBadge } from "@/lib/services/badges";
import { BadgeRevealOverlay } from "@/components/badges/badge-reveal-overlay";

type BadgeRevealContextValue = {
  queueUnlocks: (badges: UnlockedBadge[]) => void;
};

const BadgeRevealContext = createContext<BadgeRevealContextValue | null>(null);

export function BadgeRevealProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<UnlockedBadge[]>([]);

  const queueUnlocks = useCallback((badges: UnlockedBadge[]) => {
    if (badges.length === 0) return;
    setQueue((current) => {
      const knownIds = new Set(current.map((b) => b.id));
      const fresh = badges.filter((b) => !knownIds.has(b.id));
      return fresh.length > 0 ? [...current, ...fresh] : current;
    });
  }, []);

  const dismissFirst = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  return (
    <BadgeRevealContext.Provider value={{ queueUnlocks }}>
      {children}
      <BadgeRevealOverlay queue={queue} onDismissOne={dismissFirst} />
    </BadgeRevealContext.Provider>
  );
}

export function useBadgeReveal(): BadgeRevealContextValue {
  const ctx = useContext(BadgeRevealContext);
  if (!ctx) throw new Error("useBadgeReveal must be used within a BadgeRevealProvider");
  return ctx;
}
