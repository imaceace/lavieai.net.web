"use client";

import { X, Sparkles, Zap, Image as ImageIcon } from "lucide-react";
import { useEffect } from "react";
import { Link } from "@/routing";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function UpgradeModal({ isOpen, onClose, title, subtitle }: UpgradeModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-stone-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Decorative background */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 pointer-events-none" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>

        <div className="relative p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-400 to-amber-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200 dark:shadow-rose-900/20 rotate-3">
            <Sparkles className="w-8 h-8 text-white -rotate-3" />
          </div>

          <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent mb-3">
            {title || "Upgrade to Premium"}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">
            {subtitle || "Unlock high-resolution generation and premium features."}
          </p>

          <div className="space-y-4 mb-8 text-left">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Up to 4K Ultra Resolution</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">5x Faster Generation Speed</span>
            </div>
          </div>

          <Link
            href="/pricing"
            onClick={onClose}
            className="block w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(90deg, #f43f5e, #f59e0b)',
              backgroundSize: '200% 200%'
            }}
          >
            View Pricing Plans
          </Link>
          
          <button 
            onClick={onClose}
            className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
