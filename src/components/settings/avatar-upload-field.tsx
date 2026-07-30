"use client";

import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

export function AvatarUploadField({
  name,
  defaultAvatarUrl,
  displayName,
}: {
  name: string;
  defaultAvatarUrl: string | null;
  displayName: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={preview ?? defaultAvatarUrl} name={displayName} size={64} />
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/50"
        >
          <Camera className="h-4 w-4" />
          Trocar foto
        </button>
        <span className="text-xs text-muted">JPG, PNG, WEBP ou GIF - até 5MB</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
