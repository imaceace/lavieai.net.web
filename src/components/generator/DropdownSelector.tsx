"use client";

import { useState, useRef, useEffect } from "react";

interface DropdownOption {
  id: string;
  label: string;
}

interface DropdownSelectorProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: DropdownOption[];
  placeholder: string;
}

export function DropdownSelector({ value, onChange, options, placeholder }: DropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-full border border-[#3a3530]/30 bg-[#2a2520]/10 text-[#9a948a]/60 hover:bg-[#2a2520]/90 flex items-center gap-1 min-w-[80px]"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 opacity-60 transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#2a2520] border border-[#3a3530]/50 rounded-lg shadow-xl py-1 min-w-[120px] max-h-[200px] overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setIsOpen(false);
            }}
            className="w-full px-3 py-2 text-left text-xs text-[#9a948a] hover:bg-[#3a3530]/50 transition-colors"
          >
            {placeholder}
          </button>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left text-xs hover:bg-[#3a3530]/50 transition-colors ${
                value === option.id ? 'text-[#ca8a04]' : 'text-[#e8e4df]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
