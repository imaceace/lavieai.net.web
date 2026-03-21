"use client";

interface AspectRatioOption {
  id: string;
  label: string;
  ratio: [number, number];
  icon: string;
}

const aspectRatios: AspectRatioOption[] = [
  { id: "1:1", label: "1:1", ratio: [1024, 1024], icon: "□" },
  { id: "16:9", label: "16:9", ratio: [1024, 576], icon: "▭" },
  { id: "9:16", label: "9:16", ratio: [576, 1024], icon: "▯" },
  { id: "4:3", label: "4:3", ratio: [1024, 768], icon: "▭" },
  { id: "3:4", label: "3:4", ratio: [768, 1024], icon: "▯" },
  { id: "21:9", label: "21:9", ratio: [1024, 438], icon: "▭" },
];

interface AspectRatioSelectorProps {
  value: [number, number];
  onChange: (resolution: [number, number]) => void;
}

export function AspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  const currentRatioId = aspectRatios.find(r => r.ratio[0] === value[0] && r.ratio[1] === value[1])?.id || "1:1";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
      <div className="flex flex-wrap gap-2">
        {aspectRatios.map((ratio) => (
          <button
            key={ratio.id}
            onClick={() => onChange(ratio.ratio)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border-2 transition-all ${
              currentRatioId === ratio.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span>{ratio.icon}</span>
            <span>{ratio.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
