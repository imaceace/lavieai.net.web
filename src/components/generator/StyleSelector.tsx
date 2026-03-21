"use client";

import { useState } from "react";

interface Style {
  id: string;
  name: string;
  icon: string;
}

interface StyleSelectorProps {
  value: string | null;
  onChange: (styleId: string | null) => void;
  category?: "all" | "art" | "photo" | "design";
}

const artStyles: Style[] = [
  { id: "photorealistic", name: "Photorealistic", icon: "📷" },
  { id: "anime", name: "Anime", icon: "🎌" },
  { id: "oil-painting", name: "Oil Painting", icon: "🖼️" },
  { id: "watercolor", name: "Watercolor", icon: "🎨" },
  { id: "sketch", name: "Sketch", icon: "✏️" },
  { id: "3d-render", name: "3D Render", icon: "🎲" },
  { id: "pixel-art", name: "Pixel Art", icon: "👾" },
  { id: "cyberpunk", name: "Cyberpunk", icon: "🤖" },
  { id: "fantasy", name: "Fantasy", icon: "🧙" },
  { id: "ukiyo-e", name: "Ukiyo-e", icon: "🏯" },
  { id: "chinese-style", name: "Chinese Style", icon: "🐉" },
  { id: "minimalist", name: "Minimalist", icon: "◼️" },
];

const photoStyles: Style[] = [
  { id: "portrait", name: "Portrait", icon: "👤" },
  { id: "landscape", name: "Landscape", icon: "🏔️" },
  { id: "architecture", name: "Architecture", icon: "🏛️" },
  { id: "interior", name: "Interior", icon: "🏠" },
  { id: "fashion", name: "Fashion", icon: "👗" },
  { id: "commercial", name: "Commercial", icon: "📺" },
  { id: "food", name: "Food", icon: "🍜" },
  { id: "pet", name: "Pet", icon: "🐱" },
  { id: "floral", name: "Floral", icon: "🌸" },
  { id: "bw", name: "Black & White", icon: "⬛" },
  { id: "film", name: "Film", icon: "📽️" },
  { id: "macro", name: "Macro", icon: "🔬" },
];

const designStyles: Style[] = [
  { id: "illustration", name: "Illustration", icon: "✍️" },
  { id: "poster", name: "Poster", icon: "📋" },
  { id: "ui-design", name: "UI Design", icon: "📱" },
  { id: "logo", name: "Logo", icon: "🔵" },
  { id: "cover", name: "Cover", icon: "📔" },
  { id: "ecommerce", name: "E-commerce", icon: "🛒" },
  { id: "packaging", name: "Packaging", icon: "📦" },
  { id: "typography", name: "Typography", icon: "🔤" },
];

const categories = [
  { id: "all", label: "All" },
  { id: "art", label: "Art" },
  { id: "photo", label: "Photo" },
  { id: "design", label: "Design" },
] as const;

export function StyleSelector({ value, onChange, category = "all" }: StyleSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]["id"]>("all");

  const getStyles = () => {
    switch (activeCategory) {
      case "art":
        return artStyles;
      case "photo":
        return photoStyles;
      case "design":
        return designStyles;
      default:
        return [...artStyles, ...photoStyles, ...designStyles];
    }
  };

  const styles = getStyles();

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

      {/* Style grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onChange(style.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              value === style.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300 hover:scale-105"
            }`}
          >
            <span className="text-2xl">{style.icon}</span>
            <span className="text-xs text-center leading-tight">{style.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
