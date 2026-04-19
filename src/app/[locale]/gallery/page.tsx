import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GalleryClient } from "./GalleryClient";
import { routing } from "@/routing";
import { getGalleryImages, getPopularCollections } from "@/lib/gallery-data";
import { buildAbsoluteUrl, buildLocalizedPath, buildWorkUrl } from "@/lib/gallery-taxonomy";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  const canonical = buildAbsoluteUrl(
    buildLocalizedPath(routing.defaultLocale, locale, "/gallery")
  );

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((supportedLocale) => [
          supportedLocale,
          buildAbsoluteUrl(buildLocalizedPath(routing.defaultLocale, supportedLocale, "/gallery")),
        ])
      ),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: canonical,
      siteName: "Lavie AI",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tNav, popularCollections, latestWorks] = await Promise.all([
    getTranslations("gallery"),
    getTranslations("nav"),
    getPopularCollections(locale, 6),
    getGalleryImages({ sort: "latest", limit: 12 }),
  ]);
  const pageUrl = buildAbsoluteUrl(buildLocalizedPath(routing.defaultLocale, locale, "/gallery"));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("title"),
    description: t("description"),
    url: pageUrl,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Lavie AI",
          item: buildAbsoluteUrl(buildLocalizedPath(routing.defaultLocale, locale, "/")),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: tNav("gallery"),
          item: pageUrl,
        },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: latestWorks.length,
      itemListElement: latestWorks.map((work, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: buildWorkUrl(routing.defaultLocale, locale, work.id),
        name: work.prompt,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GalleryClient 
        translations={{
          badge: t("badge"),
          title: t("title"),
          description: t("description"),
          searchPlaceholder: t("searchPlaceholder"),
          selectStyle: t("selectStyle"),
          allStyles: t("allStyles"),
          popular: t("popular"),
          loading: t("loading"),
          noResults: t("noResults"),
          noResultsHint: t("noResultsHint"),
          viewDetails: t("viewDetails"),
          generateSimilar: t("generateSimilar"),
          generate: t("generate"),
          loadMore: t("loadMore"),
          endOfList: t("endOfList"),
          artworkDetails: t("artworkDetails"),
          prompt: t("prompt"),
          copyPrompt: t("copyPrompt"),
          style: t("style"),
          // creator: t("creator"),
          download: t("download"),
          share: t("share"),
          browseByStyle: t("browseByStyle"),
          browseByUseCase: t("browseByUseCase"),
          popularCollections: t("popularCollections"),
        }}
        locale={locale}
        popularCollections={popularCollections}
      />
    </>
  );
}
