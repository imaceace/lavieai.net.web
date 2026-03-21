"use client";

import { useState, useEffect } from "react";
import { Search, Copy, Sparkles, X, Download, Share2, Loader2 } from "lucide-react";

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
}

interface UseCase {
  id: string;
  name: string;
  icon: string;
}

const useCases: UseCase[] = [
  { id: "all", name: "All", icon: "✨" },
  { id: "avatar", name: "Avatar", icon: "👤" },
  { id: "wallpaper", name: "Wallpaper", icon: "🖼️" },
  { id: "social", name: "Social Media", icon: "📱" },
  { id: "product", name: "Product", icon: "📦" },
  { id: "marketing", name: "Marketing", icon: "📊" },
  { id: "book", name: "Book Cover", icon: "📖" },
  { id: "game", name: "Game", icon: "🎮" },
];

const styleEmojis: Record<string, string> = {
  portrait: "👤",
  landscape: "🏔️",
  anime: "🎌",
  cyberpunk: "🌃",
  fantasy: "🧙",
  "oil-painting": "🖼️",
  watercolor: "🎨",
  sketch: "✏️",
  "3d-render": "🎲",
  "pixel-art": "👾",
  minimalist: "◼️",
  ukiyoe: "🏯",
  "black-white": "⬛",
  food: "🍕",
  pet: "🐱",
  floral: "🌸",
  interior: "🏠",
  fashion: "👗",
  commercial: "📺",
  macro: "🔬",
  film: "🎞️",
  illustration: "✍️",
  "ui-design": "📱",
  logo: "🔵",
  cover: "📔",
  ecommerce: "🛒",
  packaging: "📦",
  typography: "🔤",
  product: "📦",
};

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function GalleryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUseCase, setSelectedUseCase] = useState("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch gallery items from API
  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (selectedUseCase !== "all") {
          params.set("type", selectedUseCase); // API uses 'type' for use case
        }
        const res = await fetch(`/api/gallery?${params}`);
        const data = await res.json();
        if (data.success) {
          setGalleryItems(data.data || []);
        } else {
          setError("Failed to load gallery");
        }
      } catch (err) {
        console.error("Gallery fetch error:", err);
        setError("Failed to load gallery");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, [selectedUseCase]);

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
    // Navigate to home with prompt pre-filled
    window.location.href = `/?prompt=${encodeURIComponent(item.prompt)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-4">Gallery</h1>
          <p className="text-gray-600 text-center mb-8">
            Explore stunning AI-generated artwork from our community
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by prompt or style..."
                className="w-full pl-12 pr-4 py-3 border rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Use Case filter bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {useCases.map((uc) => (
              <button
                key={uc.id}
                onClick={() => setSelectedUseCase(uc.id)}
                className={`px-4 py-2 text-sm rounded-full whitespace-nowrap transition-colors ${
                  selectedUseCase === uc.id
                    ? "bg-indigo-100 text-indigo-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {uc.icon} {uc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading gallery...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-square bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {/* Image */}
                {(item.result_url || item.imageUrl) ? (
                  <img
                    src={item.result_url || item.imageUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100">
                    <span className="text-6xl">{styleEmojis[item.style || ""] || "🎨"}</span>
                  </div>
                )}

                {/* Use case badge */}
                {item.use_case && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full">
                    <span className="text-xs text-white">
                      {useCases.find((uc) => uc.id === item.use_case)?.icon}{" "}
                      {useCases.find((uc) => uc.id === item.use_case)?.name}
                    </span>
                  </div>
                )}

                {/* Style badge */}
                {item.style && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/80 rounded-full">
                    <span className="text-xs text-gray-700">{styleEmojis[item.style] || item.style}</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                  <p className="text-white text-sm text-center line-clamp-3">{item.prompt}</p>
                  <div className="flex items-center gap-2 text-white text-xs">
                    {item.user_name && <span>by {item.user_name}</span>}
                    {item.likes !== undefined && (
                      <>
                        <span>•</span>
                        <span>❤️ {item.likes}</span>
                      </>
                    )}
                    {item.created_at && (
                      <>
                        <span>•</span>
                        <span>{formatTimeAgo(item.created_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">Image Details</h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4">
              {/* Image */}
              <div className="aspect-square bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                {(selectedItem.result_url || selectedItem.imageUrl) ? (
                  <img
                    src={selectedItem.result_url || selectedItem.imageUrl}
                    alt={selectedItem.prompt}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-8xl">{styleEmojis[selectedItem.style || ""] || "🎨"}</span>
                )}
              </div>

              {/* Prompt */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-600 mb-2 block">Prompt</label>
                <div className="bg-gray-50 rounded-lg p-4 flex items-start justify-between gap-4">
                  <p className="text-sm flex-1">{selectedItem.prompt}</p>
                  <button
                    onClick={() => handleCopyPrompt(selectedItem.prompt)}
                    className="p-2 hover:bg-gray-200 rounded-lg shrink-0"
                    title="Copy prompt"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {selectedItem.style && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Style</label>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {styleEmojis[selectedItem.style]} {selectedItem.style}
                    </span>
                  </div>
                )}
                {selectedItem.use_case && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Use Case</label>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {useCases.find((uc) => uc.id === selectedItem.use_case)?.icon}{" "}
                      {useCases.find((uc) => uc.id === selectedItem.use_case)?.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleGenerateSimilar(selectedItem)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate Similar
                </button>
                {(selectedItem.result_url || selectedItem.imageUrl) && (
                  <a
                    href={selectedItem.result_url || selectedItem.imageUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
                <button
                  onClick={() => {
                    navigator.share?.({
                      title: "Lavie AI Artwork",
                      text: selectedItem.prompt,
                      url: window.location.href,
                    });
                  }}
                  className="p-3 border rounded-lg hover:bg-gray-50"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}