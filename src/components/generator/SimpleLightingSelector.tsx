"use client";

interface LightingSelectorProps {
  value: string | null;
  onChange: (lightingId: string | null) => void;
}

const lightings = [
  { id: "soft", name: "Soft" },
  { id: "dramatic", name: "Dramatic" },
  { id: "golden-hour", name: "Golden Hour" },
  { id: "blue-hour", name: "Blue Hour" },
  { id: "studio", name: "Studio" },
  { id: "natural", name: "Natural" },
  { id: "neon", name: "Neon" },
];

export function SimpleLightingSelector({ value, onChange }: LightingSelectorProps) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-3 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      <option value="">No Lighting</option>
      {lightings.map((light) => (
        <option key={light.id} value={light.id}>
          {light.name}
        </option>
      ))}
    </select>
  );
}
