import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import HomeClient from "./HomeClient";
import { routing } from "@/routing";
import { buildAbsoluteUrl, buildLocalizedPath } from "@/lib/gallery-taxonomy";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const canonical = buildAbsoluteUrl(buildLocalizedPath(routing.defaultLocale, locale, "/"));

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical,
      languages: Object.fromEntries(
        routing.locales.map((supportedLocale) => [
          supportedLocale,
          buildAbsoluteUrl(buildLocalizedPath(routing.defaultLocale, supportedLocale, "/")),
        ])
      ),
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: canonical,
      siteName: "Lavie AI",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeClient />;
}
