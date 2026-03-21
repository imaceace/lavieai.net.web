"use client";

interface AspectRatioSelectorProps {
  value: [number, number];
  onChange: (resolution: [number, number]) => void;
}

const ratios = [
  { id: "1:1", label: "1:1", ratio: [1024, 1024] as [number, number] },
  { id: "16:9", label: "16:9", ratio: [1024, 576] as [number, number] },
  { id: "9:16", label: "9:16", ratio: [576, 1024] as [number, number] },
  { id: "4:3", label: "4:3", ratio: [1024, 768] as [number, number] },
  { id: "3:4", label: "3:4", ratio: [768, 1024] as [number, number] },
  { id: "21:9", label: "21:9", ratio: [1024, 438] as [number, number] },
];

export function SimpleAspectRatioSelector({ value, onChange }: AspectRatioSelectorProps) {
  const currentId = ratios.find(r => r.ratio[0] === value[0] && r.ratio[1] === value[1])?.id || "1:1";

  return (
    <select
      value={currentId}
      onChange={(e) => {
        const selected = ratios.find(r => r.id === e.target.value);
        if (selected) onChange(selected.ratio);
      }}
      className="px-3 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      {ratios.map((ratio) => (
        <option key={ratio.id} value={ratio.id}>
          {ratio.label}
        </option>
      ))}
    </select>
  );
}
