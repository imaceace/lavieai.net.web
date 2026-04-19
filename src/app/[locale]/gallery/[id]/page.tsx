import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WorkDetailClient } from "./WorkDetailClient";
import { routing } from "@/routing";
import { getGalleryWork, getWorkDetailPageData } from "@/lib/gallery-data";
import {
  buildLocalizedPath,
  buildWorkSeoKeywords,
  buildWorkUrl,
  formatTaxonomyLabel,
  SITE_URL,
  truncateText,
} from "@/lib/gallery-taxonomy";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function buildWorkDescriptor(work: Awaited<ReturnType<typeof getGalleryWork>>) {
  if (!work) return "";
  return [formatTaxonomyLabel(work.style), formatTaxonomyLabel(work.use_case)]
    .filter(Boolean)
    .join(" ");
}

function buildLocalizedWorkSeoTitle(
  work: NonNullable<Awaited<ReturnType<typeof getGalleryWork>>>,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  const descriptor = buildWorkDescriptor(work);
  return descriptor
    ? t("metaWorkTitleWithDescriptor", { descriptor })
    : t("metaWorkTitleFallback");
}

function buildLocalizedWorkSeoDescription(
  work: NonNullable<Awaited<ReturnType<typeof getGalleryWork>>>,
  t: (key: string, values?: Record<string, string | number>) => string
) {
  const descriptor = buildWorkDescriptor(work);
  const prompt = truncateText(work.prompt || t("metaImageFallbackName"), 150);
  return descriptor
    ? t("metaWorkDescriptionWithDescriptor", { descriptor, prompt })
    : t("metaWorkDescriptionFallback", { prompt });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  const work = await getGalleryWork(id);
  const canonicalUrl = buildWorkUrl(routing.defaultLocale, locale, id);

  const alternates = Object.fromEntries(
    routing.locales.map((supportedLocale) => [
      supportedLocale,
      buildWorkUrl(routing.defaultLocale, supportedLocale, id),
    ])
  );

  if (!work) {
    return {
      title: `${t("workNotFound")} | Lavie AI`,
      description: t("workNotFoundDesc"),
      alternates: {
        canonical: canonicalUrl,
        languages: alternates,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const imageUrl = work.result_url || work.imageUrl;
  const title = buildLocalizedWorkSeoTitle(work, t);
  const description = buildLocalizedWorkSeoDescription(work, t);

  return {
    title,
    description,
    keywords: buildWorkSeoKeywords(work),
    alternates: {
      canonical: canonicalUrl,
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Lavie AI",
      type: "article",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: work.width || 1024,
              height: work.height || 1024,
              alt: truncateText(work.prompt || "AI generated artwork", 120),
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
    robots: {
      index: work.is_recommended !== 0,
      follow: true,
    },
  };
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([
    getTranslations("gallery"),
    getTranslations("nav"),
  ]);
  const pageData = await getWorkDetailPageData(id);
  const work = pageData.work;
  const imageUrl = work?.result_url || work?.imageUrl;
  const pageUrl = buildWorkUrl(routing.defaultLocale, locale, id);
  const imageTitle = work
    ? buildLocalizedWorkSeoTitle(work, t).replace(" | Lavie AI", "")
    : t("metaImageFallbackName");
  const jsonLd = work
    ? [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Lavie AI",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: tNav("gallery"),
              item: new URL(
                buildLocalizedPath(routing.defaultLocale, locale, "/gallery"),
                SITE_URL
              ).toString(),
            },
            {
              "@type": "ListItem",
              position: 3,
              name: truncateText(work.prompt || imageTitle, 80),
              item: pageUrl,
            },
          ],
        },
        {
          "@context": "https://schema.org",
          "@type": "ImageObject",
          name: imageTitle,
          description: buildLocalizedWorkSeoDescription(work, t),
          contentUrl: imageUrl,
          url: pageUrl,
          caption: truncateText(work.prompt || imageTitle, 160),
          representativeOfPage: true,
          width: work.width || 1024,
          height: work.height || 1024,
          genre: formatTaxonomyLabel(work.style) || undefined,
          keywords: buildWorkSeoKeywords(work).join(", "),
          creator: work.user_name
            ? {
                "@type": "Person",
                name: work.user_name,
              }
            : {
                "@type": "Organization",
                name: "Lavie AI",
              },
        },
      ]
    : [];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={`gallery-work-jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
      <WorkDetailClient
        translations={{
          backToGallery: t("backToGallery"),
          workNotFound: t("workNotFound"),
          workNotFoundDesc: t("workNotFoundDesc"),
          prompt: t("prompt"),
          negativePrompt: t("negativePrompt"),
          details: t("details"),
          style: t("style"),
          useCase: t("useCase"),
          created: t("created"),
          size: t("size"),
          copyPrompt: t("copyPrompt"),
          createSimilar: t("createSimilar"),
          download: t("download"),
          share: t("share"),
          loadingWork: t("loadingWork"),
          promptBreakdown: t("promptBreakdown"),
          subject: t("subject"),
          styleDirection: t("styleDirection"),
          bestFor: t("bestFor"),
          howToCreateSimilar: t("howToCreateSimilar"),
          howToCreateSimilarDesc: t("howToCreateSimilarDesc"),
          relatedStyleWorks: t("relatedStyleWorks"),
          relatedUseCaseWorks: t("relatedUseCaseWorks"),
          latestWorks: t("latestWorks"),
        }}
        locale={locale}
        workId={id}
        initialWork={pageData.work}
        initialRelatedWorks={pageData.relatedByStyle}
        initialUseCaseWorks={pageData.relatedByUseCase}
        initialLatestWorks={pageData.latestWorks}
      />
    </>
  );
}
