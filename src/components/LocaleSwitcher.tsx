"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "@/routing";
import { routing } from "@/routing";

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = e.target.value;
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  const currentLocale = routing.locales.find(
    (locale) => locale === "en" || locale === "zh"
  ) || "en";

  return (
    <div className="relative inline-block">
      <select
        value={currentLocale}
        onChange={switchLocale}
        disabled={isPending}
        className="appearance-none bg-transparent border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer disabled:opacity-50"
      >
        <option value="en">English</option>
        <option value="zh">简体中文</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
