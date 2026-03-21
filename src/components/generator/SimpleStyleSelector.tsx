"use client";

interface StyleSelectorProps {
  value: string | null;
  onChange: (styleId: string | null) => void;
}

const styles = [
  { id: "photorealistic", name: "Photorealistic" },
  { id: "anime", name: "Anime" },
  { id: "oil-painting", name: "Oil Painting" },
  { id: "watercolor", name: "Watercolor" },
  { id: "sketch", name: "Sketch" },
  { id: "3d-render", name: "3D Render" },
  { id: "pixel-art", name: "Pixel Art" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "fantasy", name: "Fantasy" },
  { id: "portrait", name: "Portrait" },
  { id: "landscape", name: "Landscape" },
  { id: "illustration", name: "Illustration" },
];

export function SimpleStyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-3 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      <option value="">No Style</option>
      {styles.map((style) => (
        <option key={style.id} value={style.id}>
          {style.name}
        </option>
      ))}
    </select>
  );
}
