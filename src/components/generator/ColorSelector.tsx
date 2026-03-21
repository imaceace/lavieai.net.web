"use client";

interface ColorOption {
  id: string;
  name: string;
  icon: string;
}

const colorOptions: ColorOption[] = [
  { id: "none", name: "No Color", icon: "○" },
  { id: "vibrant", name: "Vibrant", icon: "🌈" },
  { id: "muted", name: "Muted", icon: "🎨" },
  { id: "warm", name: "Warm", icon: "🔥" },
  { id: "cool", name: "Cool", icon: "❄️" },
  { id: "pastel", name: "Pastel", icon: "🌸" },
  { id: "monochrome", name: "Monochrome", icon: "⬛" },
  { id: "neon", name: "Neon", icon: "💡" },
];

interface ColorSelectorProps {
  value: string | null;
  onChange: (colorId: string | null) => void;
}

export function ColorSelector({ value, onChange }: ColorSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Color</label>
      <div className="flex flex-wrap gap-2">
        {colorOptions.map((color) => (
          <button
            key={color.id}
            onClick={() => onChange(color.id === "none" ? null : color.id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border-2 transition-all ${
              (value === null && color.id === "none") || value === color.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span>{color.icon}</span>
            <span>{color.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
