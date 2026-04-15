"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { INTERACTIVE_I2I_CASES, InteractiveI2ICase } from '../../constants/useCases';
import { useUserStore } from '@/stores/userStore';

interface Props {
  onSelectUseCase: (useCase: InteractiveI2ICase) => void;
}

const TOP_IDS = [
  'removeBackground',
  'sketchToReal',
  'turnIntoProfessionalPhoto',
  'upscaleImage',
] as const;

const LEFT_IDS = [
  'removeWatermark',
  'restorePhoto',
  'colorizePhoto',
  'turnIntoAnime',
] as const;

const RIGHT_IDS = [
  'ghibliStyle',
  'pixarStyle',
  'gtaStyle',
  'legoStyle',
] as const;

const BOTTOM_IDS = [
  'turnIntoCyborg',
  'pixelArt',
  'pencilSketch',
  'petRoyalPainting',
] as const;

const CLOCKWISE_IDS = [
  ...TOP_IDS,
  ...RIGHT_IDS,
  ...[...BOTTOM_IDS].reverse(),
  ...[...LEFT_IDS].reverse(),
] as const;

const POPULAR_IDS = new Set<string>([
  'removeBackground',
  'sketchToReal',
  'turnIntoProfessionalPhoto',
  'upscaleImage',
  'ghibliStyle',
  'pixarStyle',
]);

const AUTOPLAY_MS = 3200;

