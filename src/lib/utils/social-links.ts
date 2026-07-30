export type SocialLinks = {
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  letterboxd?: string;
  youtube?: string;
  other?: string;
};

const PREFIXED: { key: keyof SocialLinks; label: string; prefix: string }[] = [
  { key: "instagram", label: "Instagram", prefix: "https://instagram.com/" },
  { key: "twitter", label: "X", prefix: "https://x.com/" },
  { key: "tiktok", label: "TikTok", prefix: "https://tiktok.com/@" },
  { key: "letterboxd", label: "Letterboxd", prefix: "https://letterboxd.com/" },
];

const FULL_LINK: { key: keyof SocialLinks; label: string }[] = [
  { key: "youtube", label: "YouTube" },
  { key: "other", label: "Site" },
];

/** Builds clickable {label, href} entries from the stored handles/links. */
export function buildSocialLinks(socialLinks: SocialLinks): { key: string; label: string; href: string }[] {
  const entries: { key: string; label: string; href: string }[] = [];

  for (const { key, label, prefix } of PREFIXED) {
    const handle = socialLinks[key];
    if (handle) entries.push({ key, label, href: `${prefix}${handle}` });
  }
  for (const { key, label } of FULL_LINK) {
    const href = socialLinks[key];
    if (href) entries.push({ key, label, href });
  }

  return entries;
}
