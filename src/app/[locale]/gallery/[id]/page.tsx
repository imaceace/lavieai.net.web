import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WorkDetailClient } from "./WorkDetailClient";
import { routing } from "@/routing";
import { getGalleryWork, getWorkDetailPageData } from "@/lib/gallery-data";
import {
  buildLocalizedPath,
  buildWorkSeoDescription,
  buildWorkSeoKeywords,
  buildWorkSeoTitle,
  buildWorkUrl,
  formatTaxonomyLabel,
  SITE_URL,
  truncateText,
} from "@/lib/gallery-taxonomy";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
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
      title: "Work Not Found | Lavie AI",
      description: "The requested artwork could not be found in the Lavie AI gallery.",
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
  const title = buildWorkSeoTitle(work);
  const description = buildWorkSeoDescription(work);

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

  const t = await getTranslations("gallery");
  const pageData = await getWorkDetailPageData(id);
  const work = pageData.work;
  const imageUrl = work?.result_url || work?.imageUrl;
  const pageUrl = buildWorkUrl(routing.defaultLocale, locale, id);
  const imageTitle = work ? buildWorkSeoTitle(work).replace(" | Lavie AI", "") : "AI Generated Artwork";
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
              name: "Gallery",
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
          description: buildWorkSeoDescription(work),
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
