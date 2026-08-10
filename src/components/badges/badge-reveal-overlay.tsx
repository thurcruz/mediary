"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { UnlockedBadge } from "@/lib/services/badges";
import { BadgeIcon } from "@/components/badges/badge-tile";

const HOLD_MS = 2600;

export function BadgeRevealOverlay({
  queue,
  onDismissOne,
}: {
  queue: UnlockedBadge[];
  onDismissOne: () => void;
}) {
  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    const timer = setTimeout(onDismissOne, HOLD_MS);
    return () => clearTimeout(timer);
  }, [current, onDismissOne]);

  if (!current || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="alertdialog"
      aria-live="assertive"
      onClick={onDismissOne}
    >
      <div
        key={current.id}
        className="flex flex-col items-center gap-3 rounded-3xl border border-primary/40 bg-surface p-8 text-center shadow-2xl"
      >
        <span className="text-xs font-semibold uppercase tracking-widest text-primary">
          Emblema desbloqueado!
        </span>
        <div className="animate-badge-glow rounded-full">
          <div className="animate-badge-flip" style={{ perspective: "600px" }}>
            <BadgeIcon iconUrl={current.iconUrl} isUnlocked size="lg" />
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold">{current.name}</p>
          <p className="mt-1 text-sm text-foreground/90">{current.description}</p>
        </div>
        {current.contextLabel && <p className="text-xs text-muted">{current.contextLabel}</p>}
        {queue.length > 1 && (
          <span className="text-[10px] text-muted">+{queue.length - 1} mais</span>
        )}
      </div>
    </div>,
    document.body,
  );
}
