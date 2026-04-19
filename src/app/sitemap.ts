import type { MetadataRoute } from "next";
import { routing } from "@/routing";
import { getGalleryImages, getStyleOptions, getUseCaseOptions } from "@/lib/gallery-data";
import {
  buildAbsoluteUrl,
  buildLocalizedPath,
  buildStylePath,
  buildStyleUseCasePath,
  buildUseCasePath,
  buildWorkPath,
} from "@/lib/gallery-taxonomy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [styleOptions, useCaseOptions, latestWorks, moreWorks] = await Promise.all([
    getStyleOptions(),
    getUseCaseOptions(),
    getGalleryImages({ sort: "latest", limit: 100 }),
    getGalleryImages({ sort: "latest", limit: 100, offset: 100 }),
  ]);
  const worksForCollections = [...latestWorks, ...moreWorks];
  const styleUseCasePairs = Array.from(
    new Set(
      worksForCollections
        .filter((work) => work.style && work.use_case)
        .map((work) => `${work.style}:::${work.use_case}`)
    )
  ).map((pair) => {
    const [styleId, useCaseId] = pair.split(":::");
    return { styleId, useCaseId };
  });

  const entries: MetadataRoute.Sitemap = [];

  routing.locales.forEach((locale) => {
    entries.push({
      url: buildAbsoluteUrl(buildLocalizedPath(routing.defaultLocale, locale, "/")),
      changeFrequency: "daily",
      priority: locale === routing.defaultLocale ? 1 : 0.9,
    });
    entries.push({
      url: buildAbsoluteUrl(buildLocalizedPath(routing.defaultLocale, locale, "/gallery")),
      changeFrequency: "daily",
      priority: 0.9,
    });

    styleOptions.forEach((style) => {
      entries.push({
        url: buildAbsoluteUrl(buildStylePath(routing.defaultLocale, locale, style.id)),
        changeFrequency: "daily",
        priority: 0.8,
      });
    });

    useCaseOptions.forEach((useCase) => {
      entries.push({
        url: buildAbsoluteUrl(buildUseCasePath(routing.defaultLocale, locale, useCase.id)),
        changeFrequency: "daily",
        priority: 0.8,
      });
    });

    styleUseCasePairs.forEach(({ styleId, useCaseId }) => {
      entries.push({
        url: buildAbsoluteUrl(
          buildStyleUseCasePath(routing.defaultLocale, locale, styleId, useCaseId)
        ),
        changeFrequency: "daily",
        priority: 0.75,
      });
    });

    latestWorks.forEach((work) => {
      entries.push({
        url: buildAbsoluteUrl(buildWorkPath(routing.defaultLocale, locale, work.id)),
        lastModified: work.created_at ? new Date(work.created_at * 1000) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    });
  });

  return entries;
}
