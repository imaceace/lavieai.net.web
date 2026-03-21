"use client";

import { Copy, Lightbulb } from "lucide-react";

interface RecommendedPrompt {
  id: string;
  prompt: string;
  category?: string;
}

const recommendedPrompts: RecommendedPrompt[] = [
  {
    id: "1",
    prompt: "Beautiful sunset over ocean, golden hour, dramatic clouds, cinematic lighting, highly detailed, 8k",
    category: "Landscape",
  },
  {
    id: "2",
    prompt: "Cute cat playing with ball of yarn, soft natural lighting, fluffy fur texture, adorable expression",
    category: "Pet",
  },
  {
    id: "3",
    prompt: "Cyberpunk city street, neon signs, rain puddles, futuristic vehicles, detailed architecture",
    category: "Urban",
  },
  {
    id: "4",
    prompt: "Anime girl with pink hair, school uniform, cherry blossom trees, summer vibe, vibrant colors",
    category: "Anime",
  },
  {
    id: "5",
    prompt: "Gourmet burger with cheese, fresh vegetables, secret sauce, overhead shot, food photography",
    category: "Food",
  },
];

interface RecommendedPromptsProps {
  onUsePrompt: (prompt: string) => void;
}

export function RecommendedPrompts({ onUsePrompt }: RecommendedPromptsProps) {
  const handleCopy = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    // TODO: Show toast notification
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold">Popular Prompts</h3>
      </div>

      <div className="space-y-3">
        {recommendedPrompts.map((item) => (
          <div
            key={item.id}
            className="bg-gray-50 rounded-lg p-4 group hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className="text-sm text-gray-700">{item.prompt}</p>
                {item.category && (
                  <span className="inline-block mt-1 text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                )}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(item.prompt)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy prompt"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUsePrompt(item.prompt)}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
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
