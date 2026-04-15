"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/routing";
import { useToast } from "@/hooks/useToast";
import { useUserStore } from "@/stores/userStore";
import { ArrowLeft, Copy, Sparkles, Download, Share2, Loader2, ChevronDown } from "lucide-react";
import { galleryApi } from "@/lib/api";

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
  return new Date(timestamp * 1000).toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
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
  const { addToast } = useToast();
  const { user } = useUserStore();
  const isPremium = user && user.subscription_type !== "free";

  const [item, setItem] = useState<GalleryItem | null>(null);
  const [relatedWorks, setRelatedWorks] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewBgMode, setPreviewBgMode] = useState<"white" | "checker" | "dark">("checker");

  useEffect(() => {
    const fetchWork = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await galleryApi.getWork(workId);
        if (data) {
          setItem(data);
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
        const data = await galleryApi.getImages({
          style: item.style!,
          exclude: item.id,
          limit: 8
        });
        if (data && data.images) {
          setRelatedWorks(data.images);
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

  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  const getPreviewBgStyle = () => {
    if (previewBgMode === "white") {
      return { backgroundColor: "#ffffff" };
    }
    if (previewBgMode === "dark") {
      return { backgroundColor: "#111827" };
    }
    return {
      backgroundColor: "#ffffff",
      backgroundImage:
        "linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)",
      backgroundSize: "20px 20px",
      backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
    };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setIsDownloadMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = async (format: 'webp' | 'png' | 'jpeg' | 'ico') => {
    setIsDownloadMenuOpen(false);
    if (!item?.result_url && !item?.imageUrl) return;
    
    const url = item.result_url || item.imageUrl;
    try {
      const res = await fetch(url!);
      const originalBlob = await res.blob();
      
      let finalBlob = originalBlob;
      const safeName = item.prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "_").toLowerCase();
      let ext = format;
      
      if (format !== 'webp' && format !== 'png' && format !== 'jpeg' && format !== 'ico') {
         // fallback
      } else {
        // Need to draw to canvas for conversion
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const imgLoadPromise = new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = window.URL.createObjectURL(originalBlob);
        });
        await imgLoadPromise;
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas not supported');
        ctx.drawImage(img, 0, 0);
        
        if (!isPremium) {
          const text = "Lavie AI";
          const fontSize = Math.max(20, Math.floor(img.width / 25));
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
          ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
          
          const padding = fontSize;
          const textMetrics = ctx.measureText(text);
          const x = img.width - textMetrics.width - padding;
          const y = img.height - padding;
          
          ctx.fillText(text, x, y);
        }
        
        if (format === 'ico') {
          const size = Math.min(img.width, img.height, 256);
          const icoCanvas = document.createElement('canvas');
          icoCanvas.width = size;
          icoCanvas.height = size;
          const icoCtx = icoCanvas.getContext('2d');
          icoCtx?.drawImage(img, 0, 0, size, size);
          
          const pngBlob = await new Promise<Blob>((res) => icoCanvas.toBlob((b) => res(b!), 'image/png'));
          const pngBuffer = await pngBlob.arrayBuffer();
          const pngArray = new Uint8Array(pngBuffer);
          
          const icoBuffer = new ArrayBuffer(22 + pngArray.length);
          const view = new DataView(icoBuffer);
          view.setUint16(0, 0, true);
          view.setUint16(2, 1, true);
          view.setUint16(4, 1, true);
          view.setUint8(6, size === 256 ? 0 : size);
          view.setUint8(7, size === 256 ? 0 : size);
          view.setUint8(8, 0);
          view.setUint8(9, 0);
          view.setUint16(10, 1, true);
          view.setUint16(12, 32, true);
          view.setUint32(14, pngArray.length, true);
          view.setUint32(18, 22, true);
          new Uint8Array(icoBuffer, 22).set(pngArray);
          
          finalBlob = new Blob([icoBuffer], { type: 'image/x-icon' });
        } else {
          finalBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), `image/${format}`, 0.95));
        }
      }

      const blobUrl = window.URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `lavie_${safeName || "image"}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
      addToast(locale === "es" ? "Descarga fallida" : "Download failed", "error");
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
      addToast(locale === "es" ? "¡Enlace copiado al portapapeles!" : "Link copied to clipboard!", "success");
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
            <div className="px-4 pt-4 pb-2 flex items-center justify-end gap-2">
              {(["white", "checker", "dark"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPreviewBgMode(mode)}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                    previewBgMode === mode
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {mode === "white" ? "White" : mode === "checker" ? "Checker" : "Dark"}
                </button>
              ))}
            </div>
            <div
              className="relative"
              style={{
                ...getPreviewBgStyle()
              }}
            >
              {imageUrl ? (
                <>
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    title={`Generated with Lavie AI - ${styleLabel} style`}
                    className="w-full h-auto object-contain select-none"
                    width={item.width || 1024}
                    height={item.height || 1024}
                    loading="eager"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable={false}
                  />
                  {!isPremium && (
                    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 pointer-events-none select-none z-10">
                      <span className="text-white/80 font-bold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
                        Lavie AI
                      </span>
                    </div>
                  )}
                </>
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
              <div className="relative inline-block text-left" ref={downloadMenuRef}>
                <button
                  onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                  className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-700">{translations.download}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDownloadMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-32 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-10 overflow-hidden">
                    <button
                      onClick={() => handleDownload('webp')}
                      className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors text-left font-medium"
                    >
                      WebP
                    </button>
                    <button
                      onClick={() => handleDownload('png')}
                      className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors text-left font-medium"
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => handleDownload('jpeg')}
                      className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors text-left font-medium"
                    >
                      JPEG
                    </button>
                    <button
                      onClick={() => handleDownload('ico')}
                      className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors text-left font-medium"
                    >
                      ICO
                    </button>
                  </div>
                )}
              </div>
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
