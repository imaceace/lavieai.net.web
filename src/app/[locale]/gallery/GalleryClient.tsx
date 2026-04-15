"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useUserStore } from "@/stores/userStore";
import { Search, Copy, Sparkles, X, Download, Share2, Loader2, ChevronDown, Palette, Filter } from "lucide-react";

import { configApi, galleryApi } from "@/lib/api-client";

interface GalleryItem {
  id: string;
  imageUrl?: string;
  result_url?: string;
  prompt: string;
  style: string | null;
  use_case: string | null;
  user_name?: string;
  likes?: number;
  created_at?: number;
  recommended_level?: number;
}

interface StyleOption {
  id: string;
  label: string;
  icon: string;
}

interface GalleryTranslations {
  badge: string;
  title: string;
  description: string;
  searchPlaceholder: string;
  selectStyle: string;
  allStyles: string;
  popular: string;
  loading: string;
  noResults: string;
  noResultsHint: string;
  viewDetails: string;
  generateSimilar: string;
  generate: string;
  loadMore: string;
  endOfList: string;
  artworkDetails: string;
  prompt: string;
  copyPrompt: string;
  style: string;
  // creator: string;
  download: string;
  share: string;
}

const styleEmojis: Record<string, string> = {
  portrait: "👤", landscape: "🏔️", anime: "🎌", cyberpunk: "🌃",
  fantasy: "🧙", "oil-painting": "🖼️", watercolor: "🎨", sketch: "✏️",
  "3d-render": "🎲", "pixel-art": "👾", minimalist: "◼️", ukiyoe: "🏯",
  food: "🍕", pet: "🐱", floral: "🌸", interior: "🏠", fashion: "👗",
  commercial: "📺", macro: "🔬", film: "🎞️", illustration: "✍️",
  "ui-design": "📱", logo: "🔵", cover: "📔", ecommerce: "🛒",
  packaging: "📦", typography: "🔤", product: "📦", photographic: "📷",
  "fantasy-art": "✦", "comic-book": "▤", bw: "⬛",
};

function formatTimeAgo(timestamp: number, locale: string): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return locale === "es" ? "ahora" : "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return locale === "es" ? `hace ${minutes} min` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "es" ? `hace ${hours} h` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return locale === "es" ? `hace ${days} d` : `${days}d ago`;
}

