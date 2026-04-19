import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GalleryLandingPage } from "@/components/gallery/GalleryLandingPage";
import { routing } from "@/routing";
import { getGalleryImages, getStyleOptions, getUseCaseOptions } from "@/lib/gallery-data";
import {
  buildStylePath,
  buildStyleUrl,
  buildStyleUseCasePath,
  buildUseCasePath,
  buildWorkPath,
  formatTaxonomyLabel,
  truncateText,
} from "@/lib/gallery-taxonomy";
import { buildStyleSeoCopy } from "@/lib/gallery-seo";

async function getStyleOption(styleId: string) {
  const options = await getStyleOptions();
  return options.find((item) => item.id === styleId) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; style: string }>;
}): Promise<Metadata> {
  const { locale, style } = await params;
  const styleOption = await getStyleOption(style);

  if (!styleOption) {
    return {
      title: "Style Not Found | Lavie AI",
      robots: { index: false, follow: false },
    };
  }

  const styleCopy = buildStyleSeoCopy(styleOption);
  const canonical = buildStyleUrl(routing.defaultLocale, locale, styleOption.id);

  return {
    title: styleCopy.title,
    description: styleCopy.description,
    keywords: styleCopy.keywords,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((supportedLocale) => [
          supportedLocale,
          buildStyleUrl(routing.defaultLocale, supportedLocale, styleOption.id),
        ])
      ),
    },
    openGraph: {
      title: styleCopy.title,
      description: styleCopy.description,
      url: canonical,
      siteName: "Lavie AI",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: styleCopy.title,
      description: styleCopy.description,
    },
  };
}

export default async function GalleryStyleLandingPage({
  params,
}: {
  params: Promise<{ locale: string; style: string }>;
}) {
  const { locale, style } = await params;
  setRequestLocale(locale);

  const [t, styleOption, works, styleOptions, useCaseOptions] = await Promise.all([
    getTranslations("gallery"),
    getStyleOption(style),
    getGalleryImages({ style, limit: 24 }),
    getStyleOptions(),
    getUseCaseOptions(),
  ]);

  if (!styleOption) notFound();
  const styleCopy = buildStyleSeoCopy(styleOption);

  const relatedUseCases = useCaseOptions
    .filter((item) => works.some((work) => work.use_case === item.id))
    .slice(0, 8);

  return (
    <GalleryLandingPage
      backHref="/gallery"
      backLabel={t("backToGallery")}
      title={t("styleLandingTitle", { style: styleOption.label })}
      description={styleCopy.description}
      pageUrl={buildStyleUrl(routing.defaultLocale, locale, styleOption.id)}
      cards={works.map((work) => ({
        id: work.id,
        href: buildWorkPath(routing.defaultLocale, locale, work.id),
        imageUrl: work.result_url || work.imageUrl,
        prompt: truncateText(work.prompt, 120),
        styleLabel: styleOption.label,
        styleHref: buildStylePath(routing.defaultLocale, locale, styleOption.id),
        useCaseLabel: work.use_case ? formatTaxonomyLabel(work.use_case) : undefined,
        useCaseHref: work.use_case
          ? buildUseCasePath(routing.defaultLocale, locale, work.use_case)
          : undefined,
      }))}
      emptyText={t("noResults")}
      explorePrimaryTitle={t("exploreOtherStyles")}
      explorePrimaryLinks={styleOptions
        .filter((item) => item.id !== styleOption.id)
        .slice(0, 12)
        .map((item) => ({
          label: item.label,
          href: buildStylePath(routing.defaultLocale, locale, item.id),
        }))}
      exploreSecondaryTitle={t("exploreOtherUseCases")}
      exploreSecondaryLinks={relatedUseCases.map((item) => ({
        label: item.label,
        href: buildStyleUseCasePath(routing.defaultLocale, locale, styleOption.id, item.id),
      }))}
      ctaLabel={t("startCreating")}
    />
  );
}
