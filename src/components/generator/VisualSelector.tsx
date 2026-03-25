"use client";

interface VisualOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface VisualSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: VisualOption[];
  placeholder?: string;
}

export function VisualSelector({ value, onChange, options, placeholder }: VisualSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              if (isSelected) {
                onChange(null);
              } else {
                onChange(option.id);
              }
            }}
            className="px-2 py-1.5 text-xs rounded-full flex items-center gap-1 transition-all whitespace-nowrap"
            style={{
              background: isSelected
                ? 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(16,185,129,0.2))'
                : 'var(--gen-button-bg)',
              border: isSelected ? '1px solid #f59e0b' : '1px solid var(--gen-border)',
              color: isSelected ? '#f59e0b' : 'var(--gen-text-muted)',
            }}
          >
            {option.icon && <span className="text-[10px]">{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
