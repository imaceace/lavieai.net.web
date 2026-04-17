"use client";

import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useTranslations } from "next-intl";
import {
  DropdownSelector,
  TryStyleCards,
  GalleryShowcase,
  GenerationResult,
  InteractiveI2IShowcase,
} from "@/components/generator";
import { INTERACTIVE_I2I_CASES } from "@/constants/useCases";
import { useUserStore } from "@/stores/userStore";
import { UpgradeModal } from "@/components/auth/UpgradeModal";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { generateApi, pollTaskStatus, userApi, configApi, authApi, uploadApi, getClientFingerprint, type UseCasePricingPreview } from "@/lib/api-client";
import Script from "next/script";

const RECENT_USECASE_IMAGE_KEY_PREFIX = "recentUseCaseImage:v2";
const RECENT_USECASE_IMAGE_LEGACY_KEY = "recentUseCaseImage";
const RECENT_USECASE_IMAGE_FALLBACK_TTL_SECONDS = 30 * 24 * 60 * 60;
const USECASE_PRICING_CACHE_KEY_PREFIX = "useCasePricingPreview:v1";
const USECASE_PRICING_CACHE_TTL_MS = 120 * 1000;

type RecentUseCaseImageCache = {
  url: string;
  id: string;
  expiresAt: number;
  savedAt: number;
};

// Style icons mapping
const styleIcons: Record<string, string> = {
  "none": "○", "digital-art": "◐", "neon-punk": "◈", "line-art": "— ", "sketch": "✏️",
  "pixel-art": "◫", "photographic": "◉", "photorealistic": "📷", "analog-film": "◻",
  "film": "📽️", "origami": "◈", "3d-model": "▣", "3d-render": "🎲", "anime": "🎌",
  "fantasy": "🧙", "fantasy-art": "✦", "low-poly": "◱", "cinematic": "▢",
  "enhance": "◧", "comic-book": "▤", "isometric": "▣", "craft-clay": "◭",
  "oil-painting": "🖼️", "watercolor": "🎨", "cyberpunk": "🤖", "portrait": "👤",
  "landscape": "🏔️", "illustration": "✍️", "ukiyo-e": "🏯", "chinese-style": "🐉",
  "minimalist": "◼️", "architecture": "🏛️", "interior": "🏠", "fashion": "👗",
  "commercial": "📺", "food": "🍜", "pet": "🐱", "floral": "🌸", "bw": "⬛",
  "macro": "🔬", "poster": "📋", "ui-design": "📱", "logo": "🔵", "cover": "📔",
  "ecommerce": "🛒", "packaging": "📦", "typography": "🔤",
};

const colorIcons: Record<string, string> = {
  "none": "○", "vibrant": "🌈", "muted": "🍂", "warm": "🌅", "cool": "❄️",
  "pastel": "🌸", "monochrome": "🔲", "neon": "🚥", "high-contrast": "🌗", "sepia": "🎞️"
};

const lightingIcons: Record<string, string> = {
  "none": "○", "soft": "☁️", "dramatic": "🎭", "golden-hour": "🌇", "blue-hour": "🌃",
  "studio": "💡", "natural": "☀️", "neon": "🔦", "volumetric": "🌫️", "cinematic": "🎬", 
  "backlit": "👤", "ambient": "🕯️"
};

const compositionIcons: Record<string, string> = {
  "none": "○", "centered": "🎯", "rule-of-thirds": "📐", "diagonal": "↘️",
  "symmetrical": "🦋", "frame": "🖼️", "leading": "🛣️", "depth": "🌌",
};

const avatarGradients = [
  "from-indigo-500 to-violet-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-blue-500 to-cyan-500",
  "from-fuchsia-500 to-purple-500",
  "from-red-500 to-orange-500",
  "from-cyan-500 to-blue-500",
  "from-green-500 to-emerald-500",
  "from-violet-500 to-fuchsia-500"
];

const ratioIcons: Record<string, React.ReactNode> = {
  "1:1": <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>,
  "16:9": <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"/></svg>,
  "9:16": <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="2" width="12" height="20" rx="2" ry="2"/></svg>,
  "4:3": <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" ry="2"/></svg>,
  "3:4": <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="3" width="14" height="18" rx="2" ry="2"/></svg>,
  "21:9": <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="8" width="20" height="8" rx="2" ry="2"/></svg>,
};

