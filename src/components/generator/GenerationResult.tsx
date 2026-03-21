"use client";

import { Download, Share2, RotateCcw, Check, X } from "lucide-react";

interface GenerationResultProps {
  imageUrl: string;
  prompt: string;
  onRegenerate?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onClose?: () => void;
}

export function GenerationResult({
  imageUrl,
  prompt,
  onRegenerate,
  onDownload,
  onShare,
  onClose,
}: GenerationResultProps) {
  return (
    <div className="space-y-4">
      {/* Image preview */}
      <div className="relative rounded-lg overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt="Generated result"
          className="w-full h-auto"
        />

        {/* Watermark for free users */}
        <div className="absolute bottom-2 right-2 text-xs text-white/60 bg-black/30 px-2 py-1 rounded">
          Lavie AI
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Prompt display */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-700 line-clamp-2">{prompt}</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Regenerate
          </button>
        )}
      </div>

      {/* Success message */}
      <div className="flex items-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        Generation complete!
      </div>
    </div>
  );
}
