"use client";

import { Link } from "@/routing";
import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { authApi } from "@/lib/api-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.lavieai.net';

export function Header() {
  const t = useTranslations("nav");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const { user, isLoggedIn, isLoading, setUser, setCredits, logout } = useUserStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setIsDarkMode(document.documentElement.classList.contains('dark'));
    
    // Listen for system theme changes if no local storage preference is set
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDarkMode(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    authApi.getMe().then((userData) => {
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar || "",
          subscription_type: (userData.tier || 'free') as any,
          credits: userData.credits,
          subscription_expire: userData.subscription_expire,
          created_at: userData.created_at,
        });
      } else {
        setUser(null);
      }
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      checkDailyBonus();
    } else {
      setCanClaimDaily(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkDailyBonus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/credits/daily`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      setCanClaimDaily(data.data?.can_claim === true);
    } catch {
      setCanClaimDaily(false);
    }
  };

  const handleClaimDaily = async () => {
    setClaimingDaily(true);
    try {
      const res = await fetch(`${API_BASE}/api/credits/daily`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setCredits(data.data?.new_balance ?? 0);
        setCanClaimDaily(false);
      } else {
        alert(data.message || 'Failed to claim daily credits');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to claim daily credits');
    } finally {
      setClaimingDaily(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogin = () => {
    const returnTo = window.location.href;
    window.location.href = `${API_BASE}/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const handleLogout = async () => {
    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/80"
      style={{
        background: isDarkMode ? 'rgba(15, 15, 15, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDarkMode ? '#262626' : '#e5e7eb'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              Lavie AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/gallery"
              className="text-sm font-medium transition-colors"
              style={{ color: isDarkMode ? '#9a948a' : '#6b7280' }}
            >
              {t("gallery")}
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium transition-colors"
              style={{ color: isDarkMode ? '#9a948a' : '#6b7280' }}
            >
              {t("pricing")}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                background: isDarkMode ? '#2a2520' : '#f3f4f6',
                color: isDarkMode ? '#e8e4df' : '#1f2937'
              }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {canClaimDaily && (
                  <button
                    onClick={handleClaimDaily}
                    disabled={claimingDaily}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-md shadow-rose-200/50 dark:shadow-rose-900/50 hover:opacity-90"
                    style={{
                      background: 'linear-gradient(90deg, #f43f5e, #f59e0b)',
                      color: '#fff',
                    }}
                    title="Claim your daily credits!"
                  >
                    {claimingDaily ? '...' : '🎁 Daily'}
                  </button>
                )}
                <div className="text-sm hidden sm:block">
                  <span style={{ color: isDarkMode ? '#e8e4df' : '#1f2937' }}>{user.credits}</span>
                  <span className="font-medium" style={{ color: '#8b5cf6' }}> pts</span>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium text-sm overflow-hidden ring-2 ring-transparent hover:ring-indigo-400 transition-all"
                    title={user.name || user.email}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-8 w-8 object-cover" />
                    ) : (
                      (user.name || user.email).charAt(0).toUpperCase()
                    )}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                      style={{ minWidth: '192px' }}>
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium truncate" style={{ color: isDarkMode ? '#e8e4df' : '#1f2937' }}>
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs truncate" style={{ color: isDarkMode ? '#9a948a' : '#6b7280' }}>
                          {user.credits} credits
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        style={{ color: isDarkMode ? '#e8e4df' : '#1f2937' }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t("profile")}
                      </Link>
                      <Link
                        href="/pricing"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        style={{ color: isDarkMode ? '#e8e4df' : '#1f2937' }}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {t("upgradePlan")}
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-700 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          style={{ color: '#ef4444' }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          {t("signOut")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="hidden sm:block text-sm font-medium"
                style={{ color: '#8b5cf6' }}
              >
                {t("login")}
              </button>
            )}

            <button
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t" style={{ borderColor: isDarkMode ? '#262626' : '#e5e7eb' }}>
            <div className="flex flex-col gap-3">
              <Link
                href="/gallery"
                className="text-sm font-medium"
                style={{ color: isDarkMode ? '#9a948a' : '#6b7280' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {t("gallery")}
              </Link>
              <Link
                href="/pricing"
                className="text-sm font-medium"
                style={{ color: isDarkMode ? '#9a948a' : '#6b7280' }}
                onClick={() => setIsMenuOpen(false)}
              >
                {t("pricing")}
              </Link>
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-sm font-medium"
                    style={{ color: '#8b5cf6' }}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t("profile")}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                    className="text-sm font-medium text-left"
                    style={{ color: '#ef4444' }}
                  >
                    {t("signOut")}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { handleLogin(); setIsMenuOpen(false); }}
                  className="text-sm font-medium text-left"
                  style={{ color: '#8b5cf6' }}
                >
                  {t("login")}
                </button>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
