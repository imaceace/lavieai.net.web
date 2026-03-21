"use client";

interface LightingOption {
  id: string;
  name: string;
  icon: string;
}

const lightingOptions: LightingOption[] = [
  { id: "none", name: "No Lighting", icon: "○" },
  { id: "soft", name: "Soft", icon: "☁️" },
  { id: "dramatic", name: "Dramatic", icon: "⚡" },
  { id: "golden-hour", name: "Golden Hour", icon: "🌅" },
  { id: "blue-hour", name: "Blue Hour", icon: "🌌" },
  { id: "studio", name: "Studio", icon: "💡" },
  { id: "natural", name: "Natural", icon: "☀️" },
  { id: "neon", name: "Neon", icon: "🪩" },
];

interface LightingSelectorProps {
  value: string | null;
  onChange: (lightingId: string | null) => void;
}

export function LightingSelector({ value, onChange }: LightingSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Lighting</label>
      <div className="flex flex-wrap gap-2">
        {lightingOptions.map((lighting) => (
          <button
            key={lighting.id}
            onClick={() => onChange(lighting.id === "none" ? null : lighting.id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border-2 transition-all ${
              (value === null && lighting.id === "none") || value === lighting.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span>{lighting.icon}</span>
            <span>{lighting.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
