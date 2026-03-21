import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Lavie AI - Free AI Image Generator",
  description: "Create stunning images with AI. Free text to image, AI art creation. No login required. Start creating now!",
  keywords: ["AI image generator", "text to image", "AI art", "free image generator"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
