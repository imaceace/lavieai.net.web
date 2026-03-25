"use client";

interface RatioOption {
  id: string;
  label: string;
  aspectRatio: number;
}

interface RatioSelectorProps {
  value: [number, number];
  onChange: (resolution: [number, number]) => void;
}

const ratioOptions: RatioOption[] = [
  { id: "1:1", label: "1:1", aspectRatio: 1 },
  { id: "16:9", label: "16:9", aspectRatio: 16/9 },
  { id: "9:16", label: "9:16", aspectRatio: 9/16 },
  { id: "4:3", label: "4:3", aspectRatio: 4/3 },
  { id: "3:4", label: "3:4", aspectRatio: 3/4 },
  { id: "21:9", label: "21:9", aspectRatio: 21/9 },
];

const resolutionMap: Record<string, [number, number]> = {
  "1:1": [1024, 1024],
  "16:9": [1344, 756],
  "9:16": [768, 1344],
  "4:3": [1152, 864],
  "3:4": [896, 1152],
  "21:9": [1536, 640],
};

export function RatioSelector({ value, onChange }: RatioSelectorProps) {
  const currentAspect = value[0] / value[1];

  const getSelectedId = () => {
    for (const r of ratioOptions) {
      if (Math.abs(r.aspectRatio - currentAspect) < 0.01) {
        return r.id;
      }
    }
    return "1:1";
  };

  const selectedId = getSelectedId();

  return (
    <div className="flex items-center gap-1">
      {ratioOptions.map((option) => {
        const isSelected = option.id === selectedId;
        const maxSize = 28;
        const boxWidth = option.aspectRatio >= 1 ? maxSize : Math.round(maxSize * option.aspectRatio);
        const boxHeight = option.aspectRatio >= 1 ? Math.round(maxSize / option.aspectRatio) : maxSize;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(resolutionMap[option.id])}
            className="w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all"
            style={{
              background: isSelected
                ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(16,185,129,0.2))'
                : 'var(--gen-button-bg)',
              border: isSelected ? '1px solid #f59e0b' : '1px solid var(--gen-border)',
            }}
            title={`${option.label} (${resolutionMap[option.id].join('×')})`}
          >
            <div
              className="rounded-sm"
              style={{
                width: boxWidth,
                height: boxHeight,
                background: isSelected ? '#f59e0b' : 'var(--gen-text-muted)',
                opacity: isSelected ? 1 : 0.5,
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
