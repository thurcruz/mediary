"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function SocialTabs({
  amigos,
  comunidade,
}: {
  amigos: ReactNode;
  comunidade: ReactNode;
}) {
  const [tab, setTab] = useState<"amigos" | "comunidade">("amigos");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <TabButton active={tab === "amigos"} onClick={() => setTab("amigos")}>
          Amigos
        </TabButton>
        <TabButton active={tab === "comunidade"} onClick={() => setTab("comunidade")}>
          Comunidade
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
            Em breve
          </span>
        </TabButton>
      </div>

      {tab === "amigos" ? amigos : comunidade}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
