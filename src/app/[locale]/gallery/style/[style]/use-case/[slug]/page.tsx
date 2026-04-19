import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GalleryLandingPage } from "@/components/gallery/GalleryLandingPage";
import { routing } from "@/routing";
import {
  getGalleryImages,
  getStyleOptions,
  getUseCaseOptionBySlug,
  getUseCaseOptions,
} from "@/lib/gallery-data";
import {
  buildStylePath,
  buildStyleUseCasePath,
  buildStyleUseCaseUrl,
  buildUseCasePath,
  buildWorkPath,
  truncateText,
} from "@/lib/gallery-taxonomy";
import { buildComboSeoCopy } from "@/lib/gallery-seo";

async function getStyleOption(styleId: string) {
  const options = await getStyleOptions();
  return options.find((item) => item.id === styleId) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; style: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, style, slug } = await params;
  const [styleOption, useCaseOption] = await Promise.all([
    getStyleOption(style),
    getUseCaseOptionBySlug(slug),
  ]);

  if (!styleOption || !useCaseOption) {
    return {
      title: "Gallery Collection Not Found | Lavie AI",
      robots: { index: false, follow: false },
    };
  }

  const comboCopy = buildComboSeoCopy(styleOption, useCaseOption);
  const canonical = buildStyleUseCaseUrl(
    routing.defaultLocale,
    locale,
    styleOption.id,
    useCaseOption.id
  );

  return {
    title: comboCopy.title,
    description: comboCopy.description,
    keywords: comboCopy.keywords,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((supportedLocale) => [
          supportedLocale,
          buildStyleUseCaseUrl(
            routing.defaultLocale,
            supportedLocale,
            styleOption.id,
            useCaseOption.id
          ),
        ])
      ),
    },
    openGraph: {
      title: comboCopy.title,
      description: comboCopy.description,
      url: canonical,
      siteName: "Lavie AI",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: comboCopy.title,
      description: comboCopy.description,
    },
  };
}

export default async function GalleryStyleUseCaseLandingPage({
  params,
}: {
  params: Promise<{ locale: string; style: string; slug: string }>;
}) {
  const { locale, style, slug } = await params;
  setRequestLocale(locale);

  const [t, styleOption, useCaseOption, works, styleOptions, useCaseOptions] = await Promise.all([
    getTranslations("gallery"),
    getStyleOption(style),
    getUseCaseOptionBySlug(slug),
    getUseCaseOptionBySlug(slug).then((item) =>
      item ? getGalleryImages({ style, useCase: item.id, limit: 24 }) : Promise.resolve([])
    ),
    getStyleOptions(),
    getUseCaseOptions(),
  ]);

  if (!styleOption || !useCaseOption) notFound();
  const comboCopy = buildComboSeoCopy(styleOption, useCaseOption);

  return (
    <GalleryLandingPage
      backHref={buildStylePath(routing.defaultLocale, locale, styleOption.id)}
      backLabel={t("backToGallery")}
      title={t("comboLandingTitle", {
        style: styleOption.label,
        useCase: useCaseOption.label,
      })}
      description={comboCopy.description}
      pageUrl={buildStyleUseCaseUrl(routing.defaultLocale, locale, styleOption.id, useCaseOption.id)}
      cards={works.map((work) => ({
        id: work.id,
        href: buildWorkPath(routing.defaultLocale, locale, work.id),
        imageUrl: work.result_url || work.imageUrl,
        prompt: truncateText(work.prompt, 120),
        styleLabel: styleOption.label,
        styleHref: buildStylePath(routing.defaultLocale, locale, styleOption.id),
        useCaseLabel: useCaseOption.label,
        useCaseHref: buildUseCasePath(routing.defaultLocale, locale, useCaseOption.id),
      }))}
      emptyText={t("noResults")}
      explorePrimaryTitle={t("exploreOtherUseCases")}
      explorePrimaryLinks={useCaseOptions
        .filter((item) => item.id !== useCaseOption.id)
        .slice(0, 12)
        .map((item) => ({
          label: item.label,
          href: buildStyleUseCasePath(routing.defaultLocale, locale, styleOption.id, item.id),
        }))}
      exploreSecondaryTitle={t("exploreOtherStyles")}
      exploreSecondaryLinks={styleOptions
        .filter((item) => item.id !== styleOption.id)
        .slice(0, 12)
        .map((item) => ({
          label: item.label,
          href: buildStyleUseCasePath(routing.defaultLocale, locale, item.id, useCaseOption.id),
        }))}
      ctaLabel={t("startCreating")}
    />
  );
}
