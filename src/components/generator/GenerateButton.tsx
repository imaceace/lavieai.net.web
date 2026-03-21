"use client";

import { Loader2 } from "lucide-react";

interface GenerateButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  pointsCost?: number;
  points?: number;
}

export function GenerateButton({
  onClick,
  isLoading = false,
  disabled = false,
  pointsCost = 10,
  points = 0,
}: GenerateButtonProps) {
  const hasEnoughPoints = points >= pointsCost;
  const isDisabled = disabled || isLoading || !hasEnoughPoints;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`w-full px-6 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-3 ${
        isDisabled
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
      }`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span>Generate</span>
          <span className="ml-auto px-2 py-0.5 bg-white/20 rounded text-sm">
            {pointsCost} points
          </span>
        </>
      )}
    </button>
  );
}
