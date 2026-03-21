"use client";

import { useState } from "react";
import { Image, Sparkles } from "lucide-react";

interface UseCase {
  id: string;
  name: string;
  icon: string;
}

interface GalleryItem {
  id: string;
  prompt: string;
  style: string;
  useCase: string;
  imageUrl?: string;
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

const galleryItems: GalleryItem[] = [
  { id: "1", prompt: "Professional LinkedIn profile photo, corporate headshot style", style: "portrait", useCase: "avatar" },
  { id: "2", prompt: "Stunning desktop wallpaper, serene mountain lake at sunset", style: "landscape", useCase: "wallpaper" },
  { id: "3", prompt: "Instagram post for fashion brand, elegant dress editorial", style: "fashion", useCase: "social" },
  { id: "4", prompt: "Product photography for cosmetics brand, minimalist setup", style: "commercial", useCase: "product" },
  { id: "5", prompt: "Facebook ad banner for tech startup, modern design", style: "ui-design", useCase: "marketing" },
  { id: "6", prompt: "Fantasy novel book cover, epic dragon battle scene", style: "fantasy", useCase: "book" },
  { id: "7", prompt: "Game character concept art, warrior princess with sword", style: "illustration", useCase: "game" },
  { id: "8", prompt: "Mobile wallpaper, abstract geometric patterns, dark theme", style: "minimalist", useCase: "wallpaper" },
  { id: "9", prompt: "Twitter header image for creative agency portfolio", style: "illustration", useCase: "social" },
  { id: "10", prompt: "E-commerce listing image for handmade jewelry", style: "ecommerce", useCase: "product" },
  { id: "11", prompt: "YouTube thumbnail, dramatic reaction expression", style: "portrait", useCase: "marketing" },
  { id: "12", prompt: "E-book cover for romance novel, moody atmosphere", style: "oil-painting", useCase: "book" },
  { id: "13", prompt: "Game asset, cute forest creature sprite sheet", style: "pixel-art", useCase: "game" },
  { id: "14", prompt: "WhatsApp status image for business promotion", style: "typography", useCase: "marketing" },
  { id: "15", prompt: "Discord server icon, gaming community logo", style: "logo", useCase: "social" },
  { id: "16", prompt: "Phone case design mockup, floral pattern", style: "floral", useCase: "product" },
];

interface GalleryShowcaseProps {
  onUsePrompt: (prompt: string) => void;
}

export function GalleryShowcase({ onUsePrompt }: GalleryShowcaseProps) {
  const [activeUseCase, setActiveUseCase] = useState("all");

  const filteredItems = activeUseCase === "all"
    ? galleryItems
    : galleryItems.filter(item => item.useCase === activeUseCase);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Image className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold">Gallery</h3>
        <span className="text-sm text-gray-500">See what you can create</span>
      </div>

      {/* Use Case filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {useCases.map((uc) => (
          <button
            key={uc.id}
            onClick={() => setActiveUseCase(uc.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${
              activeUseCase === uc.id
                ? "bg-indigo-100 text-indigo-700 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>{uc.icon}</span>
            <span>{uc.name}</span>
          </button>
        ))}
      </div>

      {/* Gallery grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer aspect-square"
            onClick={() => onUsePrompt(item.prompt)}
          >
            {/* Placeholder image */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100">
              <span className="text-4xl opacity-50">
                {item.style === "portrait" && "👤"}
                {item.style === "landscape" && "🏔️"}
                {item.style === "fashion" && "👗"}
                {item.style === "commercial" && "📺"}
                {item.style === "ui-design" && "📱"}
                {item.style === "fantasy" && "🧙"}
                {item.style === "illustration" && "✍️"}
                {item.style === "minimalist" && "◼️"}
                {item.style === "typography" && "🔤"}
                {item.style === "pixel-art" && "👾"}
                {item.style === "oil-painting" && "🖼️"}
                {item.style === "floral" && "🌸"}
                {item.style === "logo" && "🔵"}
                {item.style === "ecommerce" && "🛒"}
              </span>
            </div>

            {/* Use case badge */}
            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 rounded-full">
              <span className="text-xs text-white">
                {useCases.find(uc => uc.id === item.useCase)?.icon}{" "}
                {useCases.find(uc => uc.id === item.useCase)?.name}
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
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items found for this category
        </div>
      )}
    </div>
  );
}
