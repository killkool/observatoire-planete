export const MIN_SEO_CONTENT_SCORE = 50;

export type SeoContentInput = {
  hasPlace: boolean;
  completeClimateYears: number;
  hasDistinctiveHistory: boolean;
};

export function seoContentScore(input: SeoContentInput): { score: number; indexable: boolean } {
  let score = 0;
  if (input.hasPlace) score += 40;
  if (input.completeClimateYears >= 10) score += 40;
  else if (input.completeClimateYears >= 1) score += 20;
  if (input.hasDistinctiveHistory) score += 20;
  return { score, indexable: score >= MIN_SEO_CONTENT_SCORE };
}

export function publicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function publicAbsoluteUrl(path: string): string {
  const origin = publicSiteOrigin();
  if (!path || path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** V1 France : une seule langue publiée. Pas d’URL `en` fantôme. Routage anglais = backlog V2. */
export function frenchLanguageAlternates(path: string): {
  canonical: string;
  languages: { fr: string; "x-default": string };
} {
  const url = publicAbsoluteUrl(path);
  return {
    canonical: url,
    languages: {
      fr: url,
      "x-default": url
    }
  };
}
