import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/routing";
import "../globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Lavie AI - Free AI Image Generator",
  description: "Create stunning images with AI. Free text to image, AI art creation. No login required. Start creating now!",
  keywords: ["AI image generator", "text to image", "AI art", "free image generator"],
  icons: {
    icon: '/icon',
    shortcut: '/icon',
    apple: '/icon',
  },
  openGraph: {
    title: "Lavie AI - Free AI Image Generator",
    description: "Create stunning images with AI",
    type: "website",
    url: "https://lavieai.net",
    siteName: "Lavie AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lavie AI - Free AI Image Generator",
    description: "Create stunning images with AI",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = locale && routing.locales.includes(locale as "en" | "zh" | "fr" | "it" | "de") 
    ? locale 
    : routing.defaultLocale;

  setRequestLocale(resolvedLocale);

  const messages = await getMessages();

  return (
    <html lang={resolvedLocale} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
