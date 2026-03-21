"use client";

import { useState } from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PromptInput({ value, onChange, placeholder }: PromptInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder || "Describe your image... e.g., A beautiful sunset over the ocean, golden hour lighting"}
        className={`w-full h-32 px-4 py-3 border rounded-lg resize-none transition-all ${
          isFocused
            ? "border-indigo-500 ring-2 ring-indigo-500/20"
            : "border-gray-300 hover:border-gray-400"
        }`}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <div className="mt-2 text-xs text-gray-500 flex justify-between">
        <span>{value.length}/1000 characters</span>
        <span className="hidden sm:inline">Tip: Be specific for better results</span>
      </div>
    </div>
  );
}
