"use client";

interface ColorSelectorProps {
  value: string | null;
  onChange: (colorId: string | null) => void;
}

const colors = [
  { id: "vibrant", name: "Vibrant" },
  { id: "muted", name: "Muted" },
  { id: "warm", name: "Warm" },
  { id: "cool", name: "Cool" },
  { id: "pastel", name: "Pastel" },
  { id: "monochrome", name: "Monochrome" },
  { id: "neon", name: "Neon" },
];

export function SimpleColorSelector({ value, onChange }: ColorSelectorProps) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-3 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      <option value="">No Color</option>
      {colors.map((color) => (
        <option key={color.id} value={color.id}>
          {color.name}
        </option>
      ))}
    </select>
  );
}
