"use client";

import { useEffect, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useTurnstileStore } from "@/stores/turnstileStore";
import { Shield, X } from "lucide-react";
import { useTranslations } from "next-intl";

// Use Cloudflare's public testing key if no real key is provided
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

export function TurnstileChallengeModal() {
  const { isOpen, closeModal, resolvePromise } = useTurnstileStore();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  const handleSuccess = (token: string) => {
    if (resolvePromise) {
      resolvePromise(token);
      
      // Close modal after a slight delay to show the green checkmark
      setTimeout(() => {
        useTurnstileStore.setState({
          isOpen: false,
          resolvePromise: null,
          rejectPromise: null,
        });
      }, 500);
    }
  };

  const handleError = () => {
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200"
      >
        <button
          onClick={closeModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Security Check</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We noticed some unusual activity. Please verify you are human to continue.
          </p>
        </div>

        <div className="flex justify-center min-h-[65px]">
          <Turnstile
            siteKey={SITE_KEY}
            onSuccess={handleSuccess}
            onError={handleError}
            options={{
              theme: "auto",
            }}
          />
        </div>
      </div>
    </div>
  );
}