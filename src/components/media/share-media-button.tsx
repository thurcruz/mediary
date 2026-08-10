"use client";

import { useState, useTransition } from "react";
import { Share2, Check } from "lucide-react";
import { shareMediaAction } from "@/actions/media";
import { useBadgeReveal } from "@/components/badges/badge-reveal-context";
import type { MediaType, Provider } from "@/lib/media-types";

export function ShareMediaButton({
  mediaType,
  provider,
  externalId,
  title,
}: {
  mediaType: MediaType;
  provider: Provider;
  externalId: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();
  const { queueUnlocks } = useBadgeReveal();

  function recordShare() {
    startTransition(async () => {
      const result = await shareMediaAction(mediaType, provider, externalId);
      if (result.unlockedBadges?.length) queueUnlocks(result.unlockedBadges);
    });
  }

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        recordShare();
        return;
      } catch {
        // user cancelled the native share sheet - fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    recordShare();
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Link copiado" : "Compartilhar"}
    </button>
  );
}
