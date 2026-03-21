"use client";

interface CompositionSelectorProps {
  value: string | null;
  onChange: (compositionId: string | null) => void;
}

const compositions = [
  { id: "centered", name: "Centered" },
  { id: "rule-of-thirds", name: "Rule of Thirds" },
  { id: "symmetrical", name: "Symmetrical" },
  { id: "diagonal", name: "Diagonal" },
  { id: "spiral", name: "Spiral" },
  { id: "frame", name: "Framed" },
  { id: "leading-lines", name: "Leading Lines" },
];

export function SimpleCompositionSelector({ value, onChange }: CompositionSelectorProps) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-3 py-2.5 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
    >
      <option value="">Auto</option>
      {compositions.map((comp) => (
        <option key={comp.id} value={comp.id}>
          {comp.name}
        </option>
      ))}
    </select>
  );
}
