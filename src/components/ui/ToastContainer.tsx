"use client";

import { useToast } from "@/hooks/useToast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-right-8 fade-in duration-300 pointer-events-auto max-w-sm w-full
            ${toast.type === "success" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800" : ""}
            ${toast.type === "error" ? "bg-red-50 text-red-900 dark:bg-red-950/80 dark:text-red-200 border border-red-200 dark:border-red-800" : ""}
            ${toast.type === "info" ? "bg-white text-gray-900 dark:bg-stone-900 dark:text-gray-100 border border-gray-200 dark:border-gray-800" : ""}
          `}
        >
          {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />}
          {toast.type === "info" && <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />}
          
          <p className="text-sm font-medium flex-1">{toast.message}</p>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors shrink-0"
          >
            <X className="w-4 h-4 opacity-70" />
          </button>
        </div>
      ))}
    </div>
  );
}