export function GalleryClient({
  translations,
  locale,
}: {
  translations: GalleryTranslations;
  locale: string;
}) {
  const router = useRouter();
  const { addToast } = useToast();
  const { user } = useUserStore();
  const isPremium = user && user.subscription_type !== "free";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [styles, setStyles] = useState<StyleOption[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [previewBgMode, setPreviewBgMode] = useState<"white" | "checker" | "dark">("checker");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const LIMIT = 16;

  useEffect(() => {
    configApi.getGenerationOptions().then(options => {
      if (options) {
        const styleOptions: StyleOption[] = options.styles.map(s => ({
          id: s.id,
          label: s.label,
          icon: styleEmojis[s.id] || "🎨",
        }));
        setStyles(styleOptions);
      }
    });
  }, []);

  const fetchGallery = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const res = await galleryApi.getImages({
        style: selectedStyle === 'popular' ? undefined : (selectedStyle || undefined),
        limit: LIMIT,
        offset: currentOffset,
        sort: selectedStyle === 'popular' ? 'popular' : undefined,
      });
      
      if (res && res.images) {
        const newItems = res.images || [];
        if (reset) {
          setGalleryItems(newItems);
          setOffset(LIMIT);
        } else {
          setGalleryItems(prev => [...prev, ...newItems]);
          setOffset(prev => prev + LIMIT);
        }
        setHasMore(newItems.length === LIMIT);
      }
    } catch (err) {
      console.error("Gallery fetch error:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [offset, selectedStyle]);

  useEffect(() => {
    setOffset(0);
    fetchGallery(true);
  }, [selectedStyle]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          fetchGallery(false);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, isLoading, fetchGallery]);

  const filteredGallery = galleryItems.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.style && item.style.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
  };

  const handleGenerateSimilar = (item: GalleryItem) => {
    const generatorParams = {
      prompt: item.prompt,
      style: item.style || null,
      use_case: item.use_case || null,
    };
    sessionStorage.setItem('generatorParams', JSON.stringify(generatorParams));
    window.location.href = '/';
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

  const handleDownload = async (url: string, name?: string, format: 'webp' | 'png' | 'jpeg' | 'ico' = 'png') => {
    setIsDownloadMenuOpen(false);
    try {
      const res = await fetch(url);
      const originalBlob = await res.blob();
      
      let finalBlob = originalBlob;
      const safeName = name?.slice(0, 30).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      let ext = format;
      
      if (format !== 'webp' && format !== 'png' && format !== 'jpeg' && format !== 'ico') {
         // fallback
      } else {
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
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `lavie_${safeName || 'image'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed', err);
      addToast(locale === 'es' ? 'Descarga fallida' : 'Download failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-indigo-50/30">
      <div className="container mx-auto px-4 pt-8 pb-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100/60 rounded-full mb-6">
            <Palette className="w-4 h-4 text-rose-600" />
            <span className="text-sm text-rose-700 font-medium">{translations.badge}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              {translations.title}
            </span>
          </h1>
          <p className="text-gray-500 text-center text-lg max-w-2xl mx-auto leading-relaxed">
            {translations.description}
          </p>

          <div className="max-w-xl mx-auto flex gap-3 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translations.searchPlaceholder}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-rose-300 focus:border-transparent shadow-sm"
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => {
                  const dropdown = document.getElementById('style-dropdown');
                  if (dropdown) dropdown.classList.toggle('hidden');
                }}
                className={`flex items-center gap-2 px-4 py-3 rounded-full border transition-all shadow-sm ${
                  selectedStyle
                    ? "bg-rose-100 border-rose-200 text-rose-700"
                    : "bg-white/80 border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {selectedStyle === 'popular' ? `🔥 ${translations.popular}` : 
                   selectedStyle ? styles.find(s => s.id === selectedStyle)?.label || translations.selectStyle : 
                   translations.selectStyle}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <div
                id="style-dropdown"
                className="hidden absolute top-full mt-2 right-0 w-64 max-h-80 overflow-y-auto bg-white rounded-xl shadow-lg border border-gray-100 z-20"
              >
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSelectedStyle(null);
                      document.getElementById('style-dropdown')?.classList.add('hidden');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedStyle === null
                        ? "bg-rose-100 text-rose-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {translations.allStyles}
                  </button>
                  
                  {/* Popular Category */}
                  <button
                    onClick={() => {
                      setSelectedStyle('popular');
                      document.getElementById('style-dropdown')?.classList.add('hidden');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mt-1 ${
                      selectedStyle === 'popular'
                        ? "bg-amber-100 text-amber-700 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    🔥 {translations.popular}
                  </button>
                  
                  <div className="border-t my-2" />
                  <div className="grid grid-cols-2 gap-1">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedStyle(style.id);
                          document.getElementById('style-dropdown')?.classList.add('hidden');
                        }}
                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedStyle === style.id
                            ? "bg-rose-100 text-rose-700 font-medium"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span className="mr-1.5">{style.icon}</span>
                        <span className="truncate">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <span className="ml-3 text-gray-600">{translations.loading}</span>
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <p className="text-gray-500 text-lg">{translations.noResults}</p>
            <p className="text-gray-400 text-sm mt-2">{translations.noResultsHint}</p>
          </div>
        ) : (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "CollectionPage",
                  name: `Gallery | Lavie AI`,
                  description: "Browse AI generated artwork created with Lavie AI.",
                  url: "https://lavieai.net/gallery",
                  mainEntity: {
                    "@type": "ItemList",
                    name: "AI Art Gallery",
                    description: "Browse AI generated artwork created with Lavie AI.",
                    numberOfItems: filteredGallery.length,
                    itemListElement: filteredGallery.slice(0, 20).map((item, index) => ({
                      "@type": "ListItem",
                      position: index + 1,
                      url: `https://lavieai.net/gallery/${item.id}`,
                      name: item.prompt.slice(0, 100),
                      description: `${item.prompt} - AI ${item.style || ""} artwork`,
                    })),
                  },
                  publisher: {
                    "@type": "Organization",
                    name: "Lavie AI",
                    url: "https://lavieai.net",
                  },
                }),
              }}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(() => {
                const maxRecommendedLevel = Math.max(0, ...filteredGallery.map(i => i.recommended_level || 0));
                return filteredGallery.map((item) => {
                  const styleLabel = item.style ? item.style.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "";
                  const imageAlt = item.prompt ? `${item.prompt} - AI Generated ${styleLabel} Art` : "AI Generated Artwork";
                  const isPopular = (item.recommended_level || 0) === maxRecommendedLevel && maxRecommendedLevel > 0;
                  
                  return (
                    <article
                    key={item.id}
                    className="group relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1"
                    onClick={() => setSelectedItem(item)}
                    itemScope
                    itemType="https://schema.org/ImageObject"
                  >
                    {(item.result_url || item.imageUrl) ? (
                      <img
                        src={item.result_url || item.imageUrl}
                        alt={imageAlt}
                        title={imageAlt}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                        decoding="async"
                        itemProp="image"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-rose-100 to-violet-100">
                        <span className="text-6xl">{styleEmojis[item.style || ""] || "🎨"}</span>
                      </div>
                    )}
                    
                    <meta itemProp="name" content={item.prompt.slice(0, 100)} />
                    <meta itemProp="description" content={item.prompt} />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {(item.style || isPopular) && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
                        <span className="text-xs font-medium text-gray-700 flex gap-1 items-center">
                          {isPopular && (
                            <>
                              <span className="text-amber-500">🔥 {translations.popular}</span>
                              {item.style && <span className="text-gray-300">|</span>}
                            </>
                          )}
                          {item.style && <span>{styleEmojis[item.style]} {styleLabel}</span>}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end p-4 gap-3">
                      <p className="text-white text-sm text-center line-clamp-2 drop-shadow-lg">{item.prompt}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/gallery/${item.id}`);
                        }}
                        className="px-4 py-2 bg-white text-gray-900 text-xs font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {translations.viewDetails}
                      </button>
                      <div className="flex items-center gap-2 text-white/90 text-xs">
                        {item.created_at && <span>{formatTimeAgo(item.created_at, locale)}</span>}
                      </div>
                    </div>
                  </article>
                );
              })})()}
            </div>

            <div ref={loadMoreRef} className="flex items-center justify-center py-8">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{translations.loadMore}</span>
                </div>
              )}
              {!hasMore && galleryItems.length > 0 && (
                <div className="text-center">
                  <span className="text-gray-400">{translations.endOfList}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-4xl my-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-violet-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800">{translations.artworkDetails}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <div className="mb-3 flex items-center justify-end gap-2">
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
                className="relative rounded-xl flex items-center justify-center mb-5 overflow-hidden"
                style={{
                  maxHeight: '50vh',
                  ...getPreviewBgStyle()
                }}
              >
                {(selectedItem.result_url || selectedItem.imageUrl) ? (
                  <>
                    <img
                      src={selectedItem.result_url || selectedItem.imageUrl}
                      alt={selectedItem.prompt}
                      className="w-full h-full object-contain select-none"
                      style={{ maxHeight: '50vh' }}
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
                  <span className="text-6xl sm:text-8xl">{styleEmojis[selectedItem.style || ""] || "🎨"}</span>
                )}
              </div>

              <div className="mb-5">
                <label className="text-sm font-medium text-gray-500 mb-2 block">{translations.prompt}</label>
                <div className="bg-gray-50 rounded-xl p-3 sm:p-4 flex items-start justify-between gap-3">
                  <p className="text-sm sm:text-base text-gray-700 flex-1 break-words leading-relaxed">{selectedItem.prompt}</p>
                  <button
                    onClick={() => handleCopyPrompt(selectedItem.prompt)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                    title={translations.copyPrompt}
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-5">
                {selectedItem.style && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-full">
                    <span className="text-lg">{styleEmojis[selectedItem.style]}</span>
                    <span className="text-sm font-medium text-rose-700">
                      {selectedItem.style?.replace(/-/g, " ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleGenerateSimilar(selectedItem)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-rose-500 to-violet-500 text-white rounded-xl hover:from-rose-600 hover:to-violet-600 font-semibold text-sm shadow-lg shadow-rose-200 transition-all"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>{translations.generateSimilar}</span>
                </button>
                {(selectedItem.result_url || selectedItem.imageUrl) && (
                  <div className="relative inline-block text-left" ref={downloadMenuRef}>
                    <button
                      onClick={() => setIsDownloadMenuOpen(!isDownloadMenuOpen)}
                      className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      title={translations.download}
                    >
                      <Download className="w-5 h-5 text-gray-600" />
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDownloadMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isDownloadMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-32 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-10 overflow-hidden">
                        <button
                          onClick={() => handleDownload(selectedItem.result_url || selectedItem.imageUrl!, selectedItem.prompt, 'webp')}
                          className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors text-left font-medium"
                        >
                          WebP
                        </button>
                        <button
                          onClick={() => handleDownload(selectedItem.result_url || selectedItem.imageUrl!, selectedItem.prompt, 'png')}
                          className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors text-left font-medium"
                        >
                          PNG
                        </button>
                        <button
                          onClick={() => handleDownload(selectedItem.result_url || selectedItem.imageUrl!, selectedItem.prompt, 'jpeg')}
                          className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors text-left font-medium"
                        >
                          JPEG
                        </button>
                        <button
                          onClick={() => handleDownload(selectedItem.result_url || selectedItem.imageUrl!, selectedItem.prompt, 'ico')}
                          className="block w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-rose-600 transition-colors text-left font-medium"
                        >
                          ICO
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button
                  onClick={() => {
                    navigator.share?.({
                      title: "Lavie AI Artwork",
                      text: selectedItem.prompt,
                      url: window.location.href,
                    });
                  }}
                  className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  title={translations.share}
                >
                  <Share2 className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