export default function Home() {
  const t = useTranslations("home");
  const tGallery = useTranslations("gallery");
  const tCommon = useTranslations("common");
  const { addToast } = useToast();

  // Dynamic options from API
  const [styleOptions, setStyleOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [colorOptions, setColorOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [lightingOptions, setLightingOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [compositionOptions, setCompositionOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [ratioOptions, setRatioOptions] = useState<Array<{ id: string; label: string }>>([]);

  // Generator state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState<string | null>("none");
  const [resolution, setResolution] = useState<[number, number]>([1024, 1024]);
  const [quality, setQuality] = useState<1 | 2 | 4>(1);
  const [color, setColor] = useState<string | null>("none");
  const [lighting, setLighting] = useState<string | null>("none");
  const [composition, setComposition] = useState<string | null>("none");
  const [model, setModel] = useState<string>("basic");
  const [strength, setStrength] = useState<number | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string } | null>(null);
  
  // Image to Image state
  const [referenceImage, setReferenceImage] = useState<{ url: string; id: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeUseCase, setActiveUseCase] = useState<string>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const useCaseFileInputRef = useRef<HTMLInputElement>(null);
  const [isUseCaseUploadModalOpen, setIsUseCaseUploadModalOpen] = useState(false);
  const [pendingUseCaseData, setPendingUseCaseData] = useState<any | null>(null);
  const [pendingUseCaseImage, setPendingUseCaseImage] = useState<{ url: string; id: string } | null>(null);
  const [pendingUseCasePricingPreview, setPendingUseCasePricingPreview] = useState<UseCasePricingPreview | null>(null);
  const [useCasePricingPreviewMap, setUseCasePricingPreviewMap] = useState<Record<string, UseCasePricingPreview>>({});
  const [isLoadingPendingUseCasePricing, setIsLoadingPendingUseCasePricing] = useState(false);
  const [recentUseCaseImage, setRecentUseCaseImage] = useState<{ url: string; id: string } | null>(null);
  const [isUseCaseUploading, setIsUseCaseUploading] = useState(false);
  const recentUseCaseStorageKeyRef = useRef<string | null>(null);

  // User points state
  const [userCredits, setUserCredits] = useState<number | null>(null);

  // Generator extra state
  const [fastMode, setFastMode] = useState(false);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const { user, isLoginModalOpen, openLoginModal, closeLoginModal } = useUserStore();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalTitle, setUpgradeModalTitle] = useState("");
  const [upgradeModalSubtitle, setUpgradeModalSubtitle] = useState("");
  const handleGenerateRef = useRef<(() => Promise<void>) | null>(null);
  type GenerationIntent =
    | {
        kind: "text-to-image";
        prompt: string;
        negativePrompt?: string;
        style?: string;
        resolution: [number, number];
        model: string;
        fastMode: boolean;
        useCase?: string;
      }
    | {
        kind: "image-to-image";
        prompt: string;
        negativePrompt?: string;
        style?: string;
        resolution: [number, number];
        model: string;
        fastMode: boolean;
        useCase?: string;
        strength?: number;
        imageUrl: string;
        imageId: string;
      }
    | {
        kind: "image-to-image-use-case";
        useCase: string;
        imageUrl: string;
        imageId: string;
        fastMode: boolean;
        resolution: [number, number];
      };
  const [lastGenerationIntent, setLastGenerationIntent] = useState<GenerationIntent | null>(null);

  // Track last manual action for "Last Operation Wins" logic
  const lastPromptEditTime = useRef<number>(0);
  const lastDropdownEditTime = useRef<number>(0);

  const getUseCaseCacheKey = (scopeKey: string, fastModeEnabled: boolean) =>
    `${USECASE_PRICING_CACHE_KEY_PREFIX}:${scopeKey}:${fastModeEnabled ? "fast" : "slow"}`;

  // Sniff keywords from prompt to update selectors
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!prompt || lastDropdownEditTime.current > lastPromptEditTime.current) return;
      
      const lowerPrompt = prompt.toLowerCase();
      
      // Sniff color
      const foundColor = colorOptions.find(c => c.id !== 'none' && lowerPrompt.includes(c.id.replace('-', ' ')));
      if (foundColor && color !== foundColor.id) {
        setColor(foundColor.id);
      }
      
      // Sniff lighting
      const foundLight = lightingOptions.find(l => l.id !== 'none' && lowerPrompt.includes(l.id.replace('-', ' ')));
      if (foundLight && lighting !== foundLight.id) {
        setLighting(foundLight.id);
      }
      
      // Sniff composition
      const foundComp = compositionOptions.find(c => c.id !== 'none' && lowerPrompt.includes(c.id.replace('-', ' ')));
      if (foundComp && composition !== foundComp.id) {
        setComposition(foundComp.id);
      }

      // Sniff style
      const foundStyle = styleOptions.find(s => s.id !== 'none' && lowerPrompt.includes(s.id.replace('-', ' ')));
      if (foundStyle && style !== foundStyle.id) {
        setStyle(foundStyle.id);
      }
      
    }, 800); // 800ms debounce for smoother typing
    
    return () => clearTimeout(timer);
  }, [prompt, colorOptions, lightingOptions, compositionOptions, styleOptions, color, lighting, composition, style]);

  useEffect(() => {
    if (user) {
      setUserCredits(user.credits);
      setFastMode(true);
    } else {
      setUserCredits(null);
      setFastMode(false);
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    const loadRecentUseCaseImage = async () => {
      const scopeKey = user?.id
        ? `user:${user.id}`
        : `guest:${await getClientFingerprint() || 'unknown'}`;
      const storageKey = `${RECENT_USECASE_IMAGE_KEY_PREFIX}:${scopeKey}`;
      recentUseCaseStorageKeyRef.current = storageKey;
      const now = Math.floor(Date.now() / 1000);

      const storedRecentImage = localStorage.getItem(storageKey);
      if (storedRecentImage) {
        try {
          const parsed = JSON.parse(storedRecentImage) as RecentUseCaseImageCache;
          if (parsed?.url && parsed?.id && Number(parsed.expiresAt || 0) > now) {
            if (!cancelled) setRecentUseCaseImage({ url: parsed.url, id: parsed.id });
          } else {
            localStorage.removeItem(storageKey);
          }
        } catch {
          localStorage.removeItem(storageKey);
        }
      } else {
        // One-time migration from legacy sessionStorage
        const legacyStored = sessionStorage.getItem(RECENT_USECASE_IMAGE_LEGACY_KEY);
        if (legacyStored) {
          try {
            const parsedLegacy = JSON.parse(legacyStored);
            if (parsedLegacy?.url && parsedLegacy?.id) {
              const migrated: RecentUseCaseImageCache = {
                url: parsedLegacy.url,
                id: parsedLegacy.id,
                savedAt: now,
                expiresAt: now + RECENT_USECASE_IMAGE_FALLBACK_TTL_SECONDS,
              };
              localStorage.setItem(storageKey, JSON.stringify(migrated));
              if (!cancelled) setRecentUseCaseImage({ url: migrated.url, id: migrated.id });
            }
          } catch {
            // Ignore bad legacy payload.
          } finally {
            sessionStorage.removeItem(RECENT_USECASE_IMAGE_LEGACY_KEY);
          }
        }
      }
    };
    void loadRecentUseCaseImage();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    const preloadUseCasePricing = async () => {
      const scopeKey = user?.id
        ? `user:${user.id}:${(user.tier || user.subscription_type || 'free').toLowerCase()}`
        : `guest:${await getClientFingerprint() || 'unknown'}`;
      const cacheKey = getUseCaseCacheKey(scopeKey, fastMode);

      const now = Date.now();
      const cachedRaw = sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        try {
          const parsed = JSON.parse(cachedRaw) as { expiresAt: number; items: UseCasePricingPreview[] };
          if (parsed.expiresAt > now && Array.isArray(parsed.items)) {
            const mapped = parsed.items.reduce<Record<string, UseCasePricingPreview>>((acc, item) => {
              acc[item.use_case] = item;
              return acc;
            }, {});
            if (!cancelled) setUseCasePricingPreviewMap(mapped);
            return;
          }
        } catch {
          // Ignore broken cache payload.
        }
      }

      const uniqueUseCases = new Map<string, { useCase: string; width?: number; height?: number }>();
      for (const item of INTERACTIVE_I2I_CASES) {
        const useCase = item.params?.useCase || item.id;
        if (!useCase || uniqueUseCases.has(useCase)) continue;
        uniqueUseCases.set(useCase, {
          useCase,
          width: item.params?.resolution?.[0] || 1024,
          height: item.params?.resolution?.[1] || 1024,
        });
      }

      try {
        const batch = await generateApi.getUseCasePricingPreviewBatch({
          fastMode,
          items: Array.from(uniqueUseCases.values()),
        });
        if (cancelled) return;
        const mapped = batch.items.reduce<Record<string, UseCasePricingPreview>>((acc, item) => {
          acc[item.use_case] = item;
          return acc;
        }, {});
        setUseCasePricingPreviewMap(mapped);
        sessionStorage.setItem(cacheKey, JSON.stringify({
          expiresAt: now + USECASE_PRICING_CACHE_TTL_MS,
          items: batch.items,
        }));
      } catch (error) {
        console.error("Failed to preload use-case pricing previews:", error);
      }
    };

    void preloadUseCasePricing();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.tier, user?.subscription_type, fastMode]);

  useEffect(() => {
    // Fetch generation options from API (styles, colors, etc.)
    configApi.getGenerationOptions().then(options => {
      if (options) {
        setStyleOptions(options.styles.map(s => ({ ...s, icon: styleIcons[s.id] || "○" })));
        setColorOptions(options.colors.map(c => ({ ...c, icon: colorIcons[c.id] || "○" })));
        setLightingOptions(options.lighting.map(l => ({ ...l, icon: lightingIcons[l.id] || "○" })));
        setCompositionOptions(options.composition.map(c => ({ ...c, icon: compositionIcons[c.id] || "○" })));
        setRatioOptions(options.ratios.map(r => ({ id: r.id, label: r.label, icon: ratioIcons[r.id] })));
      }
    });

    // Handle parameters from gallery "Generate Similar" action via sessionStorage
    const storedParams = sessionStorage.getItem('generatorParams');
    if (storedParams) {
      try {
        const params = JSON.parse(storedParams);
        sessionStorage.removeItem('generatorParams');

        if (params.prompt) {
          setPrompt(params.prompt);
        }

        if (params.style) {
          const styleMapping: Record<string, string> = {
            'anime': 'anime',
            'cyberpunk': 'cyberpunk',
            'fantasy': 'fantasy-art',
            'oil-painting': 'oil-painting',
            'watercolor': 'watercolor',
            'sketch': 'line-art',
            '3d-render': '3d-model',
            'pixel-art': 'pixel-art',
            'portrait': 'portrait',
            'landscape': 'landscape',
            'illustration': 'illustration',
            'photographic': 'photographic',
            'neon-punk': 'neon-punk',
            'digital-art': 'digital-art',
            'comic-book': 'comic-book',
            'origami': 'origami',
            'cinematic': 'cinematic',
            'fantasy-art': 'fantasy-art',
            'enhance': 'enhance',
            'isometric': 'isometric',
            'craft-clay': 'craft-clay',
            'low-poly': 'low-poly',
            'analog-film': 'analog-film',
          };
          
          const mappedStyle = styleMapping[params.style] || params.style;
          setStyle(mappedStyle);
        }

        // Scroll to generator section
        setTimeout(() => {
          const generatorSection = document.getElementById('generator');
          if (generatorSection) {
            generatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } catch (e) {
        console.error('Failed to parse generator params:', e);
        sessionStorage.removeItem('generatorParams');
      }
    }
  }, []);

  // Generation cost based on model tier and fast mode
  const getGenerationCost = (
    targetModel: string = model,
    targetResolution: [number, number] = resolution,
    targetQuality: 1 | 2 | 4 = quality
  ) => {
    if (targetModel === 'basic') {
      return fastMode ? 4 : 0;
    }
    
    const [width, height] = targetResolution || [1024, 1024];
    const finalResolution = [width * targetQuality, height * targetQuality];
    const pixels = finalResolution[0] * finalResolution[1];
    const is4K = pixels > 2048 * 2048;
    const is2K = pixels > 1024 * 1024 && pixels <= 2048 * 2048;

    const generationCosts: Record<string, number> = {
      pro: is4K ? 30 : (is2K ? 20 : 15),
      max: is4K ? 54 : (is2K ? 36 : 24),
      ultra: is4K ? 108 : (is2K ? 81 : 54)
    };
    return generationCosts[targetModel] || 15;
  };
  const generationCost = getGenerationCost();
  const currentUserTier = ((user as any)?.tier || (user as any)?.subscription_type || 'free').toLowerCase();
  const shouldShowFreePlanBanner = !user || currentUserTier === 'free' || currentUserTier === 'guest';

  const getAutoModelByTier = () => {
    const tier = currentUserTier;
    if (tier === 'creator' || tier === 'basic') return 'pro';
    if (tier === 'pro' || tier === 'max') return 'max';
    if (tier === 'studio' || tier === 'ultra') return 'ultra';
    return 'basic';
  };

  const runGenerationByIntent = async (intent: GenerationIntent) => {
    const task =
      intent.kind === "text-to-image"
        ? await generateApi.textToImage({
            prompt: intent.prompt,
            negativePrompt: intent.negativePrompt,
            style: intent.style,
            resolution: intent.resolution,
            model: intent.model,
            fastMode: intent.fastMode,
            useCase: intent.useCase,
          })
        : intent.kind === "image-to-image"
          ? await generateApi.imageToImage({
              prompt: intent.prompt,
              negativePrompt: intent.negativePrompt,
              style: intent.style,
              resolution: intent.resolution,
              model: intent.model,
              fastMode: intent.fastMode,
              imageUrl: intent.imageUrl,
              imageId: intent.imageId,
              useCase: intent.useCase,
              strength: intent.strength,
            })
          : await generateApi.imageToImageUseCase({
              useCase: intent.useCase,
              imageUrl: intent.imageUrl,
              imageId: intent.imageId,
              fastMode: intent.fastMode,
              resolution: intent.resolution,
            });

    return pollTaskStatus(task.id, undefined, 2000, 60);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      addToast("Prompt is empty. Please enter a prompt first.", "info");
      return;
    }
    if (userCredits !== null && userCredits < generationCost) {
      setUpgradeModalTitle(t('generator.upgradeRequiredTitle') || 'Upgrade Required');
      setUpgradeModalSubtitle(t('generator.notEnoughCredits', { cost: generationCost }));
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setResult(null);

    // Append color, lighting, composition to prompt if not already present
    let finalPrompt = prompt.trim();
    const lowerFinalPrompt = finalPrompt.toLowerCase();

    if (color && color !== 'none') {
      const colorLabel = colorOptions.find(c => c.id === color)?.label || color;
      const cleanLabel = colorLabel.replace(' Colors', '').replace(' Color', '').toLowerCase();
      if (!lowerFinalPrompt.includes(cleanLabel) && !lowerFinalPrompt.includes(color.replace('-', ' '))) {
        finalPrompt += `, ${colorLabel} colors`;
      }
    }
    
    if (lighting && lighting !== 'none') {
      const lightingLabel = lightingOptions.find(l => l.id === lighting)?.label || lighting;
      const cleanLabel = lightingLabel.replace(' Lighting', '').replace(' Light', '').toLowerCase();
      if (!lowerFinalPrompt.includes(cleanLabel) && !lowerFinalPrompt.includes(lighting.replace('-', ' '))) {
        finalPrompt += `, ${lightingLabel} lighting`;
      }
    }
    
    if (composition && composition !== 'none') {
      const compLabel = compositionOptions.find(c => c.id === composition)?.label || composition;
      const cleanLabel = compLabel.replace(' Composition', '').toLowerCase();
      if (!lowerFinalPrompt.includes(cleanLabel) && !lowerFinalPrompt.includes(composition.replace('-', ' '))) {
        finalPrompt += `, ${compLabel} composition`;
      }
    }

    try {
      const finalResolution: [number, number] = [resolution[0] * quality, resolution[1] * quality];
      const intent: GenerationIntent = referenceImage
        ? {
            kind: "image-to-image",
            prompt: finalPrompt,
            negativePrompt: showNegativePrompt ? negativePrompt : undefined,
            style: style || undefined,
            resolution: finalResolution,
            model,
            fastMode,
            imageUrl: referenceImage.url,
            imageId: referenceImage.id,
            useCase: activeUseCase !== "general" ? activeUseCase : undefined,
            strength,
          }
        : {
            kind: "text-to-image",
            prompt: finalPrompt,
            negativePrompt: showNegativePrompt ? negativePrompt : undefined,
            style: style || undefined,
            resolution: finalResolution,
            model,
            fastMode,
            useCase: activeUseCase !== "general" ? activeUseCase : undefined,
          };
      setLastGenerationIntent(intent);
      const completedTask = await runGenerationByIntent(intent);

      if (completedTask.result_url) {
        setResult({ imageUrl: completedTask.result_url });
        // Refresh credits
        const userProfile = await authApi.getMe();
        if (userProfile) {
          useUserStore.getState().setUser(userProfile as any);
          setUserCredits(userProfile.credits);
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      
      const errorCode = (error as any).code;
      if (
        errorCode === 'RESOLUTION_LIMIT' ||
        errorCode === 'UPGRADE_REQUIRED' ||
        errorCode === 'DAILY_LIMIT_EXCEEDED' ||
        errorCode === 'INSUFFICIENT_POINTS'
      ) {
        setUpgradeModalTitle(t('generator.upgradeRequiredTitle') || 'Upgrade Required');
        setUpgradeModalSubtitle(error instanceof Error ? error.message : t('generator.upgradeRequired'));
        setIsUpgradeModalOpen(true);
      } else {
        addToast(error instanceof Error ? error.message : t('generator.generationFailed'), 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };
  handleGenerateRef.current = handleGenerate;

  const handleUsePrompt = (p: string) => {
    setPrompt(p);
    // Scroll to generator section
    setTimeout(() => {
      const generatorSection = document.getElementById('generator');
      if (generatorSection) {
        generatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSelectStyle = (styleId: string, examplePrompt: string) => {
    setStyle(styleId);
    setPrompt(examplePrompt);
    // Scroll to generator section
    setTimeout(() => {
      const generatorSection = document.getElementById('generator');
      if (generatorSection) {
        generatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSelectUseCase = async (useCaseData: any) => {
    const params = useCaseData.params || {};
    const requiredTier = useCaseData.requiredTier || 'free';
    
    const TIER_WEIGHT: Record<string, number> = {
      free: 0,
      basic: 1,
      pro: 2,
      max: 3,
      ultra: 4,
    };
    
    const currentWeight = TIER_WEIGHT[(user?.tier || 'free').toLowerCase()] || 0;
    const requiredWeight = TIER_WEIGHT[requiredTier] || 0;

    if (requiredWeight > currentWeight) {
      setUpgradeModalTitle('Premium Feature');
      setUpgradeModalSubtitle(`The "${useCaseData.tabLabel || t('useCases.' + useCaseData.id + '.title')}" feature requires a ${requiredTier.toUpperCase()} plan or higher. Please upgrade to unlock.`);
      setIsUpgradeModalOpen(true);
      return;
    }

    // H3 图生图入口：先弹出选图浮窗，选图后再回填参数并自动提交
    const targetUseCase = params.useCase || useCaseData.id || 'general';
    setPendingUseCaseData(useCaseData);
    setPendingUseCaseImage(recentUseCaseImage);
    setPendingUseCasePricingPreview(null);
    setIsUseCaseUploadModalOpen(true);

    const cachedPreview = useCasePricingPreviewMap[targetUseCase];
    if (cachedPreview) {
      setPendingUseCasePricingPreview(cachedPreview);
      setIsLoadingPendingUseCasePricing(false);
      return;
    }

    try {
      setIsLoadingPendingUseCasePricing(true);
      const preview = await generateApi.getUseCasePricingPreview({
        useCase: targetUseCase,
        width: (params.resolution || resolution)?.[0] || 1024,
        height: (params.resolution || resolution)?.[1] || 1024,
        fastMode,
      });
      setPendingUseCasePricingPreview(preview);
      setUseCasePricingPreviewMap((previous) => ({ ...previous, [preview.use_case]: preview }));
    } catch (error) {
      console.error("Failed to load use-case pricing preview:", error);
      addToast("Failed to load latest pricing, fallback value is shown.", "info");
    } finally {
      setIsLoadingPendingUseCasePricing(false);
    }
  };

  const handleUseCaseFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUseCaseData) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast("File is too large. Maximum size is 10MB.", "error");
      return;
    }

    const params = pendingUseCaseData.params || {};
    const targetUseCase = params.useCase || pendingUseCaseData.id || 'general';

    try {
      setIsUseCaseUploading(true);
      const data = await uploadApi.uploadImage(file, targetUseCase);
      const imageData = { url: data.url, id: data.id };
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = Number(data.expires_at || (now + RECENT_USECASE_IMAGE_FALLBACK_TTL_SECONDS));
      setPendingUseCaseImage(imageData);
      setRecentUseCaseImage(imageData);
      const storageKey = recentUseCaseStorageKeyRef.current || `${RECENT_USECASE_IMAGE_KEY_PREFIX}:guest:unknown`;
      const payload: RecentUseCaseImageCache = {
        ...imageData,
        savedAt: now,
        expiresAt,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      addToast(t('generator.useCaseUploadModal.uploadedNotice'), "info");
    } catch (err: any) {
      addToast(err.message || "Upload failed", "error");
    } finally {
      setIsUseCaseUploading(false);
      if (useCaseFileInputRef.current) useCaseFileInputRef.current.value = '';
    }
  };

  const handleGeneratePendingUseCase = async () => {
    if (!pendingUseCaseData || !pendingUseCaseImage) {
      addToast(t('generator.useCaseUploadModal.uploadFirstNotice'), "info");
      return;
    }
    if (!isPendingUseCaseTrialEligible && userCredits !== null && userCredits < pendingUseCaseCost) {
      setUpgradeModalTitle(t('generator.upgradeRequiredTitle') || 'Upgrade Required');
      setUpgradeModalSubtitle(t('generator.notEnoughCredits', { cost: pendingUseCaseCost }));
      setIsUpgradeModalOpen(true);
      return;
    }

    const params = pendingUseCaseData.params || {};
    const targetUseCase = params.useCase || pendingUseCaseData.id || 'general';

    const generatorSection = document.getElementById('generator');
    if (generatorSection) {
      generatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setIsUseCaseUploadModalOpen(false);
    setPendingUseCaseData(null);
    setPendingUseCasePricingPreview(null);
    setIsGenerating(true);

    try {
      const intent: GenerationIntent = {
        kind: "image-to-image-use-case",
        useCase: targetUseCase,
        imageUrl: pendingUseCaseImage.url,
        imageId: pendingUseCaseImage.id,
        fastMode,
        resolution: params.resolution || resolution,
      };
      setLastGenerationIntent(intent);
      const completedTask = await runGenerationByIntent(intent);
      if (completedTask.result_url) {
        const currentPreview = pendingUseCasePricingPreview;
        if (currentPreview && currentPreview.trial.remaining > 0) {
          const nextPreview: UseCasePricingPreview = {
            ...currentPreview,
            trial: {
              ...currentPreview.trial,
              eligible: currentPreview.trial.remaining - 1 > 0,
              used: currentPreview.trial.used + 1,
              remaining: Math.max(0, currentPreview.trial.remaining - 1),
            }
          };
          setUseCasePricingPreviewMap((previous) => ({ ...previous, [targetUseCase]: nextPreview }));
          setPendingUseCasePricingPreview(nextPreview);
        }
        setResult({ imageUrl: completedTask.result_url });
        const userProfile = await authApi.getMe();
        if (userProfile) {
          useUserStore.getState().setUser(userProfile as any);
          setUserCredits(userProfile.credits);
        }
      }
    } catch (error) {
      const errorCode = (error as any)?.code;
      if (
        errorCode === 'RESOLUTION_LIMIT' ||
        errorCode === 'UPGRADE_REQUIRED' ||
        errorCode === 'DAILY_LIMIT_EXCEEDED' ||
        errorCode === 'INSUFFICIENT_POINTS'
      ) {
        setUpgradeModalTitle(t('generator.upgradeRequiredTitle') || 'Upgrade Required');
        setUpgradeModalSubtitle(error instanceof Error ? error.message : t('generator.upgradeRequired'));
        setIsUpgradeModalOpen(true);
      } else {
        addToast(error instanceof Error ? error.message : t('generator.generationFailed'), 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (isGenerating) return;
    if (!lastGenerationIntent) {
      addToast("No previous generation parameters found. Please generate once first.", "info");
      return;
    }

    setIsGenerating(true);
    setResult(null);
    try {
      const completedTask = await runGenerationByIntent(lastGenerationIntent);
      if (completedTask.result_url) {
        setResult({ imageUrl: completedTask.result_url });
        const userProfile = await authApi.getMe();
        if (userProfile) {
          useUserStore.getState().setUser(userProfile as any);
          setUserCredits(userProfile.credits);
        }
      }
    } catch (error) {
      console.error("Regenerate error:", error);
      const errorCode = (error as any)?.code;
      if (
        errorCode === 'RESOLUTION_LIMIT' ||
        errorCode === 'UPGRADE_REQUIRED' ||
        errorCode === 'DAILY_LIMIT_EXCEEDED' ||
        errorCode === 'INSUFFICIENT_POINTS'
      ) {
        setUpgradeModalTitle(t('generator.upgradeRequiredTitle') || 'Upgrade Required');
        setUpgradeModalSubtitle(error instanceof Error ? error.message : t('generator.upgradeRequired'));
        setIsUpgradeModalOpen(true);
      } else {
        addToast(error instanceof Error ? error.message : t('generator.generationFailed'), 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const formatUseCaseFallbackTitle = (value: string) =>
    value
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (char) => char.toUpperCase());

  const pendingUseCaseTitle = pendingUseCaseData
    ? (() => {
        if (pendingUseCaseData.tabLabel) return pendingUseCaseData.tabLabel;
        if (pendingUseCaseData.titleKey) {
          try {
            return t(pendingUseCaseData.titleKey as any);
          } catch {
            return formatUseCaseFallbackTitle(String(pendingUseCaseData.id || pendingUseCaseData.titleKey));
          }
        }
        return formatUseCaseFallbackTitle(String(pendingUseCaseData.id || "use case"));
      })()
    : "";
  const isPendingUseCaseTrialEligible = (pendingUseCasePricingPreview?.trial?.remaining || 0) > 0;
  const pendingUseCaseTrialRemaining = pendingUseCasePricingPreview?.trial?.remaining || 0;
  const pendingUseCaseModel = getAutoModelByTier();
  const pendingUseCaseCost = pendingUseCaseData
    ? (pendingUseCasePricingPreview?.points_cost ?? getGenerationCost(
      pendingUseCaseModel,
      pendingUseCaseData?.params?.resolution || resolution,
      pendingUseCaseModel === 'basic' ? 1 : quality
    ))
    : generationCost;
  const hasEnoughPendingUseCaseCredits = isPendingUseCaseTrialEligible || userCredits === null || userCredits >= pendingUseCaseCost;

  const professionalSubjects: Record<string, string[]> = {
    "photographic": [
      "A stunning fashion portrait of a young woman with freckles, highly detailed skin texture, shot on 85mm lens, f/1.8",
      "Macro photography of a water drop on a lotus leaf, reflecting the morning sun, razor sharp focus",
      "Street photography of a bustling neon-lit Tokyo intersection in the rain, reflections on wet asphalt, 35mm lens",
      "Cinematic wide shot of a lone hiker on a snowy mountain ridge, National Geographic style, highly detailed"
    ],
    "3d-model": [
      "A cute isometric tiny room inside a coffee cup, intricate details, octane render, 8k resolution, trending on CGSociety",
      "A highly detailed mech warrior robot, unreal engine 5 render, metallic textures, ray tracing, cinematic",
      "A stylized low-poly fantasy village floating in the sky, 3D blender render, ambient occlusion, magical",
      "Close up of a cute fluffy monster toy, claymation style, tilt shift, macro rendering"
    ],
    "anime": [
      "A magical girl standing on a cliff looking at a floating castle, studio ghibli style, detailed background, masterpiece",
      "Cyberpunk ninja resting on a rooftop edge, neo-tokyo background, makoto shinkai style, vivid colors, 4k",
      "A cozy Japanese ramen shop at night, detailed anime background art, lofi aesthetic",
    ],
    "digital-art": [
      "An epic fantasy landscape with a glowing giant tree of life, concept art, trending on artstation, intricate, epic scale",
      "A futuristic spaceship interior, sci-fi concept art, highly detailed control panels, atmospheric",
      "A majestic dragon resting on a hoard of gold, digital painting, highly detailed, fantasy illustration",
    ],
    "watercolor": [
      "A serene landscape of mountains and a calm lake, traditional watercolor painting, soft brush strokes",
      "A vibrant bouquet of spring flowers, loose watercolor style, expressive splatters, artistic, elegant",
      "A vintage street view of Paris, ink and wash, sketchy lines, architectural drawing style",
    ],
    "architecture": [
      "Modern minimalist concrete villa in a lush pine forest, architectural visualization, clear lines, photorealistic",
      "A futuristic sustainable skyscraper covered in vertical gardens, glass facade, architectural rendering, unreal engine",
      "Cozy scandinavian interior living room, wooden furniture, large windows, archviz, extremely detailed",
    ],
    "default": [
      "A majestic dragon flying over misty mountains, epic scale, highly detailed",
      "A cozy coffee shop interior with plants and bookshelves, inviting atmosphere",
      "An abstract geometric composition with flowing shapes and intricate patterns, 8k resolution",
      "A futuristic cyberpunk city with neon lights and flying cars, highly detailed, cinematic"
    ]
  };

  const handleSurpriseMe = () => {
    // 1. Pick a random style
    const validStyles = styleOptions.filter(s => s.id !== "none");
    if (validStyles.length > 0) {
      const randomStyle = validStyles[Math.floor(Math.random() * validStyles.length)];
      setStyle(randomStyle.id);

      // 2. Generate prompt based on style category
      let category = "default";
      if (["photographic", "photorealistic", "portrait", "macro", "fashion", "film", "analog-film", "commercial"].includes(randomStyle.id)) category = "photographic";
      else if (["3d-model", "3d-render", "isometric", "craft-clay", "low-poly", "origami"].includes(randomStyle.id)) category = "3d-model";
      else if (["anime", "comic-book", "ukiyo-e", "chinese-style"].includes(randomStyle.id)) category = "anime";
      else if (["digital-art", "fantasy", "fantasy-art", "cyberpunk", "illustration", "neon-punk", "enhance"].includes(randomStyle.id)) category = "digital-art";
      else if (["watercolor", "oil-painting", "sketch", "line-art"].includes(randomStyle.id)) category = "watercolor";
      else if (["architecture", "interior"].includes(randomStyle.id)) category = "architecture";

      const subjects = professionalSubjects[category] || professionalSubjects["default"];
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      setPrompt(randomSubject);
    } else {
      const subjects = professionalSubjects["default"];
      setPrompt(subjects[Math.floor(Math.random() * subjects.length)]);
    }

    // 3. Pick a random color
    const validColors = colorOptions.filter(c => c.id !== "none");
    if (validColors.length > 0) {
      const randomColor = validColors[Math.floor(Math.random() * validColors.length)];
      setColor(randomColor.id);
    }

    // 4. Pick a random lighting
    const validLighting = lightingOptions.filter(l => l.id !== "none");
    if (validLighting.length > 0) {
      const randomLight = validLighting[Math.floor(Math.random() * validLighting.length)];
      setLighting(randomLight.id);
    }
    
    // 5. Pick a random composition
    const validComp = compositionOptions.filter(c => c.id !== "none");
    if (validComp.length > 0) {
      const randomComp = validComp[Math.floor(Math.random() * validComp.length)];
      setComposition(randomComp.id);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      addToast("File is too large. Maximum size is 10MB.", "error");
      return;
    }

    try {
      setIsUploading(true);
      const data = await uploadApi.uploadImage(file, activeUseCase);
      setReferenceImage({ url: data.url, id: data.id });
    } catch (err: any) {
      addToast(err.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Lavie AI Image Generator",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "25000"
    }
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": t('faq.q1.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q1.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q2.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q2.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q3.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q3.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q4.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q4.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q5.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q5.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q6.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q6.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q7.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q7.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q8.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q8.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q9.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q9.a')
        }
      },
      {
        "@type": "Question",
        "name": t('faq.q10.q'),
        "acceptedAnswer": {
          "@type": "Answer",
          "text": t('faq.q10.a')
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-indigo-50/30 dark:from-stone-950 dark:via-rose-950/20 dark:to-indigo-950/20">
      <Script id="software-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* Hero Section */}
      <section className="py-10 md:py-16 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto text-center max-w-6xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            Lavie AI Image Generator
          </h1>
          <p className="text-xl md:text-2xl font-semibold max-w-4xl mx-auto mb-3 flex flex-wrap items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
            {t('hero.subtitle')}
          </p>
          <p className="text-lg md:text-xl font-medium max-w-4xl mx-auto mb-8 bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
            {t('hero.description')}
          </p>
          {/* Promise Badges */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-4">
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full"
              style={{ background: 'var(--gen-accent-bg)', color: '#22c55e' }}>
              {t('hero.badges.free')}
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full"
              style={{ background: 'var(--gen-accent-bg)', color: '#3b82f6' }}>
              {t('hero.badges.noLogin')}
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full"
              style={{ background: 'var(--gen-accent-bg)', color: '#f59e0b' }}>
              {t('hero.badges.fast')}
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full"
              style={{ background: 'var(--gen-accent-bg)', color: '#8b5cf6' }}>
              {t('hero.badges.unlimited')}
            </span>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator" className="pt-6 pb-12 md:pt-8 md:pb-16 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          {/* Generator Card with gradient border */}
          <div className="p-[2px] rounded-2xl"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b, #7c3aed)',
              backgroundSize: '200% 200%',
              animation: 'rainbow-gradient 4s ease infinite'
            }}>
            <div className="generator-card rounded-2xl p-6 md:p-8">
              {/* AI Image Generator Title */}
              <h2 className="text-xl font-semibold text-left mb-6" style={{ color: 'var(--gen-text)' }}>
                {t('generator.title')}
              </h2>

              {/* Main form */}
              <div className="space-y-3">
                {/* Image upload + Prompt row */}
                <div className="flex gap-3">
                  {/* Upload Image button */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="relative flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center transition-all group overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #7c3aed20, #f43f5e20)' }}>
                    
                    {referenceImage ? (
                      <>
                        <img src={referenceImage.url} alt="Reference" className="w-full h-full object-cover opacity-60" />
                        <button 
                          onClick={() => setReferenceImage(null)}
                          className="absolute top-0 right-0 p-0.5 bg-black/50 text-white rounded-bl-lg hover:bg-black/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : isUploading ? (
                      <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <UploadCloud className="w-5 h-5 text-rose-500" />
                        <span className="text-[8px] generator-text-muted px-1 text-center leading-tight">Image</span>
                      </button>
                    )}
                  </div>

                  {/* Prompt textarea */}
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      lastPromptEditTime.current = Date.now();
                    }}
                    placeholder={t('generator.promptPlaceholder')}
                    className="flex-1 generator-input focus:outline-none resize-none text-base min-h-[72px] pt-0 px-3 py-2 rounded-xl"
                    rows={3}
                  />
                </div>

                {/* Suggestion Chips */}
                <div className="pl-[70px] flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => setPrompt("A futuristic cyberpunk city with neon lights and flying cars, highly detailed, 8k resolution, cinematic lighting")}
                    className="px-3 py-1.5 rounded-full text-xs transition-colors border border-[var(--gen-border)] text-[var(--gen-text-muted)] hover:text-[var(--gen-text)] hover:border-[var(--gen-text-muted)] bg-[var(--gen-bg)] whitespace-nowrap"
                  >
                    ✨ Cyberpunk City
                  </button>
                  <button
                    onClick={() => setPrompt("A cute fluffy red panda reading a book in a magical forest, studio ghibli style, vibrant colors")}
                    className="px-3 py-1.5 rounded-full text-xs transition-colors border border-[var(--gen-border)] text-[var(--gen-text-muted)] hover:text-[var(--gen-text)] hover:border-[var(--gen-text-muted)] bg-[var(--gen-bg)] whitespace-nowrap"
                  >
                    🐼 Magical Panda
                  </button>
                  <button
                    onClick={() => setPrompt("Minimalist product photography of an elegant perfume bottle on a marble pedestal, soft pastel background, dramatic shadows")}
                    className="px-3 py-1.5 rounded-full text-xs transition-colors border border-[var(--gen-border)] text-[var(--gen-text-muted)] hover:text-[var(--gen-text)] hover:border-[var(--gen-text-muted)] bg-[var(--gen-bg)] whitespace-nowrap"
                  >
                    📸 Product Photo
                  </button>
                  <button
                    onClick={() => setPrompt("A cozy cabin in the snowy mountains at twilight, warm glowing windows, aurora borealis in the sky, highly detailed painting")}
                    className="px-3 py-1.5 rounded-full text-xs transition-colors border border-[var(--gen-border)] text-[var(--gen-text-muted)] hover:text-[var(--gen-text)] hover:border-[var(--gen-text-muted)] bg-[var(--gen-bg)] whitespace-nowrap hidden sm:inline-block"
                  >
                    ❄️ Snowy Cabin
                  </button>
                  <button
                    onClick={() => setPrompt("Close up portrait of a beautiful elven warrior princess with silver hair, intricate armor, fantasy concept art, trending on artstation")}
                    className="px-3 py-1.5 rounded-full text-xs transition-colors border border-[var(--gen-border)] text-[var(--gen-text-muted)] hover:text-[var(--gen-text)] hover:border-[var(--gen-text-muted)] bg-[var(--gen-bg)] whitespace-nowrap hidden md:inline-block"
                  >
                    🧝‍♀️ Fantasy Portrait
                  </button>
                  <button
                    onClick={() => setPrompt("A glass terrarium containing a miniature glowing galaxy and tiny planets, macro photography, magical realism")}
                    className="px-3 py-1.5 rounded-full text-xs transition-colors border border-[var(--gen-border)] text-[var(--gen-text-muted)] hover:text-[var(--gen-text)] hover:border-[var(--gen-text-muted)] bg-[var(--gen-bg)] whitespace-nowrap hidden lg:inline-block"
                  >
                    🌌 Pocket Galaxy
                  </button>
                </div>

                {/* Negative Prompt - below prompt textarea */}
                <div className="pl-[70px] mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNegativePrompt}
                      onChange={(e) => {
                        setShowNegativePrompt(e.target.checked);
                        if (!e.target.checked) setNegativePrompt("");
                      }}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#f43f5e' }}
                    />
                    <span className="text-sm generator-text-muted">{t('generator.negativePrompt')}</span>
                  </label>
                  {showNegativePrompt && (
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="w-full mt-2 px-4 py-2 rounded-lg text-sm focus:outline-none generator-input border"
                      placeholder={t('generator.negativePromptPlaceholder')}
                      autoFocus
                    />
                  )}
                </div>

                {/* Row 1: Ratio, Style, Color, Lighting, Composition */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Ratio */}
                  <DropdownSelector
                    value={(() => {
                      const aspect = resolution[0] / resolution[1];
                      if (Math.abs(aspect - 1) < 0.01) return "1:1";
                      if (Math.abs(aspect - 16/9) < 0.01) return "16:9";
                      if (Math.abs(aspect - 9/16) < 0.01) return "9:16";
                      if (Math.abs(aspect - 4/3) < 0.01) return "4:3";
                      if (Math.abs(aspect - 3/4) < 0.01) return "3:4";
                      if (Math.abs(aspect - 21/9) < 0.01) return "21:9";
                      return "1:1";
                    })()}
                    onChange={(val) => {
                      if (val) {
                        const resolutions: Record<string, [number, number]> = {
                          "1:1": [1024, 1024],
                          "16:9": [1344, 756],
                          "9:16": [768, 1344],
                          "4:3": [1152, 864],
                          "3:4": [896, 1152],
                          "21:9": [1536, 640],
                        };
                        setResolution(resolutions[val] || [1024, 1024]);
                      }
                    }}
                    options={ratioOptions.length > 0 ? ratioOptions : [
                      { id: "1:1", label: "1:1", icon: ratioIcons["1:1"] },
                      { id: "16:9", label: "16:9", icon: ratioIcons["16:9"] },
                      { id: "9:16", label: "9:16", icon: ratioIcons["9:16"] },
                      { id: "4:3", label: "4:3", icon: ratioIcons["4:3"] },
                      { id: "3:4", label: "3:4", icon: ratioIcons["3:4"] },
                      { id: "21:9", label: "21:9", icon: ratioIcons["21:9"] },
                    ]}
                    placeholder="1:1"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    }
                  />

                  {/* Quality */}
                  {model !== 'basic' && (
                    <DropdownSelector
                      value={quality.toString()}
                      onChange={(val) => {
                        if (val) setQuality(parseInt(val) as 1 | 2 | 4);
                      }}
                      options={[
                        { id: "1", label: "Standard (1K)", icon: null },
                        { id: "2", label: "High (2K)", icon: null },
                        { id: "4", label: "Ultra (4K)", icon: null },
                      ]}
                      placeholder="Standard (1K)"
                      icon={
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                        </svg>
                      }
                    />
                  )}

                  {/* Style */}
                  <DropdownSelector
                    value={style}
                    onChange={(val) => {
                      setStyle(val);
                      lastDropdownEditTime.current = Date.now();
                    }}
                    options={styleOptions}
                    placeholder="No Style"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="4"/>
                      </svg>
                    }
                  />

                  {/* Color */}
                  <DropdownSelector
                    value={color}
                    onChange={(val) => {
                      setColor(val);
                      lastDropdownEditTime.current = Date.now();
                    }}
                    options={colorOptions}
                    placeholder="No Color"
                    icon={<span style={{ color: '#f43f5e' }}>●</span>}
                  />

                  {/* Lighting */}
                  <DropdownSelector
                    value={lighting}
                    onChange={(val) => {
                      setLighting(val);
                      lastDropdownEditTime.current = Date.now();
                    }}
                    options={lightingOptions}
                    placeholder="No Light"
                    icon={<span style={{ color: '#f43f5e' }}>☀</span>}
                  />

                  {/* Composition */}
                  <DropdownSelector
                    value={composition}
                    onChange={(val) => {
                      setComposition(val);
                      lastDropdownEditTime.current = Date.now();
                    }}
                    options={compositionOptions}
                    placeholder="No Composition"
                    icon={<span style={{ color: '#f43f5e' }}>▦</span>}
                  />
                </div>

                {/* Resolution Notice */}
                {quality > 1 && model !== 'basic' && (
                  <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-3 py-1.5 rounded-md flex items-center gap-1.5 mb-2 w-full max-w-xl">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    {t('generator.highResNotice') || 'Generating higher resolutions requires significantly more compute and credits.'}
                  </div>
                )}

                {/* Row 2: Clear, Random, Model, Fast Mode, Generate */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Clear */}
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt("");
                      setNegativePrompt("");
                      setShowNegativePrompt(false);
                      setStyle("none");
                      setColor("none");
                      setLighting("none");
                      setComposition("none");
                      setQuality(1);
                    }}
                    className="px-4 h-10 text-sm font-medium rounded-full transition-colors disabled:opacity-50 generator-button"
                    disabled={!prompt && !negativePrompt && style === "none" && color === "none" && lighting === "none" && composition === "none" && quality === 1}
                  >
                    {t('generator.clear')}
                  </button>

                  {/* Random */}
                  <button
                    type="button"
                    onClick={handleSurpriseMe}
                    className="px-4 h-10 text-sm font-medium rounded-full transition-colors generator-accent"
                  >
                    {t('generator.random')}
                  </button>

                  {/* Model */}
                  <DropdownSelector
                    value={model}
                    onChange={(val) => {
                      if (val) {
                        if ((val === 'max' || val === 'ultra') && (!user || user.subscription_type === 'free')) {
                          setUpgradeModalTitle(t('generator.upgradeRequiredTitle') || 'Upgrade Required');
                          setUpgradeModalSubtitle(t('generator.upgradeRequired'));
                          setIsUpgradeModalOpen(true);
                          return;
                        }
                        setModel(val);
                      }
                    }}
                    options={[
                      { id: "basic", label: "Lavie AI Basic" },
                      { id: "pro", label: "Lavie AI Pro" },
                      { id: "max", label: "Lavie AI Max" },
                      { id: "ultra", label: "Lavie AI Ultra" },
                    ]}
                    placeholder="Lavie AI Basic"
                    hideClearOption={true}
                  />

                  {/* Fast Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        openLoginModal();
                        return;
                      }
                      setFastMode(!fastMode);
                    }}
                    className="relative w-10 h-5 rounded-full p-0.5 transition-colors duration-150"
                    style={{ background: fastMode ? 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b)' : 'var(--gen-button-bg)' }}
                  >
                    <span className={`block w-4 h-4 rounded-full shadow transition-transform duration-150 ${fastMode ? 'translate-x-5' : ''}`} style={{ background: fastMode ? '#fff' : 'var(--gen-text-muted)' }} />
                  </button>
                  <span className="text-sm generator-text-muted">{t('generator.fastMode')}</span>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating || (userCredits !== null && userCredits < generationCost)}
                    className="flex-1 px-4 py-2.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/50 hover:opacity-90"
                    style={{
                      background: 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b)',
                      backgroundSize: '200% 200%'
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        {t('generator.generating')}
                      </>
                    ) : (
                      <>
                        {t('generator.generate')}
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          {generationCost} {tCommon('pts')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {isGenerating && (
            <div
              className="mt-4 rounded-2xl border p-4 flex items-center gap-3"
              style={{
                borderColor: 'var(--gen-border)',
                background: 'var(--gen-input-bg)',
              }}
            >
              <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--gen-text)' }}>
                  {t('generator.generating')}
                </p>
                <p className="text-xs" style={{ color: 'var(--gen-text-muted)' }}>
                  Generation is in progress. Please wait, this may take around 10-30 seconds.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>


      {/* Results Display Area — shown when generation is complete */}
      {result && (
        <section className="pb-16 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Bordered results frame */}
            <div className="p-[2px] rounded-2xl mb-6"
              style={{
                background: 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b, #7c3aed)',
                backgroundSize: '200% 200%',
                animation: 'rainbow-gradient 4s ease infinite'
              }}>
              <div className="generator-card rounded-2xl p-6">
                <h3 className="text-base font-semibold text-center mb-4"
                  style={{ color: 'var(--gen-text)' }}>
                  {t('results.title')}
                </h3>
                <GenerationResult
                  imageUrl={result.imageUrl}
                  prompt={prompt}
                  style={style}
                  width={resolution[0]}
                  height={resolution[1]}
                  onRegenerate={handleRegenerate}
                />
              </div>
            </div>

            {/* Upgrade Prompt Banner (Free/Guest only) */}
            {shouldShowFreePlanBanner && (
              <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-rose-100 to-amber-100 border border-rose-200 dark:from-rose-950/40 dark:to-amber-950/40 dark:border-rose-900">
                <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-base mb-0.5 text-rose-900 dark:text-rose-200">
                      {t('results.freePlan')}
                    </p>
                    <p className="text-sm text-rose-700 dark:text-rose-300/80">
                      {t('results.upgradePrompt')}
                    </p>
                  </div>
                  <a
                    href="/pricing"
                    className="flex-shrink-0 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90 text-white shadow-lg shadow-rose-200/50 dark:shadow-rose-900/50"
                    style={{
                      background: 'linear-gradient(135deg, #f43f5e, #f59e0b)',
                    }}
                  >
                    {t('results.upgradeBtn')}
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      
      {/* Text To Image Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>
              {t('homepage.textToImage.title')}
            </h2>
            <span className="text-base" style={{ color: 'var(--gen-text-muted)' }}>
              {t('homepage.textToImage.subtitle')}
            </span>
          </div>
          
          <div className="mb-12">
            <TryStyleCards onSelectStyle={handleSelectStyle} />
          </div>
          
          <GalleryShowcase onUsePrompt={handleUsePrompt} />
        </div>
      </section>

      {/* Image To Image & Feature Discovery Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          {/* Main H2 for the entire Image to Image suite */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>
              {t('homepage.imageToImage.title')}
            </h2>
            <span className="text-base" style={{ color: 'var(--gen-text-muted)' }}>
              {t('homepage.imageToImage.subtitle')}
            </span>
          </div>
          
          {/* Top 6 Interactive Showcase */}
          <InteractiveI2IShowcase
            onSelectUseCase={handleSelectUseCase}
            pricingPreviewMap={useCasePricingPreviewMap}
          />

          {/*
          暂时注释保留：原 Transform Your Image / Explore More 区块
          已将 ghibliStyle、pixarStyle、ps2Retro、gtaStyle、legoStyle、turnIntoCyborg、
          pixelArt、pencilSketch、petRoyalPainting 迁移到 Before/After 区域。

          <div className="mt-20 mb-8 flex items-center justify-between">
            <span className="text-2xl font-bold block" style={{ color: 'var(--gen-text)' }}>
              {t('homepage.exploreMore.title')}
            </span>
          </div>
          <p className="mb-8 text-base" style={{ color: 'var(--gen-text-muted)' }}>
            {t('homepage.exploreMore.subtitle')}
          </p>

          <FeatureDiscoveryGrid onSelectUseCase={handleSelectUseCase} />
          */}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--gen-text)' }}>{t('features.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                  <span className="text-2xl">💰</span>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--gen-text)' }}>{t('features.free.title')}</h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('features.free.desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--gen-text)' }}>{t('features.quality.title')}</h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('features.quality.desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--gen-text)' }}>{t('features.understanding.title')}</h3>
              </div>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('features.understanding.desc')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>{t('features.speed.title')}</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('features.speed.desc')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>{t('features.privacy.title')}</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('features.privacy.desc')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>{t('features.styles.title')}</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('features.styles.desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-12" style={{ color: 'var(--gen-text)' }}>{t('howItWorks.title')}</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-rose-300 to-transparent dark:via-rose-800 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex-1 max-w-xs w-full">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/40 dark:to-fuchsia-900/40 rounded-full flex items-center justify-center mb-6 shadow-lg border border-violet-200 dark:border-violet-800/50">
                <span className="text-4xl">✍️</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('howItWorks.step1.title')}</h3>
              <p className="text-base" style={{ color: 'var(--gen-text-muted)' }}>{t('howItWorks.step1.desc')}</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex-1 max-w-xs w-full">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-100 to-orange-100 dark:from-rose-900/40 dark:to-orange-900/40 rounded-full flex items-center justify-center mb-6 shadow-lg border border-rose-200 dark:border-rose-800/50">
                <span className="text-4xl">🎨</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('howItWorks.step2.title')}</h3>
              <p className="text-base" style={{ color: 'var(--gen-text-muted)' }}>{t('howItWorks.step2.desc')}</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex-1 max-w-xs w-full">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-100 to-emerald-100 dark:from-amber-900/40 dark:to-emerald-900/40 rounded-full flex items-center justify-center mb-6 shadow-lg border border-amber-200 dark:border-amber-800/50">
                <span className="text-4xl">✨</span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('howItWorks.step3.title')}</h3>
              <p className="text-base" style={{ color: 'var(--gen-text-muted)' }}>{t('howItWorks.step3.desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {/* 暂时去除20260324 */}
      {/* <section className="py-12 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--gen-text)' }}>3M+</div>
              <div className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>Monthly Active Users</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--gen-text)' }}>1,530</div>
              <div className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>Images Generated/min</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--gen-text)' }}>4.9</div>
              <div className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>Average Quality Score</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1" style={{ color: 'var(--gen-text)' }}>25K+</div>
              <div className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>Happy Users</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Testimonials Section */}
      <section className="py-16 px-4 overflow-hidden relative" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-6xl relative">
          <h2 className="text-3xl font-bold text-center mb-10 relative z-10" style={{ color: 'var(--gen-text)' }}>{t('testimonials.title')}</h2>
          
          {/* Top and Bottom gradient masks for the smooth fade effect */}
          <div className="absolute top-[80px] left-0 right-0 h-24 bg-gradient-to-b from-[var(--gen-bg)] to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--gen-bg)] to-transparent z-10 pointer-events-none" />

          {/* Marquee container */}
          <div className="h-[600px] overflow-hidden relative flex gap-6 justify-center">
            {/* Column 1 (Scrolls UP) */}
            <div className="w-full md:w-1/3 flex flex-col gap-6 animate-marquee-vertical" style={{ animationDuration: '45s' }}>
              {[1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6].map((item, i) => (
                <div key={`col1-${i}`} className="p-6 rounded-2xl shadow-md border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
                  <div className="flex items-center gap-1 mb-3"><span className="text-amber-400">★★★★★</span></div>
                  <p className="text-sm mb-4" style={{ color: 'var(--gen-text-muted)' }}>"{t(`testimonials.t${item}.text` as any)}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[item % avatarGradients.length]} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {t(`testimonials.t${item}.name` as any).charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--gen-text)' }}>{t(`testimonials.t${item}.name` as any)}</div>
                      <div className="text-xs" style={{ color: 'var(--gen-text-muted)' }}>{t(`testimonials.t${item}.role` as any)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2 (Scrolls UP) - hidden on mobile */}
            <div className="hidden md:flex w-1/3 flex-col gap-6 animate-marquee-vertical" style={{ animationDuration: '60s' }}>
              {/* Start with a different offset to break alignment */}
              <div className="h-12"></div>
              {[7, 8, 9, 10, 11, 12, 7, 8, 9, 10, 11, 12].map((item, i) => (
                <div key={`col2-${i}`} className="p-6 rounded-2xl shadow-md border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
                  <div className="flex items-center gap-1 mb-3"><span className="text-amber-400">★★★★★</span></div>
                  <p className="text-sm mb-4" style={{ color: 'var(--gen-text-muted)' }}>"{t(`testimonials.t${item}.text` as any)}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[item % avatarGradients.length]} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {t(`testimonials.t${item}.name` as any).charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--gen-text)' }}>{t(`testimonials.t${item}.name` as any)}</div>
                      <div className="text-xs" style={{ color: 'var(--gen-text-muted)' }}>{t(`testimonials.t${item}.role` as any)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Column 3 (Scrolls UP) - hidden on tablet/mobile if needed, or just shown on lg */}
            <div className="hidden lg:flex w-1/3 flex-col gap-6 animate-marquee-vertical" style={{ animationDuration: '40s' }}>
              {[13, 14, 15, 16, 17, 18, 13, 14, 15, 16, 17, 18].map((item, i) => (
                <div key={`col3-${i}`} className="p-6 rounded-2xl shadow-md border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
                  <div className="flex items-center gap-1 mb-3"><span className="text-amber-400">★★★★★</span></div>
                  <p className="text-sm mb-4" style={{ color: 'var(--gen-text-muted)' }}>"{t(`testimonials.t${item}.text` as any)}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${avatarGradients[item % avatarGradients.length]} rounded-full flex items-center justify-center text-white font-semibold`}>
                      {t(`testimonials.t${item}.name` as any).charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: 'var(--gen-text)' }}>{t(`testimonials.t${item}.name` as any)}</div>
                      <div className="text-xs" style={{ color: 'var(--gen-text-muted)' }}>{t(`testimonials.t${item}.role` as any)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--gen-text)' }}>{t('faq.title')}</h2>
            <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>{t('faq.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={`faq-${i}`} className="rounded-xl border p-4" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
                <h3 className="font-medium mb-2 flex items-start gap-2" style={{ color: 'var(--gen-text)' }}>
                  <span style={{ color: '#8b5cf6' }}>{i}.</span>
                  <span>{t(`faq.q${i}.q` as any)}</span>
                </h3>
                <div className="text-sm pl-5" style={{ color: 'var(--gen-text-muted)' }}>
                  {t(`faq.q${i}.a` as any)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4 relative overflow-hidden" style={{ background: 'var(--gen-bg)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05), rgba(244, 63, 94, 0.05), rgba(245, 158, 11, 0.05))' }} />
        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight" style={{ color: 'var(--gen-text)' }}>
            {t('cta.title')}
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: 'var(--gen-text-muted)' }}>
            {t('cta.desc')}
          </p>
          <button 
            onClick={() => {
              const generatorSection = document.getElementById('generator');
              if (generatorSection) {
                generatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="px-8 py-4 rounded-full font-bold text-lg transition-all text-white shadow-xl hover:scale-105 hover:shadow-2xl mb-12"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b)',
              backgroundSize: '200% 200%',
              animation: 'rainbow-gradient 4s ease infinite'
            }}
          >
            {t('cta.button')}
          </button>
        </div>
      </section>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title={upgradeModalTitle}
        subtitle={upgradeModalSubtitle}
      />

      {isUseCaseUploadModalOpen && pendingUseCaseData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border p-5" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--gen-text)' }}>{pendingUseCaseTitle}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--gen-text-muted)' }}>
                  {pendingUseCaseImage ? t('generator.useCaseUploadModal.ready') : t('generator.useCaseUploadModal.subtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUseCaseUploadModalOpen(false);
                  setPendingUseCaseData(null);
                  setPendingUseCasePricingPreview(null);
                }}
                className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl border p-3 mb-4" style={{ borderColor: 'var(--gen-border)' }}>
              <div className="flex items-center justify-between text-sm mt-2">
                {isLoadingPendingUseCasePricing ? (
                  <>
                    <span style={{ color: 'var(--gen-text-muted)' }}>Pricing</span>
                    <span className="font-semibold" style={{ color: 'var(--gen-text)' }}>Checking...</span>
                  </>
                ) : isPendingUseCaseTrialEligible ? (
                  <>
                    <span style={{ color: 'var(--gen-text-muted)' }}>
                      {pendingUseCasePricingPreview?.trial_audience === 'visitor' ? 'Try Free' : 'Free Trial'}
                    </span>
                    <span className="font-semibold" style={{ color: 'var(--gen-text)' }}>
                      {pendingUseCaseTrialRemaining}
                    </span>
                  </>
                ) : pendingUseCasePricingPreview?.login_required_for_trial && !user ? (
                  <>
                    <span style={{ color: 'var(--gen-text-muted)' }}>Free trial</span>
                    <button
                      type="button"
                      onClick={() => openLoginModal()}
                      className="font-semibold underline underline-offset-2"
                      style={{ color: 'var(--gen-text)' }}
                    >
                      Login for trial
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ color: 'var(--gen-text-muted)' }}>{t('generator.useCaseUploadModal.cost')}</span>
                    <span className="font-semibold" style={{ color: 'var(--gen-text)' }}>
                      {pendingUseCaseCost} {tCommon('pts')}
                    </span>
                  </>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={useCaseFileInputRef}
              onChange={handleUseCaseFileUpload}
              accept="image/*"
              className="hidden"
            />
            {!pendingUseCaseImage && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => useCaseFileInputRef.current?.click()}
                  disabled={isUseCaseUploading}
                  className="flex-1 px-4 py-2.5 rounded-full font-semibold transition-all text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b)' }}
                >
                  {isUseCaseUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('generator.useCaseUploadModal.uploading')}
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      {t('generator.useCaseUploadModal.chooseImage')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUseCaseUploadModalOpen(false);
                    setPendingUseCaseData(null);
                    setPendingUseCasePricingPreview(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-full font-semibold transition-all border"
                  style={{ borderColor: 'var(--gen-border)', color: 'var(--gen-text)' }}
                >
                  {t('generator.useCaseUploadModal.cancel')}
                </button>
              </div>
            )}

            {pendingUseCaseImage && (
              <div
                className="w-full h-56 rounded-xl border mt-3 p-2 flex items-center justify-center overflow-hidden relative"
                style={{ borderColor: 'var(--gen-border)', background: 'var(--gen-input-bg)' }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setPendingUseCaseImage(null);
                    setRecentUseCaseImage(null);
                    const storageKey = recentUseCaseStorageKeyRef.current || `${RECENT_USECASE_IMAGE_KEY_PREFIX}:guest:unknown`;
                    localStorage.removeItem(storageKey);
                  }}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 text-white hover:bg-black/80 flex items-center justify-center"
                  aria-label={t('generator.useCaseUploadModal.removeImage')}
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={pendingUseCaseImage.url}
                  alt="Selected"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {pendingUseCaseImage && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGeneratePendingUseCase}
                    disabled={isUseCaseUploading || isGenerating || isLoadingPendingUseCasePricing || !hasEnoughPendingUseCaseCredits}
                    className="flex-1 px-4 py-2.5 rounded-full font-semibold transition-all text-white disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(90deg, #111827, #374151)' }}
                  >
                    {t('generator.generate')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUseCaseUploadModalOpen(false);
                      setPendingUseCaseData(null);
                      setPendingUseCasePricingPreview(null);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-full font-semibold transition-all border"
                    style={{ borderColor: 'var(--gen-border)', color: 'var(--gen-text)' }}
                  >
                    {t('generator.useCaseUploadModal.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
