"use client";

import { Copy, Sparkles } from "lucide-react";

interface Example {
  id: string;
  prompt: string;
  imageUrl?: string;
  style?: string;
}

const examples: Example[] = [
  {
    id: "1",
    prompt: "A beautiful sunset over the ocean, golden hour lighting, cinematic composition, highly detailed",
    style: "landscape",
  },
  {
    id: "2",
    prompt: "An adorable fluffy cat playing with a ball of yarn, soft natural lighting, cute expression",
    style: "pet",
  },
  {
    id: "3",
    prompt: "Cyberpunk city at night, neon lights, rain reflections, futuristic atmosphere, detailed architecture",
    style: "cyberpunk",
  },
  {
    id: "4",
    prompt: "Japanese anime girl with long flowing hair, cherry blossoms background, vibrant colors, studio quality",
    style: "anime",
  },
  {
    id: "5",
    prompt: "A gourmet pizza with fresh ingredients, overhead shot, professional food photography, appetizing",
    style: "food",
  },
  {
    id: "6",
    prompt: "Fantasy wizard tower on a mountain peak, magical atmosphere, epic scale, detailed illustration",
    style: "fantasy",
  },
  {
    id: "7",
    prompt: "Modern minimalist living room, natural light, Scandinavian design, clean lines, interior design",
    style: "interior",
  },
  {
    id: "8",
    prompt: "Portrait photography of a person, dramatic lighting, black and white, moody atmosphere",
    style: "portrait",
  },
];

interface ExampleGalleryProps {
  onUsePrompt: (prompt: string) => void;
}

export function ExampleGallery({ onUsePrompt }: ExampleGalleryProps) {
  const handleCopy = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    // TODO: Show toast notification
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold">Examples</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {examples.map((example) => (
          <div
            key={example.id}
            className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square cursor-pointer"
            onClick={() => onUsePrompt(example.prompt)}
          >
            {/* Placeholder for actual images */}
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100">
              <span className="text-4xl">
                {example.style === "landscape" && "🌅"}
                {example.style === "pet" && "🐱"}
                {example.style === "cyberpunk" && "🌃"}
                {example.style === "anime" && "🎌"}
                {example.style === "food" && "🍕"}
                {example.style === "fantasy" && "🧙"}
                {example.style === "interior" && "🏠"}
                {example.style === "portrait" && "👤"}
              </span>
            </div>

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
              <p className="text-white text-xs text-center line-clamp-3">{example.prompt}</p>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(example.prompt);
                  }}
                  className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                  title="Copy prompt"
                >
                  <Copy className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUsePrompt(example.prompt);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 rounded-lg text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
