import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/routing";
import "../globals.css";
import Script from "next/script";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { LoginModal } from "@/components/auth/LoginModal";
import { TurnstileChallengeModal } from "@/components/ui/TurnstileChallengeModal";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "Lavie AI - Free AI Image Generator",
  description: "Create stunning images with Lavie AI. Free text to image, AI art creation. No login required. Start creating now with Lavie AI Image Generator!",
  keywords: ["Lavie AI", "Lavie AI Image Generator", "AI image generator", "text to image", "AI art", "free image generator"],
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon', type: 'image/ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icon',
  },
  openGraph: {
    title: "Lavie AI - Free AI Image Generator",
    description: "Create stunning AI images with Lavie AI Image Generator",
    type: "website",
    url: "https://lavieai.net",
    siteName: "Lavie AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lavie AI - Free AI Image Generator",
    description: "Create stunning AI images with Lavie AI Image Generator",
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
  const resolvedLocale = locale && routing.locales.includes(locale as "en" | "es" | "fr" | "it" | "de") 
    ? locale 
    : routing.defaultLocale;

  setRequestLocale(resolvedLocale);

  const messages = await getMessages();

  return (
    <html lang={resolvedLocale} suppressHydrationWarning>
      <head>
        <script
          id="theme-script"
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
          <ToastContainer />
          <LoginModal />
          <TurnstileChallengeModal />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
