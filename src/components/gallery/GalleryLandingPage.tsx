import { Link } from "@/routing";
import { buildAbsoluteUrl } from "@/lib/gallery-taxonomy";

interface GalleryLandingCard {
  id: string;
  href: string;
  imageUrl?: string;
  prompt: string;
  styleLabel?: string;
  styleHref?: string;
  useCaseLabel?: string;
  useCaseHref?: string;
}

interface LandingLink {
  label: string;
  href: string;
}

export function GalleryLandingPage({
  backHref,
  backLabel,
  title,
  description,
  pageUrl,
  cards,
  emptyText,
  explorePrimaryTitle,
  explorePrimaryLinks,
  exploreSecondaryTitle,
  exploreSecondaryLinks,
  ctaLabel,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  pageUrl: string;
  cards: GalleryLandingCard[];
  emptyText: string;
  explorePrimaryTitle: string;
  explorePrimaryLinks: LandingLink[];
  exploreSecondaryTitle?: string;
  exploreSecondaryLinks?: LandingLink[];
  ctaLabel: string;
}) {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: cards.length,
      itemListElement: cards.slice(0, 24).map((card, index) => ({
        "@type": "ListItem",
        position: index + 1,
          url: card.href.startsWith("/") ? buildAbsoluteUrl(card.href) : card.href,
        name: card.prompt,
      })),
    },
    publisher: {
      "@type": "Organization",
      name: "Lavie AI",
      url: "https://lavieai.net",
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-indigo-50/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <div className="container mx-auto px-4 py-8">
        <Link href={backHref} className="inline-flex items-center text-sm font-medium text-rose-500 hover:underline">
          {backLabel}
        </Link>

        <header className="mt-4 mb-8 max-w-full md:max-w-4xl xl:max-w-5xl">
          <h1 className="max-w-full md:max-w-4xl text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          <p className="mt-3 max-w-full sm:max-w-[34rem] md:max-w-[44rem] xl:max-w-[56rem] text-base md:text-lg text-gray-600 leading-7 md:leading-8">
            {description}
          </p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-rose-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200 hover:from-rose-600 hover:to-violet-600"
            >
              {ctaLabel}
            </Link>
          </div>
        </header>

        {cards.length > 0 ? (
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cards.map((card) => (
                <article
                  key={card.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <Link href={card.href} className="block">
                    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                      {card.imageUrl ? (
                        <img
                          src={card.imageUrl}
                          alt={card.prompt}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🎨</div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={card.href} className="block">
                      <h2 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-relaxed hover:text-rose-500">
                        {card.prompt}
                      </h2>
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {card.styleLabel && card.styleHref ? (
                        <Link
                          href={card.styleHref}
                          className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                        >
                          {card.styleLabel}
                        </Link>
                      ) : null}
                      {card.useCaseLabel && card.useCaseHref ? (
                        <Link
                          href={card.useCaseHref}
                          className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                        >
                          {card.useCaseLabel}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">{emptyText}</div>
        )}

        {explorePrimaryLinks.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{explorePrimaryTitle}</h2>
            <div className="flex flex-wrap gap-3">
              {explorePrimaryLinks.map((item) => (
                <Link
                  key={`${explorePrimaryTitle}-${item.href}`}
                  href={item.href}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-rose-300 hover:text-rose-500"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {exploreSecondaryTitle && exploreSecondaryLinks && exploreSecondaryLinks.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{exploreSecondaryTitle}</h2>
            <div className="flex flex-wrap gap-3">
              {exploreSecondaryLinks.map((item) => (
                <Link
                  key={`${exploreSecondaryTitle}-${item.href}`}
                  href={item.href}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-violet-300 hover:text-violet-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
