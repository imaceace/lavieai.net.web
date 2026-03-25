"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/routing";
import { ArrowLeft, Copy, Sparkles, Download, Share2, Loader2 } from "lucide-react";

interface GalleryItem {
  id: string;
  imageUrl?: string;
  result_url?: string;
  prompt: string;
  negative_prompt?: string;
  style: string | null;
  use_case: string | null;
  user_name?: string;
  likes?: number;
  created_at?: number;
  width?: number;
  height?: number;
}

interface UseCase {
  id: string;
  name: string;
  icon: string;
}

interface WorkDetailTranslations {
  backToGallery: string;
  workNotFound: string;
  workNotFoundDesc: string;
  prompt: string;
  negativePrompt: string;
  details: string;
  style: string;
  useCase: string;
  created: string;
  size: string;
  copyPrompt: string;
  createSimilar: string;
  download: string;
  share: string;
  loadingWork: string;
}

const useCases: UseCase[] = [
  { id: "avatar", name: "Avatar", icon: "👤" },
  { id: "wallpaper", name: "Wallpaper", icon: "🖼️" },
  { id: "social", name: "Social Media", icon: "📱" },
  { id: "product", name: "Product", icon: "📦" },
  { id: "marketing", name: "Marketing", icon: "📊" },
  { id: "book", name: "Book Cover", icon: "📖" },
  { id: "game", name: "Game", icon: "🎮" },
];

const styleEmojis: Record<string, string> = {
  portrait: "👤", landscape: "🏔️", anime: "🎌", cyberpunk: "🌃",
  fantasy: "🧙", "oil-painting": "🖼️", watercolor: "🎨", sketch: "✏️",
  "3d-render": "🎲", "pixel-art": "👾", minimalist: "◼️", ukiyoe: "🏯",
  "black-white": "⬛", food: "🍕", pet: "🐱", floral: "🌸",
  interior: "🏠", fashion: "👗", commercial: "📺", macro: "🔬",
  film: "🎞️", illustration: "✍️", "ui-design": "📱", logo: "🔵",
  cover: "📔", ecommerce: "🛒", packaging: "📦", typography: "🔤",
  product: "📦", photographic: "📷", "fantasy-art": "✦", "comic-book": "▤",
};

