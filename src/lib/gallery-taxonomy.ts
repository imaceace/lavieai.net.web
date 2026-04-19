export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://lavieai.net";
export const REVALIDATE_SECONDS = 1800;

export interface GalleryItem {
  id: string;
  imageUrl?: string;
  result_url?: string;
  prompt: string;
  negative_prompt?: string;
  style: string | null;
  use_case: string | null;
  user_name?: string;
  likes?: number;
  created_at?: number;
  width?: number;
  height?: number;
  is_recommended?: number;
}

export interface TaxonomyOption {
  id: string;
  label: string;
  slug: string;
}

export function formatTaxonomyLabel(value?: string | null): string {
  if (!value) return "";
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trim()}...`;
}

export function buildLocalizedPath(defaultLocale: string, locale: string, path: string): string {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

export function buildAbsoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export function buildWorkPath(defaultLocale: string, locale: string, workId: string): string {
  return buildLocalizedPath(defaultLocale, locale, `/gallery/${workId}`);
}

export function buildWorkUrl(defaultLocale: string, locale: string, workId: string): string {
  return buildAbsoluteUrl(buildWorkPath(defaultLocale, locale, workId));
}

export function buildStylePath(defaultLocale: string, locale: string, styleId: string): string {
  return buildLocalizedPath(defaultLocale, locale, `/gallery/style/${styleId}`);
}

export function buildStyleUrl(defaultLocale: string, locale: string, styleId: string): string {
  return buildAbsoluteUrl(buildStylePath(defaultLocale, locale, styleId));
}

export function toUseCaseSlug(useCaseId: string): string {
  return useCaseId
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

export function buildUseCaseUrl(defaultLocale: string, locale: string, useCaseId: string): string {
  return buildAbsoluteUrl(buildUseCasePath(defaultLocale, locale, useCaseId));
}

export function buildUseCasePath(defaultLocale: string, locale: string, useCaseId: string): string {
  return buildLocalizedPath(defaultLocale, locale, `/gallery/use-case/${toUseCaseSlug(useCaseId)}`);
}

export function buildStyleUseCasePath(
  defaultLocale: string,
  locale: string,
  styleId: string,
  useCaseId: string
): string {
  return buildLocalizedPath(
    defaultLocale,
    locale,
    `/gallery/style/${styleId}/use-case/${toUseCaseSlug(useCaseId)}`
  );
}

export function buildStyleUseCaseUrl(
  defaultLocale: string,
  locale: string,
  styleId: string,
  useCaseId: string
): string {
  return buildAbsoluteUrl(buildStyleUseCasePath(defaultLocale, locale, styleId, useCaseId));
}

export function buildWorkSeoTitle(work: GalleryItem): string {
  const styleLabel = formatTaxonomyLabel(work.style);
  const useCaseLabel = formatTaxonomyLabel(work.use_case);
  const prefix = [styleLabel, useCaseLabel, "AI Generated Image Prompt Example"]
    .filter(Boolean)
    .join(" ");

  return `${prefix || "AI Generated Artwork Prompt Example"} | Lavie AI`;
}

export function buildWorkSeoDescription(work: GalleryItem): string {
  const styleLabel = formatTaxonomyLabel(work.style);
  const useCaseLabel = formatTaxonomyLabel(work.use_case);
  const promptText = truncateText(work.prompt || "AI generated artwork", 150);
  const descriptor = [styleLabel, useCaseLabel].filter(Boolean).join(" ");

  if (descriptor) {
    return `Explore this ${descriptor} AI image prompt example on Lavie AI. Prompt: ${promptText}`;
  }

  return `Explore this AI generated artwork prompt example on Lavie AI. Prompt: ${promptText}`;
}

export function buildWorkSeoKeywords(work: GalleryItem): string[] {
  const styleLabel = formatTaxonomyLabel(work.style);
  const useCaseLabel = formatTaxonomyLabel(work.use_case);
  const promptSnippet = truncateText(work.prompt || "AI image prompt", 60);
  const candidates = [
    "AI image prompt example",
    "AI generated artwork",
    "Lavie AI gallery",
    styleLabel ? `${styleLabel} AI art` : "",
    styleLabel ? `${styleLabel} prompt example` : "",
    useCaseLabel ? `${useCaseLabel} AI image` : "",
    useCaseLabel && styleLabel ? `${styleLabel} ${useCaseLabel} AI image` : "",
    useCaseLabel && styleLabel ? `${styleLabel} ${useCaseLabel} prompt` : "",
    promptSnippet,
  ];

  return Array.from(new Set(candidates.filter(Boolean)));
}

export function dedupeWorks(works: GalleryItem[], excludedIds: string[] = []): GalleryItem[] {
  const seen = new Set(excludedIds);
  return works.filter((work) => {
    if (seen.has(work.id)) return false;
    seen.add(work.id);
    return true;
  });
}
