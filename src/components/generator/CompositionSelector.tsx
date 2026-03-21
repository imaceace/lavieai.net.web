"use client";

interface CompositionOption {
  id: string;
  name: string;
  icon: string;
}

const compositionOptions: CompositionOption[] = [
  { id: "none", name: "Auto", icon: "○" },
  { id: "centered", name: "Centered", icon: "⊕" },
  { id: "rule-of-thirds", name: "Rule of Thirds", icon: "╔" },
  { id: "symmetrical", name: "Symmetrical", icon: "⧉" },
  { id: "diagonal", name: "Diagonal", icon: "╱" },
  { id: "spiral", name: "Spiral", icon: "🌀" },
  { id: "frame", name: "Framed", icon: "▢" },
  { id: "leading-lines", name: "Leading Lines", icon: "→" },
];

interface CompositionSelectorProps {
  value: string | null;
  onChange: (compositionId: string | null) => void;
}

export function CompositionSelector({ value, onChange }: CompositionSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Composition</label>
      <div className="flex flex-wrap gap-2">
        {compositionOptions.map((comp) => (
          <button
            key={comp.id}
            onClick={() => onChange(comp.id === "none" ? null : comp.id)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border-2 transition-all ${
              (value === null && comp.id === "none") || value === comp.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span>{comp.icon}</span>
            <span>{comp.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
