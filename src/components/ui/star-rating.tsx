"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function StarSlot({ fraction, size }: { fraction: number; size: number }) {
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <Star className="absolute inset-0 text-muted" size={size} strokeWidth={1.5} />
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${fraction * 100}%` }}>
        <Star className="text-primary" size={size} strokeWidth={1.5} fill="currentColor" />
      </span>
    </span>
  );
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 22,
  className,
}: {
  value: number | null | undefined;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;

  if (readOnly) {
    return (
      <div className={cn("inline-flex items-center gap-0.5", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <StarSlot key={i} fraction={Math.max(0, Math.min(1, shown - i))} size={size} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="relative" style={{ width: size, height: size }}>
          <StarSlot fraction={Math.max(0, Math.min(1, shown - i))} size={size} />
          <button
            type="button"
            aria-label={`${i + 0.5} estrelas`}
            className="absolute inset-y-0 left-0 w-1/2"
            onMouseEnter={() => setHover(i + 0.5)}
            onClick={() => onChange?.(i + 0.5)}
          />
          <button
            type="button"
            aria-label={`${i + 1} estrelas`}
            className="absolute inset-y-0 right-0 w-1/2"
            onMouseEnter={() => setHover(i + 1)}
            onClick={() => onChange?.(i + 1)}
          />
        </span>
      ))}
    </div>
  );
}
