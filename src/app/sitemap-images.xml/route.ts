import { getGalleryImages } from "@/lib/gallery-data";
import { buildWorkUrl, SITE_URL, truncateText } from "@/lib/gallery-taxonomy";
import { routing } from "@/routing";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const batches = await Promise.all(
    [0, 100, 200, 300, 400].map((offset) =>
      getGalleryImages({ sort: "latest", limit: 100, offset })
    )
  );

  const seen = new Set<string>();
  const works = batches
    .flat()
    .filter((work) => {
      if (!work.id || seen.has(work.id)) return false;
      seen.add(work.id);
      return Boolean(work.result_url || work.imageUrl);
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${works
  .map((work) => {
    const imageUrl = work.result_url || work.imageUrl || "";
    const pageUrl = buildWorkUrl(routing.defaultLocale, routing.defaultLocale, work.id);
    const title = truncateText(work.prompt || "Lavie AI image gallery", 120);
    const lastmod = work.created_at
      ? `<lastmod>${new Date(work.created_at * 1000).toISOString()}</lastmod>`
      : "";

    return `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    ${lastmod}
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(title)}</image:title>
      <image:caption>${escapeXml(title)}</image:caption>
    </image:image>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Sitemap-Source": SITE_URL,
    },
  });
}
