import { cache } from "react";
import { apiUrl } from "@/lib/api-base";
import { FEATURE_DISCOVERY_CASES, INTERACTIVE_I2I_CASES } from "@/constants/useCases";
import {
  buildStyleUseCasePath,
  dedupeWorks,
  formatTaxonomyLabel,
  REVALIDATE_SECONDS,
  type GalleryItem,
  type TaxonomyOption,
  toUseCaseSlug,
} from "@/lib/gallery-taxonomy";
import { routing } from "@/routing";

export interface WorkDetailPageData {
  work: GalleryItem | null;
  relatedByStyle: GalleryItem[];
  relatedByUseCase: GalleryItem[];
  latestWorks: GalleryItem[];
}

export interface PopularCollection {
  id: string;
  styleId: string;
  styleLabel: string;
  useCaseId: string;
  useCaseLabel: string;
  href: string;
  count: number;
}

export const getGalleryWork = cache(async (id: string): Promise<GalleryItem | null> => {
  try {
    const response = await fetch(apiUrl(`/api/gallery/${id}`), {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return payload?.success ? (payload.data as GalleryItem) : null;
  } catch {
    return null;
  }
});

export const getGalleryImages = cache(
  async (params?: {
    style?: string;
    useCase?: string;
    sort?: string;
    exclude?: string;
    limit?: number;
    offset?: number;
  }): Promise<GalleryItem[]> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.style) searchParams.set("style", params.style);
      if (params?.useCase) searchParams.set("use_case", params.useCase);
      if (params?.sort) searchParams.set("sort", params.sort);
      if (params?.exclude) searchParams.set("exclude", params.exclude);
      if (typeof params?.limit === "number") searchParams.set("limit", String(params.limit));
      if (typeof params?.offset === "number") searchParams.set("offset", String(params.offset));

      const response = await fetch(apiUrl(`/api/gallery?${searchParams.toString()}`), {
        next: { revalidate: REVALIDATE_SECONDS },
      });

      if (!response.ok) return [];

      const payload = await response.json();
      return payload?.success ? ((payload.data as GalleryItem[]) || []) : [];
    } catch {
      return [];
    }
  }
);

export const getStyleOptions = cache(async (): Promise<TaxonomyOption[]> => {
  try {
    const response = await fetch(apiUrl("/api/config/generation-options"), {
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) return [];
    const payload = await response.json();
    const styles = payload?.success ? payload.data?.styles || [] : [];

    return styles
      .filter((item: { id: string }) => item.id !== "none")
      .map((item: { id: string; label: string }) => ({
        id: item.id,
        label: item.label || formatTaxonomyLabel(item.id),
        slug: item.id,
      }));
  } catch {
    return [];
  }
});

export const getUseCaseOptions = cache(async (): Promise<TaxonomyOption[]> => {
  const sourceCases = [...INTERACTIVE_I2I_CASES, ...FEATURE_DISCOVERY_CASES];
  const deduped = new Map<string, TaxonomyOption>();

  sourceCases.forEach((item) => {
    const useCaseId = item.params?.useCase;
    if (!useCaseId || deduped.has(useCaseId)) return;

    deduped.set(useCaseId, {
      id: useCaseId,
      label: "tabLabel" in item && item.tabLabel ? item.tabLabel : formatTaxonomyLabel(useCaseId),
      slug: toUseCaseSlug(useCaseId),
    });
  });

  return Array.from(deduped.values()).sort((a, b) => a.label.localeCompare(b.label));
});

export async function getUseCaseOptionBySlug(slug: string): Promise<TaxonomyOption | null> {
  const options = await getUseCaseOptions();
  return options.find((item) => item.slug === slug) || null;
}

export async function getPopularCollections(locale: string, limit = 6): Promise<PopularCollection[]> {
  const [works, styleOptions, useCaseOptions] = await Promise.all([
    getGalleryImages({ sort: "latest", limit: 200 }),
    getStyleOptions(),
    getUseCaseOptions(),
  ]);

  const styleMap = new Map(styleOptions.map((item) => [item.id, item]));
  const useCaseMap = new Map(useCaseOptions.map((item) => [item.id, item]));
  const counts = new Map<string, number>();

  works.forEach((work) => {
    if (!work.style || !work.use_case) return;
    const key = `${work.style}:::${work.use_case}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([key, count]) => {
      const [styleId, useCaseId] = key.split(":::");
      const styleOption = styleMap.get(styleId);
      const useCaseOption = useCaseMap.get(useCaseId);
      if (!styleOption || !useCaseOption) return null;

      return {
        id: key,
        styleId,
        styleLabel: styleOption.label,
        useCaseId,
        useCaseLabel: useCaseOption.label,
        href: buildStyleUseCasePath(routing.defaultLocale, locale, styleId, useCaseId),
        count,
      } satisfies PopularCollection;
    })
    .filter(Boolean)
    .sort((a, b) => (b?.count || 0) - (a?.count || 0))
    .slice(0, limit) as PopularCollection[];
}

export async function getWorkDetailPageData(id: string): Promise<WorkDetailPageData> {
  const work = await getGalleryWork(id);

  if (!work) {
    return {
      work: null,
      relatedByStyle: [],
      relatedByUseCase: [],
      latestWorks: [],
    };
  }

  const [relatedByStyleRaw, relatedByUseCaseRaw, latestWorksRaw] = await Promise.all([
    work.style
      ? getGalleryImages({ style: work.style, exclude: work.id, limit: 8 })
      : Promise.resolve([]),
    work.use_case
      ? getGalleryImages({ useCase: work.use_case, exclude: work.id, limit: 6 })
      : Promise.resolve([]),
    getGalleryImages({ sort: "latest", exclude: work.id, limit: 6 }),
  ]);

  const relatedByStyle = dedupeWorks(relatedByStyleRaw, [work.id]);
  const relatedByUseCase = dedupeWorks(relatedByUseCaseRaw, [
    work.id,
    ...relatedByStyle.map((item) => item.id),
  ]).slice(0, 4);
  const latestWorks = dedupeWorks(latestWorksRaw, [
    work.id,
    ...relatedByStyle.map((item) => item.id),
    ...relatedByUseCase.map((item) => item.id),
  ]).slice(0, 3);

  return {
    work,
    relatedByStyle,
    relatedByUseCase,
    latestWorks,
  };
}
