"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FEATURE_DISCOVERY_VISIBLE_CASES, FeatureDiscoveryCase } from '../../constants/useCases';
import { GenerationParams } from '../../lib/api-client';
import { useUserStore } from '@/stores/userStore';

interface Props {
  onSelectUseCase: (useCase: FeatureDiscoveryCase) => void;
}

export function FeatureDiscoveryGrid({ onSelectUseCase }: Props) {
  const t = useTranslations();
  const { user } = useUserStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const TIER_WEIGHT: Record<string, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    max: 3,
    ultra: 4,
  };

  const currentWeight = TIER_WEIGHT[(user?.tier || 'free').toLowerCase()] || 0;

  // Demand/popularity ranking (high -> low) based on actual internet search volume & trends.
  const POPULARITY_RANK: Record<string, number> = {
    // Tier 1: Massive viral social media filters
    ghibliStyle: 95,
    pixarStyle: 94,
    ps2Retro: 93,
    gtaStyle: 92,
    legoStyle: 91,
    
    // Tier 2: Core aesthetic & gaming trends
    turnIntoCyborg: 85,
    pixelArt: 84,
    pencilSketch: 83,
    
    // Tier 3: E-commerce & popular art styles
    petRoyalPainting: 80,
    watercolor: 79,
    oilPainting: 78,
    claymation: 77,
    turnIntoPlushie: 76,
    
    // Tier 4: Niche & seasonal styles
    zombieStyle: 70,
    turnIntoDoodle: 69,
    papercraft: 68,
    meAsTheGirlWithAPearl: 67,
  };

  const rankedCases = [...FEATURE_DISCOVERY_VISIBLE_CASES]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const rankA = POPULARITY_RANK[a.item.id] ?? 0;
      const rankB = POPULARITY_RANK[b.item.id] ?? 0;
      if (rankA !== rankB) return rankB - rankA;
      return a.index - b.index;
    })
    .map(({ item }) => item);

  // Show 12 items (2 rows on desktop) initially, or all if expanded
  const displayedCases = isExpanded ? rankedCases : rankedCases.slice(0, 12);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {displayedCases.map((item) => {
          const requiredWeight = TIER_WEIGHT[item.requiredTier || 'free'] || 0;
          const isLocked = requiredWeight > currentWeight;

          return (
            <div 
              key={item.id}
              className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl border border-[var(--gen-border)] bg-[var(--gen-input-bg)] aspect-square sm:aspect-[4/5]"
              onClick={() => onSelectUseCase(item)}
            >
              <div className="absolute inset-0 w-full h-full">
                <img 
                  src={item.image} 
                  alt={item.altKey ? t(item.altKey as any) : t(item.titleKey as any)}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

              {isLocked && (
                <div className="absolute top-2 right-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  {item.requiredTier === 'basic' ? 'Creator' : item.requiredTier === 'ultra' ? 'Studio' : item.requiredTier === 'max' ? 'Max' : 'Pro'}
                </div>
              )}
              
              {/* Text content at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3 z-10 flex flex-col justify-end">
                <h3 className="m-0 p-0 text-white font-bold text-sm sm:text-base leading-snug drop-shadow-md">
                  {t(item.titleKey as any)}
                </h3>
              </div>

              {/* Hover Arrow Icon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-50 group-hover:scale-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      
      {rankedCases.length > 12 && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-6 py-2.5 rounded-full border border-[var(--gen-border)] bg-[var(--gen-input-bg)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2 text-sm font-bold shadow-sm"
            style={{ color: 'var(--gen-text)' }}
          >
            {isExpanded ? (t('homepage.exploreMore.showLess' as any) || 'Show Less') : (t('homepage.exploreMore.showMore' as any) || 'Show More')}
            <svg 
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
