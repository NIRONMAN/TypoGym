const DEFAULT_SITE_URL = "http://localhost:3000";

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function getSiteUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawUrl) {
    return DEFAULT_SITE_URL;
  }

  try {
    return normalizeUrl(new URL(rawUrl).toString());
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteConfig = {
  name: "TypoGym",
  shortName: "TypoGym",
  description: "Typing speed trainer with normal and finger-targeted practice modes.",
  locale: "en_US",
  keywords: [
    "typing practice",
    "typing speed test",
    "typing accuracy",
    "keyboard training",
    "touch typing",
    "typing drill",
  ],
  url: getSiteUrl(),
};
