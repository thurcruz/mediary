"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Palette } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Standard next-themes hydration guard: `theme` is unreliable until
    // after the client mounts, so this is a genuine one-time sync with the
    // browser's hydration lifecycle, not state derivable from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const options = [
    { value: "dark", label: "Dark", icon: Moon },
    { value: "light", label: "Light", icon: Sun },
    { value: "mediary", label: "Mediary", icon: Palette },
  ] as const;

  return (
    <div className="inline-flex gap-1 rounded-full border border-border bg-surface p-1">
      {options.map((option) => {
        const Icon = option.icon;
        const isActive = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