function formatDate(timestamp: number, locale: string): string {
  return new Date(timestamp * 1000).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function truncatePrompt(prompt: string, maxLength: number = 100): string {
  if (prompt.length <= maxLength) return prompt;
  return prompt.slice(0, maxLength) + "...";
}

export function WorkDetailClient({
  translations,
  locale,
  workId,
}: {
  translations: WorkDetailTranslations;
  locale: string;
  workId: string;
}) {
  const router = useRouter();

  const [item, setItem] = useState<GalleryItem | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWork = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/gallery/${workId}`);
        const data = await res.json();
        if (data.success) {
          setItem(data.data);
        } else {
          setError("Work not found");
        }
      } catch (err) {
        console.error("Failed to fetch work:", err);
        setError("Failed to load work");
      } finally {
        setIsLoading(false);
      }
    };

    if (workId) {
      fetchWork();
    }
  }, [workId]);

  useEffect(() => {
    if (!item?.style) return;
    
    const fetchRelated = async () => {
      setIsLoadingRelated(true);
      try {
        const params = new URLSearchParams();
        params.set('style', item.style!);
        params.set('exclude', item.id);
        params.set('limit', '8');
        const res = await fetch(`/api/gallery?${params}`);
        const data = await res.json();
        if (data.success) {
          setRelatedWorks(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch related works:", err);
      } finally {
        setIsLoadingRelated(false);
      }
    };
    
    fetchRelated();
  }, [item?.style, item?.id]);

  const handleCopyPrompt = () => {
    if (item?.prompt) {
      navigator.clipboard.writeText(item.prompt);
    }
  };

  const handleDownload = async () => {
    if (!item?.result_url && !item?.imageUrl) return;
    
    const url = item.result_url || item.imageUrl;
    try {
      const res = await fetch(url!);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const safeName = item.prompt.slice(0, 30).replace(/[^a-z0-9\u4e00-\u9fa5]/gi, "_").toLowerCase();
      a.download = `lavie_${safeName || "image"}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch {
      alert(locale === "zh" ? "下载失败" : "Download failed");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: item?.prompt ? truncatePrompt(item.prompt, 60) : "AI Artwork",
        text: item?.prompt,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert(locale === "zh" ? "链接已复制到剪贴板！" : "Link copied to clipboard!");
    }
  };

  const handleGenerateSimilar = () => {
    if (!item) return;
    
    const generatorParams = {
      prompt: item.prompt,
      style: item.style || null,
      use_case: item.use_case || null,
    };
    sessionStorage.setItem("generatorParams", JSON.stringify(generatorParams));
    router.push("/");
  };

  const useCaseInfo = useCases.find((uc) => uc.id === item?.use_case);
  const styleLabel = item?.style ? item.style.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="ml-3 text-gray-600">{translations.loadingWork}</span>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-stone-50 via-rose-50/30 to-indigo-50/30">
        <h1 className="text-2xl font-bold text-gray-900">{translations.workNotFound}</h1>
        <p className="text-gray-600">{translations.workNotFoundDesc}</p>
        <Link href="/gallery" className="text-rose-500 hover:underline font-medium">
          {translations.backToGallery}
        </Link>
      </div>
    );
  }

  const imageUrl = item.result_url || item.imageUrl;
  const imageAlt = `${item.prompt} - AI Generated ${styleLabel} Art`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-indigo-50/30">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Link
            href="/gallery"
            className="flex items-center gap-2 text-gray-600 hover:text-rose-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">{translations.backToGallery}</span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className="relative bg-gradient-to-br from-rose-50 to-violet-50">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  title={`Generated with Lavie AI - ${styleLabel} style`}
                  className="w-full h-auto object-contain"
                  width={item.width || 1024}
                  height={item.height || 1024}
                  loading="eager"
                />
              ) : (
                <div className="aspect-square flex items-center justify-center">
                  <span className="text-8xl">{styleEmojis[item.style || ""] || "🎨"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">{translations.prompt}</h2>
            <div className="flex items-start justify-between gap-4">
              <p className="text-gray-700 flex-1 leading-relaxed">{item.prompt}</p>
              <button
                onClick={handleCopyPrompt}
                className="p-2 hover:bg-gray-100 rounded-lg shrink-0 transition-colors"
                title={translations.copyPrompt}
              >
                <Copy className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {item.negative_prompt && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-2">{translations.negativePrompt}</h3>
                <p className="text-gray-500 text-sm">{item.negative_prompt}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">{translations.details}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {item.style && (
                <div className="bg-rose-50 rounded-xl p-3">
                  <label className="text-xs font-medium text-rose-600 mb-1 block">{translations.style}</label>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
                    {styleEmojis[item.style]} {styleLabel}
                  </span>
                </div>
              )}
              {item.use_case && useCaseInfo && (
                <div className="bg-violet-50 rounded-xl p-3">
                  <label className="text-xs font-medium text-violet-600 mb-1 block">{translations.useCase}</label>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-800">
                    {useCaseInfo.icon} {useCaseInfo.name}
                  </span>
                </div>
              )}
              {item.created_at && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <label className="text-xs font-medium text-amber-600 mb-1 block">{translations.created}</label>
                  <span className="text-sm font-medium text-gray-800">{formatDate(item.created_at, locale)}</span>
                </div>
              )}
              {item.width && item.height && (
                <div className="bg-emerald-50 rounded-xl p-3">
                  <label className="text-xs font-medium text-emerald-600 mb-1 block">{translations.size}</label>
                  <span className="text-sm font-medium text-gray-800">{item.width} × {item.height}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerateSimilar}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-xl hover:from-rose-600 hover:to-violet-600 font-semibold transition-all shadow-lg shadow-rose-200"
            >
              <Sparkles className="w-5 h-5" />
              {translations.createSimilar}
            </button>
            {imageUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{translations.download}</span>
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Share2 className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">{translations.share}</span>
            </button>
          </div>
        </div>

        {relatedWorks.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {item.style?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())} {translations.style} Gallery
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedWorks.map((work) => {
                const imageUrl = work.result_url || work.imageUrl;
                return (
                  <Link
                    key={work.id}
                    href={`/gallery/${work.id}`}
                    className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={work.prompt}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-100 to-violet-100">
                        <span className="text-4xl">{styleEmojis[work.style || ""] || "🎨"}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                      <p className="text-white text-xs text-center line-clamp-2">{work.prompt}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
