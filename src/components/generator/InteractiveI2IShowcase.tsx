"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { INTERACTIVE_I2I_CASES, InteractiveI2ICase } from '../../constants/useCases';
import { useUserStore } from '@/stores/userStore';

interface Props {
  onSelectUseCase: (useCase: InteractiveI2ICase) => void;
}

export function InteractiveI2IShowcase({ onSelectUseCase }: Props) {
  const t = useTranslations();
  const { user } = useUserStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const tabStripRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activeCase = INTERACTIVE_I2I_CASES[activeIndex];

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const TIER_WEIGHT: Record<string, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    max: 3,
    ultra: 4,
  };

  const getDescText = (item: InteractiveI2ICase) => {
    if (!item.descKey) return '';

    try {
      const translated = t(item.descKey as any);
      return translated && translated !== item.descKey ? translated : '';
    } catch {
      return '';
    }
  };

  const currentWeight = TIER_WEIGHT[(user?.tier || 'free').toLowerCase()] || 0;
  const activeDescText = getDescText(activeCase);

  const updateScrollState = () => {
    if (!tabStripRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = tabStripRef.current;
    setCanScrollPrev(scrollLeft > 8);
    setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 8);
  };

  useEffect(() => {
    const activeButton = tabButtonRefs.current[activeIndex];
    activeButton?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
    window.setTimeout(updateScrollState, 250);
  }, [activeIndex]);

  useEffect(() => {
    updateScrollState();

    const strip = tabStripRef.current;
    if (!strip) return;

    strip.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    return () => {
      strip.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, []);

  const scrollTabs = (direction: 'prev' | 'next') => {
    if (!tabStripRef.current) return;

    const delta = direction === 'next' ? 320 : -320;
    tabStripRef.current.scrollBy({
      left: delta,
      behavior: 'smooth',
    });
  };

  const renderTab = (item: InteractiveI2ICase, index: number) => {
    const isActive = index === activeIndex;
    const requiredWeight = TIER_WEIGHT[item.requiredTier || 'free'] || 0;
    const isLocked = requiredWeight > currentWeight;
    const descText = getDescText(item);

    return (
      <button
        key={item.id}
        ref={(el) => {
          tabButtonRefs.current[index] = el;
        }}
        onClick={() => {
          setActiveIndex(index);
          setSliderPosition(50); // Reset slider on change
        }}
        className={`group relative shrink-0 snap-start text-left transition-all duration-300 border rounded-2xl overflow-hidden w-[230px] sm:w-[250px] ${
          isActive 
            ? 'border-transparent shadow-xl scale-[1.01]'
            : 'border-[var(--gen-border)] hover:-translate-y-0.5 hover:shadow-lg'
        }`}
        style={{
          background: isActive ? 'linear-gradient(135deg, rgba(17,24,39,1), rgba(55,65,81,0.96))' : 'var(--gen-input-bg)',
          color: isActive ? '#ffffff' : 'var(--gen-text)',
        }}
      >
        {isLocked && (
          <div className="absolute top-3 right-3 z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            {item.requiredTier === 'basic' ? 'Creator' : item.requiredTier === 'ultra' ? 'Studio' : item.requiredTier === 'max' ? 'Max' : 'Pro'}
          </div>
        )}

        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={item.afterImage}
            alt={item.tabLabel}
            className={`w-full h-full object-cover transition-transform duration-500 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}
            draggable={false}
          />
          <div className={`absolute inset-0 ${isActive ? 'bg-gradient-to-t from-black/60 via-black/15 to-transparent' : 'bg-gradient-to-t from-black/45 via-black/10 to-transparent'}`} />
          {isActive && (
            <div className="absolute inset-0 ring-2 ring-white/60 ring-inset rounded-t-2xl" />
          )}
          <div className="absolute top-3 left-3 bg-black/60 text-white px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm">
            After Preview
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="m-0 p-0 text-sm font-bold text-white leading-tight drop-shadow-md">
              {item.tabLabel}
            </h3>
          </div>
        </div>

        <div className="p-3.5">
          {descText ? (
            <p
              className={`m-0 text-xs leading-5 ${isActive ? 'text-white/85' : 'text-gray-600 dark:text-gray-300'}`}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {descText}
            </p>
          ) : (
            <p className={`m-0 text-xs leading-5 ${isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
              Explore this before and after AI transformation.
            </p>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3"
            style={{ borderColor: 'var(--gen-border)', background: 'var(--gen-input-bg)', color: 'var(--gen-text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em]">Featured Effects</span>
          </div>
          <h3 className="text-xl md:text-2xl font-semibold" style={{ color: 'var(--gen-text)' }}>
            Explore Premium Before & After Styles
          </h3>
          <p className="text-sm md:text-base mt-2 max-w-2xl" style={{ color: 'var(--gen-text-muted)' }}>
            Swipe or use arrows to preview different before and after effects.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollTabs('prev')}
            disabled={!canScrollPrev}
            className="w-11 h-11 rounded-full border flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--gen-border)', color: 'var(--gen-text)', background: 'var(--gen-input-bg)' }}
            aria-label="Scroll left"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollTabs('next')}
            disabled={!canScrollNext}
            className="w-11 h-11 rounded-full border flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--gen-border)', color: 'var(--gen-text)', background: 'var(--gen-input-bg)' }}
            aria-label="Scroll right"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border p-3 md:p-4"
        style={{ borderColor: 'var(--gen-border)', background: 'linear-gradient(180deg, var(--gen-input-bg), rgba(255,255,255,0.02))' }}>
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--gen-text-muted)' }}>
              Choose a style
            </span>
            <span className="text-[11px] px-2 py-1 rounded-full border"
              style={{ borderColor: 'var(--gen-border)', color: 'var(--gen-text-muted)' }}>
              {INTERACTIVE_I2I_CASES.length} presets
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1.5">
            {INTERACTIVE_I2I_CASES.map((item, index) => (
              <button
                key={`dot-${item.id}`}
                type="button"
                onClick={() => {
                  setActiveIndex(index);
                  setSliderPosition(50);
                }}
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-6' : 'w-1.5'}`}
                style={{ background: index === activeIndex ? '#111827' : 'rgba(156,163,175,0.45)' }}
                aria-label={`Go to ${item.tabLabel}`}
              />
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-[var(--gen-input-bg)] to-transparent z-10 hidden md:block" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-[var(--gen-input-bg)] to-transparent z-10 hidden md:block" />
          <div
            ref={tabStripRef}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {INTERACTIVE_I2I_CASES.map((item, index) => renderTab(item, index))}
          </div>
        </div>
      </div>

      <div
        className="w-full relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:h-[720px]"
        style={{ minHeight: '400px', backgroundColor: 'var(--gen-input-bg)' }}
      >
        <div 
          ref={containerRef}
          className="absolute inset-0 select-none touch-none"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
        >
          {/* After Image (Background) */}
          <div className="absolute inset-0">
            <img 
              src={activeCase.afterImage} 
              alt="After" 
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

          {/* Before Image (Foreground, clipped) */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
          >
            <img 
              src={activeCase.beforeImage} 
              alt="Before" 
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>

          {/* Slider Handle */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
          >
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/40 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </div>
          </div>
          
          {/* Labels */}
          <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
            Before
          </div>
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
            After
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/45 text-white px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm pointer-events-none hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Drag the slider to compare
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
          <div className="rounded-3xl border border-white/15 bg-black/35 backdrop-blur-xl text-white p-4 md:p-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4 shadow-2xl">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.14em] bg-white/12 border border-white/10">
                  AI Showcase
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/10">
                  {activeIndex + 1} / {INTERACTIVE_I2I_CASES.length}
                </span>
                {activeCase.requiredTier && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-400/20 text-amber-100 border border-amber-300/20">
                    {activeCase.requiredTier === 'basic' ? 'Creator' : activeCase.requiredTier === 'ultra' ? 'Studio' : activeCase.requiredTier === 'max' ? 'Max' : 'Pro'}
                  </span>
                )}
              </div>
              <h3 className="text-xl md:text-2xl font-bold tracking-tight">
                {activeCase.tabLabel}
              </h3>
              <p className="mt-2 text-sm md:text-base text-white/80 max-w-xl leading-6">
                {activeDescText || 'Preview how Lavie AI transforms the original image into a polished stylized result while preserving the main subject.'}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-3">
              <div className="text-xs text-white/70">
                Use the slider to reveal the transformation quality.
              </div>
              <button 
                onClick={() => onSelectUseCase(activeCase)}
                className="px-6 md:px-8 py-3 rounded-full font-bold shadow-xl hover:scale-[1.02] transition-transform text-white"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b)' }}
              >
                {t(activeCase.actionButtonTextKey as any)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
