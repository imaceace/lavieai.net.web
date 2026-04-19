import { getTranslations, setRequestLocale } from "next-intl/server";
import { GalleryClient } from "./GalleryClient";
import { routing } from "@/routing";
import { getPopularCollections } from "@/lib/gallery-data";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, popularCollections] = await Promise.all([
    getTranslations("gallery"),
    getPopularCollections(locale, 6),
  ]);
  const tNav = await getTranslations("nav");

  return (
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
  );
}
