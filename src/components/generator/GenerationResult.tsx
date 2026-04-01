"use client";

import { Download, Share2, RotateCcw, Check, X } from "lucide-react";

interface GenerationResultProps {
  imageUrl: string;
  prompt: string;
  style?: string | null;
  width?: number;
  height?: number;
  onRegenerate?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onClose?: () => void;
}

export function GenerationResult({
  imageUrl,
  prompt,
  style,
  width = 1024,
  height = 1024,
  onRegenerate,
  onDownload,
  onShare,
  onClose,
}: GenerationResultProps) {
  const styleLabel = style ? style.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "AI Art";
  const imageAlt = prompt ? `${prompt.slice(0, 100)} - AI Generated ${styleLabel}` : "AI Generated Artwork";
  const imageTitle = `Generated with Lavie AI - ${styleLabel}`;

  return (
    <div className="space-y-4" itemScope itemType="https://schema.org/ImageObject">
      {/* Image preview */}
      <div className="relative rounded-lg overflow-hidden bg-[var(--gen-input-bg)]">
        <img
          src={imageUrl}
          alt={imageAlt}
          title={imageTitle}
          className="w-full h-auto"
          width={width}
          height={height}
          loading="eager"
          decoding="async"
          itemProp="image"
        />
        
        {/* Hidden meta for SEO */}
        <meta itemProp="name" content={prompt.slice(0, 100)} />
        <meta itemProp="description" content={prompt} />
        <meta itemProp="contentUrl" content={imageUrl} />
        <meta itemProp="width" content={String(width)} />
        <meta itemProp="height" content={String(height)} />

        {/* Watermark */}
        <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/30 px-2 py-1 rounded">
          LavieAI.net
        </div>

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-lg hover:bg-black/70 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* Prompt display */}
      <div className="bg-[var(--gen-input-bg)] rounded-lg p-3">
        <p className="text-sm line-clamp-2" style={{ color: 'var(--gen-text)' }}>{prompt}</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {onDownload && (
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors bg-[var(--gen-bg)] border-[var(--gen-border)] hover:bg-[var(--gen-button-hover)]"
            style={{ color: 'var(--gen-text)' }}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        )}
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg transition-colors bg-[var(--gen-bg)] border-[var(--gen-border)] hover:bg-[var(--gen-button-hover)]"
            style={{ color: 'var(--gen-text)' }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
          >
            <RotateCcw className="w-4 h-4" />
            Regenerate
          </button>
        )}
      </div>

      {/* Success message */}
      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
        <Check className="w-4 h-4" />
        Generation complete!
      </div>
    </div>
  );
}
