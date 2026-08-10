"use client";

import { useState } from "react";
import Image from "next/image";
import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Modal } from "@/components/ui/modal";

export function BadgeTile({
  code,
  name,
  description,
  iconUrl,
  unlockedAt,
  isSecret,
}: {
  code: number;
  name: string;
  description: string;
  iconUrl: string | null;
  unlockedAt: Date | null;
  isSecret: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isUnlocked = Boolean(unlockedAt);
  const displayName = isSecret && !isUnlocked ? "???" : name;
  const displayDescription = isSecret && !isUnlocked ? "Emblema secreto" : description;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-transform hover:scale-[1.03]",
          isUnlocked ? "border-border bg-surface" : "border-dashed border-border bg-surface/50 opacity-60",
        )}
      >
        <BadgeIcon iconUrl={iconUrl} isUnlocked={isUnlocked} size="sm" />
        <div>
          <p className="text-sm font-medium">{displayName}</p>
          <p className="mt-0.5 text-xs text-muted">{displayDescription}</p>
        </div>
        <span className="text-[10px] font-mono text-muted">#{String(code).padStart(4, "0")}</span>
      </button>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <BadgeIcon iconUrl={iconUrl} isUnlocked={isUnlocked} size="lg" />
          <div>
            <p className="text-lg font-semibold">{displayName}</p>
            <span className="text-xs font-mono text-muted">#{String(code).padStart(4, "0")}</span>
          </div>
          <p className="text-sm text-foreground/90">{displayDescription}</p>
          <p className="text-xs text-muted">
            {isUnlocked && unlockedAt
              ? `Conquistado em ${unlockedAt.toLocaleDateString("pt-BR")}`
              : "Ainda não conquistado"}
          </p>
        </div>
      </Modal>
    </>
  );
}

function BadgeIcon({
  iconUrl,
  isUnlocked,
  size,
}: {
  iconUrl: string | null;
  isUnlocked: boolean;
  size: "sm" | "lg";
}) {
  const dimension = size === "sm" ? "h-16 w-16" : "h-32 w-32";

  if (!isUnlocked) {
    return (
      <div className={cn("flex items-center justify-center rounded-full bg-surface-elevated", dimension)}>
        <Lock className={size === "sm" ? "h-6 w-6 text-muted" : "h-10 w-10 text-muted"} />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center", dimension)}>
      {iconUrl ? (
        <Image src={iconUrl} alt="" fill className="object-contain" />
      ) : (
        <Award className={size === "sm" ? "h-10 w-10 text-primary" : "h-16 w-16 text-primary"} />
      )}
    </div>
  );
}
