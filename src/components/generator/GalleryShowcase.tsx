"use client";

import { useState, useEffect } from "react";
import { Image } from "lucide-react";
import Link from "next/link";
import { galleryApi } from "@/lib/api-client";

interface GalleryItem {
  id: string;
  prompt: string;
  style: string | null;
  use_case: string | null;
  result_url?: string;
  thumbnail_url?: string;
  image_url?: string;
  recommended_level?: number;
}

const styleEmojis: Record<string, string> = {
  portrait: "👤", landscape: "🏔️", anime: "🎌", cyberpunk: "🌃",
  fantasy: "🧙", "oil-painting": "🖼️", watercolor: "🎨", sketch: "✏️",
  "3d-render": "🎲", "3d-model": "🎲", "pixel-art": "👾", minimalist: "◼️",
  ukiyoe: "🏯", food: "🍕", pet: "🐱", floral: "🌸",
  interior: "🏠", fashion: "👗", commercial: "📺", macro: "🔬",
  film: "🎞️", illustration: "✍️", "ui-design": "📱", logo: "🔵",
  cover: "📔", ecommerce: "🛒", packaging: "📦", typography: "🔤",
  product: "📦", photographic: "📷", "fantasy-art": "✦", "comic-book": "▤",
};

const styleLabels: Record<string, string> = {
  portrait: "Portrait", landscape: "Landscape", anime: "Anime", cyberpunk: "Cyberpunk",
  fantasy: "Fantasy", "oil-painting": "Oil Painting", watercolor: "Watercolor", sketch: "Sketch",
  "3d-render": "3D Render", "3d-model": "3D", "pixel-art": "Pixel Art", minimalist: "Minimalist",
  ukiyoe: "Ukiyo-e", food: "Food", pet: "Pet", floral: "Floral",
  interior: "Interior", fashion: "Fashion", commercial: "Commercial", macro: "Macro",
  film: "Film", illustration: "Illustration", "ui-design": "UI Design", logo: "Logo",
  cover: "Cover", ecommerce: "E-commerce", packaging: "Packaging", typography: "Typography",
  product: "Product", photographic: "Photographic", "fantasy-art": "Fantasy Art", "comic-book": "Comic",
};

interface GalleryShowcaseProps {
  onUsePrompt: (prompt: string) => void;
  sort?: string;
}

export function GalleryShowcase({ onUsePrompt, sort }: GalleryShowcaseProps) {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = sort === 'popular' ? { limit: 16, sort: 'popular' } : { limit: 16 };
    galleryApi.getRecommended(params)
      .then(data => {
        if (data.images && data.images.length > 0) {
          setGalleryItems(data.images);
        }
      })
      .catch(() => {
        // Use empty on error
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
          <h3 className="font-semibold" style={{ color: 'var(--gen-text)' }}>Gallery</h3>
          <span className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>See what you can create with Lavie AI</span>
        </div>
        <Link
          href="/gallery"
          className="text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
        >
          View More
          <span>→</span>
        </Link>
      </div>

      {/* Gallery grid - 4 columns on desktop */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-[var(--gen-button-bg)] rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            const maxRecommendedLevel = Math.max(0, ...galleryItems.map(i => i.recommended_level || 0));
            return galleryItems.map((item) => {
              const style = item.style || "illustration";
              const emoji = styleEmojis[style] || "🎨";
              const label = styleLabels[style] || style;
              const imageUrl = item.result_url || item.thumbnail_url || item.image_url;
              
              const isPopular = (item.recommended_level || 0) === maxRecommendedLevel && maxRecommendedLevel > 0;

              return (
              <div
                key={item.id}
                className="group relative bg-[var(--gen-bg)] border border-[var(--gen-border)] rounded-xl overflow-hidden cursor-pointer aspect-square"
                onClick={() => onUsePrompt(item.prompt)}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={item.prompt}
                    title={item.prompt}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100">
                    <span className="text-4xl opacity-50">{emoji}</span>
                  </div>
                )}

                {/* Style & Popular badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full flex gap-1 items-center">
                  {isPopular && (
                    <>
                      <span className="text-xs font-medium text-amber-400">🔥 Popular</span>
                      <span className="text-xs text-white/50">|</span>
                    </>
                  )}
                  <span className="text-xs text-white">
                    {emoji} {label}
                  </span>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <p className="text-white text-xs text-center line-clamp-3">{item.prompt}</p>
                  <button
                    className="px-3 py-1.5 bg-indigo-600 rounded-lg text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Use Prompt
                  </button>
                </div>
              </div>
            );
          })})()}
        </div>
      )}

      {galleryItems.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          No featured items yet
        </div>
      )}
    </div>
  );
}
