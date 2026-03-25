import { getTranslations, setRequestLocale } from "next-intl/server";
import { WorkDetailClient } from "./WorkDetailClient";
import { routing } from "@/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("gallery");

  return (
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
      }}
      locale={locale}
      workId={(await params).id}
    />
  );
}
