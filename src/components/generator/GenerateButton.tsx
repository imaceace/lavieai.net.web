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
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full sm:w-auto px-8 py-3 rounded-lg font-medium text-white transition-all flex items-center justify-center gap-2 ${
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
            Generate
          </>
        )}
      </button>

      {/* Points info */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-gray-600">
          Cost: <span className="font-medium text-indigo-600">{pointsCost}</span> points
        </span>
        {points > 0 && (
          <span className={`${hasEnoughPoints ? "text-gray-600" : "text-red-600"}`}>
            Balance: <span className="font-medium">{points}</span> points
            {!hasEnoughPoints && (
              <span className="ml-2">
                (<Link href="/pricing" className="underline">Need more</Link>)
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
