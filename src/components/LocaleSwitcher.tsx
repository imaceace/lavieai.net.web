"use client";

import { usePathname } from "@/routing";
import { useLocale } from "next-intl";

export function LocaleSwitcher() {
  const pathname = usePathname();
  const currentLocale = useLocale();

  function switchLocale(e: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = e.target.value;
    
    // IMPORTANT: When switching back to the default locale ('en') which has no prefix (localePrefix: 'as-needed'),
    // next-intl middleware might read the old NEXT_LOCALE cookie and redirect us back to the old language!
    // So we must manually update the cookie before redirecting.
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Since localePrefix is 'as-needed', 'en' doesn't need a prefix.
    const prefix = nextLocale === 'en' ? '' : `/${nextLocale}`;
    
    // pathname from usePathname() in next-intl already strips the locale prefix
    // So if we are on /it/gallery/123, pathname is just /gallery/123
    const newPath = `${prefix}${pathname === '/' ? '' : pathname}`;
    
    // Use window.location.origin to create an absolute URL.
    const absoluteUrl = `${window.location.origin}${newPath || '/'}`;
    window.location.href = absoluteUrl;
  }

  return (
    <div className="relative inline-block">
      <select
        value={currentLocale}
        onChange={switchLocale}
        className="appearance-none bg-transparent border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-1.5 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer disabled:opacity-50"
      >
        <option value="en">English</option>
        <option value="zh">简体中文</option>
        <option value="fr">Français</option>
        <option value="it">Italiano</option>
        <option value="de">Deutsch</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
}
