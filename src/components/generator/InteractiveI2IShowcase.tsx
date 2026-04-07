"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { INTERACTIVE_I2I_CASES, InteractiveI2ICase } from '../../constants/useCases';
import { GenerationParams } from '../../lib/api-client';
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
  const containerRef = useRef<HTMLDivElement>(null);

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

  const currentWeight = TIER_WEIGHT[(user?.tier || 'free').toLowerCase()] || 0;

  const renderTab = (item: InteractiveI2ICase, index: number, isMobileLayout: boolean = false) => {
    const isActive = index === activeIndex;
    const requiredWeight = TIER_WEIGHT[item.requiredTier || 'free'] || 0;
    const isLocked = requiredWeight > currentWeight;

    return (
      <button
        key={item.id}
        onClick={() => {
          setActiveIndex(index);
          setSliderPosition(50); // Reset slider on change
        }}
        className={`relative text-left transition-all duration-300 border flex-shrink-0 ${
          isMobileLayout 
            ? 'px-3 py-3 rounded-xl flex flex-col items-center justify-center text-center gap-1 w-full' 
            : 'px-6 py-4 rounded-2xl w-full'
        } ${
          isActive 
            ? 'bg-black text-white dark:bg-white dark:text-black border-transparent shadow-lg scale-[1.02]' 
            : 'bg-transparent border-[var(--gen-border)] hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        {isLocked && (
          <div className={`absolute ${isMobileLayout ? '-top-2 -right-2 scale-75' : 'top-4 right-4'} z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5`}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            {item.requiredTier === 'basic' ? 'Creator' : item.requiredTier === 'ultra' ? 'Studio' : item.requiredTier === 'max' ? 'Max' : 'Pro'}
          </div>
        )}
        {/* Use H3 for the main label for SEO semantics, since this is inside the H2 Image To Image section */}
        <h3 className={`font-bold m-0 p-0 ${isMobileLayout ? 'text-xs md:text-sm' : 'text-lg pr-8'}`}>{item.tabLabel}</h3>
        {!isMobileLayout && (
          <p className={`text-sm mt-1 mb-0 pr-8 ${isActive ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'}`}>
            {t(item.descKey as any)}
          </p>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-stretch">
      {/* Mobile Top 3 Tabs */}
      <div className="grid grid-cols-3 gap-2 lg:hidden">
        {INTERACTIVE_I2I_CASES.slice(0, 3).map((item, index) => renderTab(item, index, true))}
      </div>

      {/* Desktop All Tabs (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/3 flex-col gap-2">
        {INTERACTIVE_I2I_CASES.map((item, index) => renderTab(item, index, false))}
      </div>

      {/* Right side: Before/After Stage */}
      <div className="w-full lg:w-2/3 relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto" style={{ minHeight: '400px', backgroundColor: 'var(--gen-input-bg)' }}>
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
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg pointer-events-none">
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
        </div>

        {/* Action Button Overlaid on the stage */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button 
            onClick={() => onSelectUseCase(activeCase)}
            className="px-8 py-3 bg-black text-white dark:bg-white dark:text-black rounded-full font-bold shadow-xl hover:scale-105 transition-transform"
          >
            {t(activeCase.actionButtonTextKey as any)}
          </button>
        </div>
      </div>

      {/* Mobile Bottom 3 Tabs */}
      <div className="grid grid-cols-3 gap-2 lg:hidden">
        {INTERACTIVE_I2I_CASES.slice(3, 6).map((item, index) => renderTab(item, index + 3, true))}
      </div>
    </div>
  );
}
