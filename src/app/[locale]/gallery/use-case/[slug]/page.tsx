import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { GalleryLandingPage } from "@/components/gallery/GalleryLandingPage";
import { routing } from "@/routing";
import { getGalleryImages, getStyleOptions, getUseCaseOptionBySlug, getUseCaseOptions } from "@/lib/gallery-data";
import {
  buildStylePath,
  buildStyleUseCasePath,
  buildUseCasePath,
  buildUseCaseUrl,
  buildWorkPath,
  truncateText,
} from "@/lib/gallery-taxonomy";
import { buildUseCaseSeoCopy } from "@/lib/gallery-seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const useCaseOption = await getUseCaseOptionBySlug(slug);
  const t = await getTranslations({ locale, namespace: "gallery" });

  if (!useCaseOption) {
    return {
      title: "Use Case Not Found | Lavie AI",
      robots: { index: false, follow: false },
    };
  }

  const useCaseCopy = buildUseCaseSeoCopy(useCaseOption);
  const title = t("useCaseLandingTitle", { useCase: useCaseOption.label });
  const description =
    locale === routing.defaultLocale
      ? useCaseCopy.description
      : t("metaUseCaseDescription", { useCase: useCaseOption.label });
  const canonical = buildUseCaseUrl(routing.defaultLocale, locale, useCaseOption.id);

  return {
    title,
    description,
    keywords: useCaseCopy.keywords,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((supportedLocale) => [
          supportedLocale,
          buildUseCaseUrl(routing.defaultLocale, supportedLocale, useCaseOption.id),
        ])
      ),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Lavie AI",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function GalleryUseCaseLandingPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, useCaseOption, works, styleOptions, useCaseOptions] = await Promise.all([
    getTranslations("gallery"),
    getUseCaseOptionBySlug(slug),
    getUseCaseOptionBySlug(slug).then((item) =>
      item ? getGalleryImages({ useCase: item.id, limit: 24 }) : Promise.resolve([])
    ),
    getStyleOptions(),
    getUseCaseOptions(),
  ]);

  if (!useCaseOption) notFound();
  const useCaseCopy = buildUseCaseSeoCopy(useCaseOption);
  const localizedDescription =
    locale === routing.defaultLocale
      ? useCaseCopy.description
      : t("metaUseCaseDescription", { useCase: useCaseOption.label });

  const relatedStyles = styleOptions
    .filter((item) => works.some((work) => work.style === item.id))
    .slice(0, 8);

  return (
    <GalleryLandingPage
      backHref="/gallery"
      backLabel={t("backToGallery")}
      title={t("useCaseLandingTitle", { useCase: useCaseOption.label })}
      description={localizedDescription}
      pageUrl={buildUseCaseUrl(routing.defaultLocale, locale, useCaseOption.id)}
      cards={works.map((work) => ({
        id: work.id,
        href: buildWorkPath(routing.defaultLocale, locale, work.id),
        imageUrl: work.result_url || work.imageUrl,
        prompt: truncateText(work.prompt, 120),
        styleLabel: work.style
          ? styleOptions.find((item) => item.id === work.style)?.label || work.style
          : undefined,
        styleHref: work.style ? buildStylePath(routing.defaultLocale, locale, work.style) : undefined,
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
          href: buildUseCasePath(routing.defaultLocale, locale, item.id),
        }))}
      exploreSecondaryTitle={t("exploreOtherStyles")}
      exploreSecondaryLinks={relatedStyles.map((item) => ({
        label: item.label,
        href: buildStyleUseCasePath(routing.defaultLocale, locale, item.id, useCaseOption.id),
      }))}
      ctaLabel={t("startCreating")}
    />
  );
}
