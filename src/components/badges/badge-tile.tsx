import Image from "next/image";
import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
  const isUnlocked = Boolean(unlockedAt);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center",
        isUnlocked ? "border-border bg-surface" : "border-dashed border-border bg-surface/50 opacity-60",
      )}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-surface-elevated">
        {iconUrl ? (
          <Image src={iconUrl} alt={name} fill className="rounded-full object-cover" />
        ) : isUnlocked ? (
          <Award className="h-7 w-7 text-primary" />
        ) : (
          <Lock className="h-6 w-6 text-muted" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium">{isSecret && !isUnlocked ? "???" : name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {isSecret && !isUnlocked ? "Emblema secreto" : description}
        </p>
      </div>
      <span className="text-[10px] font-mono text-muted">#{String(code).padStart(4, "0")}</span>
    </div>
  );
}
