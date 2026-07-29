import type { MediaType, Provider } from "@/lib/media-types";

export function mediaDetailHref(mediaType: MediaType, provider: Provider, externalId: string): string {
  return `/media/${mediaType.toLowerCase()}/${provider.toLowerCase()}/${encodeURIComponent(externalId)}`;
}