export function InteractiveI2IShowcase({ onSelectUseCase }: Props) {
  const t = useTranslations();
  const { user } = useUserStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const TIER_WEIGHT: Record<string, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    max: 3,
    ultra: 4,
  };

  const currentWeight = TIER_WEIGHT[(user?.tier || 'free').toLowerCase()] || 0;

  const caseMap = useMemo(
    () => new Map(INTERACTIVE_I2I_CASES.map((item, index) => [item.id, { item, index }])),
    []
  );

  const getCaseById = (id: string): InteractiveI2ICase | null => caseMap.get(id)?.item || null;

  const topCases = TOP_IDS.map(getCaseById).filter((item): item is InteractiveI2ICase => item !== null);
  const leftCases = LEFT_IDS.map(getCaseById).filter((item): item is InteractiveI2ICase => item !== null);
  const rightCases = RIGHT_IDS.map(getCaseById).filter((item): item is InteractiveI2ICase => item !== null);
  const bottomCases = BOTTOM_IDS.map(getCaseById).filter((item): item is InteractiveI2ICase => item !== null);
  const activeCase = INTERACTIVE_I2I_CASES[activeIndex];

  const getDescText = (item: InteractiveI2ICase) => {
    if (!item.descKey) return '';

    try {
      const translated = t(item.descKey as any);
      return translated && translated !== item.descKey ? translated : '';
    } catch {
      return '';
    }
  };

  const activeDescText = getDescText(activeCase);
  const activeBeforeObjectPosition =
    activeCase.beforeObjectPosition ||
    activeCase.heroObjectPosition ||
    'center';
  const activeAfterObjectPosition =
    activeCase.afterObjectPosition ||
    activeCase.heroObjectPosition ||
    'center';

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);

    update();
    media.addEventListener('change', update);

    return () => {
      media.removeEventListener('change', update);
    };
  }, []);

  const getNextClockwiseIndex = (currentIndex: number) => {
    const currentId = INTERACTIVE_I2I_CASES[currentIndex]?.id;
    const currentClockwiseIndex = CLOCKWISE_IDS.findIndex((id) => id === currentId);
    const nextId =
      currentClockwiseIndex === -1
        ? CLOCKWISE_IDS[0]
        : CLOCKWISE_IDS[(currentClockwiseIndex + 1) % CLOCKWISE_IDS.length];

    return caseMap.get(nextId)?.index ?? 0;
  };

  useEffect(() => {
    // Preload next clockwise images for smoother transitions
    const nextIndex = getNextClockwiseIndex(activeIndex);
    const nextCase = INTERACTIVE_I2I_CASES[nextIndex];
    if (nextCase) {
      const img1 = new Image();
      img1.src = nextCase.afterImage;
      const img2 = new Image();
      img2.src = nextCase.beforeImage;
    }
  }, [activeIndex]);

  useEffect(() => {
    if (!isDesktop || isDragging || isAutoplayPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((previous) => getNextClockwiseIndex(previous));
      setSliderPosition(50);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [isDesktop, isDragging, isAutoplayPaused]);

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

  const setActiveById = (id: string) => {
    const nextIndex = caseMap.get(id)?.index;
    if (typeof nextIndex !== 'number') return;
    setActiveIndex(nextIndex);
    setSliderPosition(50);
  };

  const renderCompactCard = (
    item: InteractiveI2ICase,
    orientation: 'edge' | 'rail' = 'edge'
  ) => {
    const mapped = caseMap.get(item.id);
    const index = mapped?.index ?? -1;
    const isActive = index === activeIndex;
    const requiredWeight = TIER_WEIGHT[item.requiredTier || 'free'] || 0;
    const isLocked = requiredWeight > currentWeight;
    const descText = getDescText(item);
    const isPopular = POPULAR_IDS.has(item.id);
    const thumbObjectPosition =
      item.thumbObjectPosition ||
      item.afterObjectPosition ||
      item.heroObjectPosition ||
      'center';

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => setActiveById(item.id)}
        className={`group relative overflow-hidden rounded-[20px] border text-left transition-all duration-500 z-10 ${
          orientation === 'rail'
            ? 'h-full min-h-[92px]'
            : 'h-full min-h-[112px]'
        } ${
          isActive
            ? 'shadow-[0_16px_40px_rgba(0,0,0,0.4)] scale-[1.03] ring-1 ring-white/30 z-20'
            : 'shadow-[0_8px_24px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.3)] hover:z-20'
        }`}
        style={{
          borderColor: isActive
            ? 'rgba(124, 58, 237, 0.85)'
            : isPopular
              ? 'rgba(245, 158, 11, 0.45)'
              : 'rgba(255, 255, 255, 0.08)',
          background: 'var(--gen-input-bg)',
        }}
      >
        <div className="absolute inset-0">
          <img
            src={item.afterImage}
            alt={item.tabLabel}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${isActive ? 'scale-105 blur-[1px]' : 'group-hover:scale-105 blur-[1px]'}`}
            style={{ objectPosition: thumbObjectPosition }}
            aria-hidden="true"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
          <img
            src={item.afterImage}
            alt={item.tabLabel}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ objectPosition: thumbObjectPosition }}
            draggable={false}
            loading="lazy"
            decoding="async"
          />
          <div className={`absolute inset-0 ${isActive ? 'bg-gradient-to-t from-black/62 via-black/20 to-black/8' : 'bg-gradient-to-t from-black/48 via-black/14 to-black/4'}`} />
        </div>

        <div className="relative z-10 h-full p-3 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/45 text-white backdrop-blur-sm">
                {orientation === 'rail' ? 'Quick Pick' : 'Effect'}
              </span>
              {isPopular && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-black">
                  Popular
                </span>
              )}
            </div>
            {isLocked && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {item.requiredTier === 'basic' ? 'Creator' : item.requiredTier === 'ultra' ? 'Studio' : item.requiredTier === 'max' ? 'Max' : 'Pro'}
              </span>
            )}
          </div>

          <div>
            <h3 className="m-0 text-sm font-bold leading-tight text-white drop-shadow-md">
              {item.tabLabel}
            </h3>
            {orientation === 'rail' && descText && (
              <p
                className="mt-1.5 mb-0 text-[11px] leading-4 text-white/82"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {descText}
              </p>
            )}
          </div>
        </div>

        {isActive && (
          <div className="absolute inset-0 ring-2 ring-white/65 ring-inset rounded-2xl pointer-events-none" />
        )}
      </button>
    );
  };

  return (
    <div
      className="space-y-5"
      onMouseEnter={() => setIsAutoplayPaused(true)}
      onMouseLeave={() => setIsAutoplayPaused(false)}
    >
      <div className="lg:hidden space-y-4">
        <div
          className="rounded-[28px] border p-3"
          style={{ borderColor: 'var(--gen-border)', background: 'var(--gen-input-bg)' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INTERACTIVE_I2I_CASES.map((item) => renderCompactCard(item, 'rail'))}
          </div>
        </div>

        <div
          className="w-full relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]"
          style={{ minHeight: '360px', backgroundColor: 'var(--gen-input-bg)' }}
        >
          <div
            ref={containerRef}
            className="absolute inset-0 select-none touch-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            <div className="absolute inset-0">
              <img
                src={activeCase.afterImage}
                alt="After"
                className="w-full h-full object-cover"
                style={{ objectPosition: activeAfterObjectPosition }}
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/12 to-transparent pointer-events-none" />
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
              <img
                src={activeCase.beforeImage}
                alt="Before"
                className="w-full h-full object-cover"
                style={{ objectPosition: activeBeforeObjectPosition }}
                draggable={false}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] pointer-events-none" />
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
              style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
              onMouseDown={() => setIsDragging(true)}
              onTouchStart={() => setIsDragging(true)}
            >
              <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/40 pointer-events-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </div>
            </div>
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
              Before
            </div>
            <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
              After
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-6 flex justify-center pointer-events-none">
            <button
              onClick={() => onSelectUseCase(activeCase)}
              className="px-6 py-3 rounded-full font-bold shadow-xl transition-transform text-white pointer-events-auto text-sm"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b)' }}
            >
              {t(activeCase.actionButtonTextKey as any)}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:block">
        <div
          className="rounded-[40px] border p-6"
          style={{
            borderColor: 'var(--gen-border)',
            background: 'linear-gradient(180deg, var(--gen-input-bg), rgba(255,255,255,0.02))',
          }}
        >
          <div className="grid grid-cols-[185px_minmax(0,1fr)_185px] grid-rows-[112px_minmax(0,1fr)_112px] gap-4 min-h-[800px]">
            <div className="col-span-3 grid grid-cols-4 gap-4 relative z-10">
              {topCases.map((item) => renderCompactCard(item))}
            </div>

            <div className="grid grid-rows-4 gap-4 relative z-10">
              {leftCases.map((item) => renderCompactCard(item))}
            </div>

            <div
              className="relative rounded-[36px] overflow-hidden shadow-2xl z-0 ring-1 ring-white/10"
              style={{ backgroundColor: 'var(--gen-bg)' }}
            >
              <div
                ref={containerRef}
                className="absolute inset-0 select-none touch-none"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
              >
                <div className="absolute inset-0">
                  <img
                    src={activeCase.afterImage}
                    alt="After"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: activeAfterObjectPosition }}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/12 to-transparent pointer-events-none" />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
                >
                  <img
                    src={activeCase.beforeImage}
                    alt="Before"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: activeBeforeObjectPosition }}
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] pointer-events-none" />

                <div
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                  onMouseDown={() => setIsDragging(true)}
                  onTouchStart={() => setIsDragging(true)}
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/40 pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </div>
                </div>

                <div className="absolute top-5 left-5 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
                  Before
                </div>
                <div className="absolute top-5 right-5 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm pointer-events-none">
                  After
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-8 flex flex-col items-center justify-end gap-3 pointer-events-none">
                {activeCase.requiredTier && (
                  <span className="px-3.5 py-1.5 rounded-full text-[11px] font-bold bg-amber-400/95 text-amber-950 shadow-lg pointer-events-auto">
                    {activeCase.requiredTier === 'basic' ? 'Creator' : activeCase.requiredTier === 'ultra' ? 'Studio' : activeCase.requiredTier === 'max' ? 'Max' : 'Pro'} Only
                  </span>
                )}
                <button
                  onClick={() => onSelectUseCase(activeCase)}
                  className="px-8 py-3.5 rounded-full font-bold shadow-2xl hover:scale-[1.02] transition-transform text-white pointer-events-auto text-sm md:text-base ring-2 ring-white/20"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b)' }}
                >
                  {t(activeCase.actionButtonTextKey as any)}
                </button>
              </div>
            </div>

            <div className="grid grid-rows-4 gap-4 relative z-10">
              {rightCases.map((item) => renderCompactCard(item))}
            </div>

            <div className="col-span-3 grid grid-cols-4 gap-4 relative z-10">
              {bottomCases.map((item) => renderCompactCard(item))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
