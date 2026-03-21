"use client";

import { useState } from "react";

interface UseCase {
  id: string;
  name: string;
  icon: string;
}

interface UseCaseSelectorProps {
  value: string | null;
  onChange: (useCaseId: string | null) => void;
  category?: "all" | "personal" | "business";
}

const personalUseCases: UseCase[] = [
  { id: "avatar", name: "Avatar", icon: "👤" },
  { id: "wallpaper", name: "Wallpaper", icon: "🖼️" },
  { id: "social", name: "Social Media", icon: "📱" },
  { id: "card", name: "Card", icon: "🎴" },
];

const businessUseCases: UseCase[] = [
  { id: "product", name: "Product Image", icon: "📦" },
  { id: "ad", name: "Ad Banner", icon: "📢" },
  { id: "marketing", name: "Marketing", icon: "📊" },
  { id: "ppt", name: "Presentation", icon: "📽️" },
  { id: "book", name: "Book Cover", icon: "📖" },
  { id: "comic", name: "Comic", icon: "💬" },
  { id: "game", name: "Game Asset", icon: "🎮" },
  { id: "business-card", name: "Business Card", icon: "💼" },
];

const categories = [
  { id: "all", label: "All" },
  { id: "personal", label: "Personal" },
  { id: "business", label: "Business" },
] as const;

export function UseCaseSelector({ value, onChange, category = "all" }: UseCaseSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]["id"]>("all");

  const getUseCases = () => {
    switch (activeCategory) {
      case "personal":
        return personalUseCases;
      case "business":
        return businessUseCases;
      default:
        return [...personalUseCases, ...businessUseCases];
    }
  };

  const useCases = getUseCases();

  return (
    <div className="space-y-4">
      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              activeCategory === cat.id
                ? "bg-indigo-100 text-indigo-700 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Use case grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Clear selection option */}
        <button
          onClick={() => onChange(null)}
          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
            value === null
              ? "border-indigo-500 bg-indigo-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <span className="text-2xl">✨</span>
          <span className="text-xs">None</span>
        </button>

        {useCases.map((useCase) => (
          <button
            key={useCase.id}
            onClick={() => onChange(useCase.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              value === useCase.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300 hover:scale-105"
            }`}
          >
            <span className="text-2xl">{useCase.icon}</span>
            <span className="text-xs text-center leading-tight">{useCase.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
