"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  DropdownSelector,
  TryStyleCards,
  GalleryShowcase,
  GenerationResult,
} from "@/components/generator";
import { generateApi, pollTaskStatus, userApi, configApi } from "@/lib/api-client";
import Script from "next/script";

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
  "none": "○", "vibrant": "●", "muted": "◌", "warm": "◐", "cool": "◑",
  "pastel": "◔", "monochrome": "◑", "neon": "◈",
};

const lightingIcons: Record<string, string> = {
  "none": "○", "soft": "◐", "dramatic": "◈", "golden-hour": "◐", "blue-hour": "◑",
  "studio": "●", "natural": "☀", "neon": "◈",
};

const compositionIcons: Record<string, string> = {
  "none": "○", "centered": "⊕", "rule-of-thirds": "▦", "diagonal": "⤡",
  "symmetrical": "⊗", "frame": "⊞", "leading": "↗", "depth": "◫",
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

export default function Home() {
  const t = useTranslations("home");
  const tGallery = useTranslations("gallery");
  const tCommon = useTranslations("common");

  // Dynamic options from API
  const [styleOptions, setStyleOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [colorOptions, setColorOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [lightingOptions, setLightingOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [compositionOptions, setCompositionOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [ratioOptions, setRatioOptions] = useState<Array<{ id: string; label: string }>>([]);

  // Generator state
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [style, setStyle] = useState<string | null>(null);
  const [resolution, setResolution] = useState<[number, number]>([1024, 1024]);
  const [color, setColor] = useState<string | null>(null);
  const [lighting, setLighting] = useState<string | null>(null);
  const [composition, setComposition] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string } | null>(null);

  // Generator extra state
  const [fastMode, setFastMode] = useState(false);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);

  // User points state
  const [userCredits, setUserCredits] = useState<number | null>(null);

  useEffect(() => {
    // Fetch user credits on mount
    userApi.getPoints()
      .then(data => setUserCredits(data?.credits ?? null))
      .catch(() => setUserCredits(null));

    // Fetch generation options from API (styles, colors, etc.)
    configApi.getGenerationOptions().then(options => {
      if (options) {
        setStyleOptions(options.styles.map(s => ({ ...s, icon: styleIcons[s.id] || "○" })));
        setColorOptions(options.colors.map(c => ({ ...c, icon: colorIcons[c.id] || "○" })));
        setLightingOptions(options.lighting.map(l => ({ ...l, icon: lightingIcons[l.id] || "○" })));
        setCompositionOptions(options.composition.map(c => ({ ...c, icon: compositionIcons[c.id] || "○" })));
        setRatioOptions(options.ratios.map(r => ({ id: r.id, label: r.label })));
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

  // Generation cost based on model tier
  const generationCost = fastMode ? 5 : 10;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (userCredits !== null && userCredits < generationCost) {
      alert(t('generator.notEnoughCredits', { cost: generationCost }));
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const task = await generateApi.textToImage({
        prompt,
        negative_prompt: showNegativePrompt ? negativePrompt : undefined,
        style: style || undefined,
        resolution,
        model: fastMode ? 'basic' : 'basic', // TODO: based on user tier
      });

      const completedTask = await pollTaskStatus(
        task.id,
        (t) => {
          if (t.status === 'processing') {
            // Could show progress here
          }
        },
        2000,
        60
      );

      if (completedTask.result_url) {
        setResult({ imageUrl: completedTask.result_url });
        // Refresh credits
        const credits = await userApi.getPoints();
        setUserCredits(credits?.credits ?? null);
      }
    } catch (error) {
      console.error("Generation error:", error);
      alert(error instanceof Error ? error.message : t('generator.generationFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

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

  const randomPrompts = [
    "A serene Japanese garden with cherry blossoms, soft morning light",
    "Cyberpunk cityscape at night with neon signs reflecting on wet streets",
    "A cozy coffee shop interior with warm lighting and plants",
    "Majestic dragon flying over misty mountains at sunset",
    "Abstract geometric art with vibrant colors and patterns",
    "A photorealistic cat portrait with expressive eyes",
    "Peaceful beach scene with palm trees and crystal clear water",
    "Steampunk mechanical owl with brass gears and copper feathers",
  ];

  const handleSurpriseMe = () => {
    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    setPrompt(randomPrompt);
    // Also randomly set style
    const randomStyle = styleOptions[Math.floor(Math.random() * styleOptions.length)];
    if (randomStyle.id !== "none") {
      setStyle(randomStyle.id);
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
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-indigo-50/30 dark:from-stone-950 dark:via-rose-950/20 dark:to-indigo-950/20">
      <Script id="software-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* Hero Section */}
      <section className="py-10 md:py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
            Lavie AI Image Generator
          </h1>
          <p className="text-xl md:text-2xl font-semibold max-w-2xl mx-auto mb-3 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
            {t('hero.subtitle')}
          </p>
          <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-8 bg-gradient-to-r from-violet-600 via-rose-500 to-amber-500 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
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
      <section id="generator" className="pt-6 pb-12 md:pt-8 md:pb-16 px-4">
        <div className="container mx-auto max-w-5xl">
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
                  <button
                    type="button"
                    className="flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed20, #f43f5e20)',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                    </svg>
                    <span className="text-[8px] generator-text-muted">{t('generator.imageUpload')}</span>
                  </button>

                  {/* Prompt textarea */}
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
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
                      { id: "1:1", label: "1:1 (1024×1024)" },
                      { id: "16:9", label: "16:9 (1344×756)" },
                      { id: "9:16", label: "9:16 (768×1344)" },
                      { id: "4:3", label: "4:3 (1152×864)" },
                      { id: "3:4", label: "3:4 (896×1152)" },
                      { id: "21:9", label: "21:9 (1536×640)" },
                    ]}
                    placeholder="1:1"
                  />

                  {/* Style */}
                  <DropdownSelector
                    value={style}
                    onChange={setStyle}
                    options={styleOptions}
                    placeholder={t('generator.style')}
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
                    onChange={setColor}
                    options={colorOptions}
                    placeholder={t('generator.color')}
                    icon={<span style={{ color: '#f43f5e' }}>●</span>}
                  />

                  {/* Lighting */}
                  <DropdownSelector
                    value={lighting}
                    onChange={setLighting}
                    options={lightingOptions}
                    placeholder={t('generator.lighting')}
                    icon={<span style={{ color: '#f43f5e' }}>☀</span>}
                  />

                  {/* Composition */}
                  <DropdownSelector
                    value={composition}
                    onChange={setComposition}
                    options={compositionOptions}
                    placeholder={t('generator.composition')}
                    icon={<span style={{ color: '#f43f5e' }}>▦</span>}
                  />
                </div>

                {/* Row 2: Clear, Random, Model, Fast Mode, Generate */}
                <div className="flex flex-wrap gap-2 items-center">
                  {/* Clear */}
                  <button
                    type="button"
                    onClick={() => setPrompt("")}
                    className="px-4 h-10 text-sm font-medium rounded-full transition-colors disabled:opacity-50 generator-button"
                    disabled={!prompt}
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
                    value="basic"
                    onChange={() => {}}
                    options={[
                      { id: "basic", label: "Basic" },
                      { id: "pro", label: "Pro" },
                    ]}
                    placeholder="Basic"
                  />

                  {/* Fast Mode */}
                  <button
                    type="button"
                    onClick={() => setFastMode(!fastMode)}
                    className="relative w-10 h-5 rounded-full p-0.5 transition-colors duration-150"
                    style={{ background: fastMode ? 'linear-gradient(90deg, #7c3aed, #f43f5e, #f59e0b)' : 'var(--gen-button-bg)' }}
                  >
                    <span className={`block w-4 h-4 rounded-full shadow transition-transform duration-150`} style={{ background: fastMode ? '#fff' : 'var(--gen-text-muted)' }} />
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
        </div>
      </section>


      {/* Results Display Area — shown when generation is complete */}
      {result && (
        <section className="pb-16 px-4">
          <div className="container mx-auto max-w-5xl">
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
                  onRegenerate={handleGenerate}
                />
              </div>
            </div>

            {/* Upgrade Prompt Banner */}
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
          </div>
        </section>
      )}
      
      {/* Gallery Section */}
      <section className="py-12 px-4" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <GalleryShowcase onUsePrompt={handleUsePrompt} />
        </div>
      </section>

      {/* Try a Style Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <TryStyleCards onSelectStyle={handleSelectStyle} />
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--gen-text)' }}>{t('useCases.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Designer */}
            <div className="group relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}
              onClick={() => handleUsePrompt("Professional UI/UX design for a modern mobile banking app, clean interface, glassmorphism, dribbble style, high resolution")}
            >
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#ec4899' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('useCases.designers.title')}</h3>
                <p className="text-base mb-6" style={{ color: 'var(--gen-text-muted)' }}>{t('useCases.designers.desc')}</p>
                <div className="flex items-center text-sm font-medium text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tGallery('generateSimilar')} <span className="ml-1">→</span>
                </div>
              </div>
            </div>

            {/* Marketers */}
            <div className="group relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}
              onClick={() => handleUsePrompt("A vibrant and eye-catching social media banner for a summer music festival, bold typography, energetic colors, abstract shapes")}
            >
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#3b82f6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('useCases.marketers.title')}</h3>
                <p className="text-base mb-6" style={{ color: 'var(--gen-text-muted)' }}>{t('useCases.marketers.desc')}</p>
                <div className="flex items-center text-sm font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tGallery('generateSimilar')} <span className="ml-1">→</span>
                </div>
              </div>
            </div>

            {/* Content Creators */}
            <div className="group relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}
              onClick={() => handleUsePrompt("Epic fantasy book cover illustration, a lone warrior facing a massive dragon on a volcanic peak, dramatic lighting, highly detailed")}
            >
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#8b5cf6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('useCases.creators.title')}</h3>
                <p className="text-base mb-6" style={{ color: 'var(--gen-text-muted)' }}>{t('useCases.creators.desc')}</p>
                <div className="flex items-center text-sm font-medium text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tGallery('generateSimilar')} <span className="ml-1">→</span>
                </div>
              </div>
            </div>

            {/* E-commerce */}
            <div className="group relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}
              onClick={() => handleUsePrompt("Minimalist product photography background, marble podium with soft morning sunlight, palm leaf shadow, elegant pastel colors")}
            >
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#10b981' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('useCases.ecommerce.title')}</h3>
                <p className="text-base mb-6" style={{ color: 'var(--gen-text-muted)' }}>{t('useCases.ecommerce.desc')}</p>
                <div className="flex items-center text-sm font-medium text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tGallery('generateSimilar')} <span className="ml-1">→</span>
                </div>
              </div>
            </div>

            {/* Game Developers */}
            <div className="group relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}
              onClick={() => handleUsePrompt("Isometric 2D game asset, a magical potion shop in a fantasy village, glowing crystals, stylized hand-painted texture")}
            >
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#f59e0b' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('useCases.gameDev.title')}</h3>
                <p className="text-base mb-6" style={{ color: 'var(--gen-text-muted)' }}>{t('useCases.gameDev.desc')}</p>
                <div className="flex items-center text-sm font-medium text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tGallery('generateSimilar')} <span className="ml-1">→</span>
                </div>
              </div>
            </div>

            {/* Educators */}
            <div className="group relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}
              onClick={() => handleUsePrompt("An educational illustration of the solar system, colorful planets orbiting the sun, clear labels, child-friendly style, 8k")}
            >
              <div className="p-8">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <svg className="w-6 h-6" style={{ color: '#06b6d4' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--gen-text)' }}>{t('useCases.educators.title')}</h3>
                <p className="text-base mb-6" style={{ color: 'var(--gen-text-muted)' }}>{t('useCases.educators.desc')}</p>
                <div className="flex items-center text-sm font-medium text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {tGallery('generateSimilar')} <span className="ml-1">→</span>
                </div>
              </div>
            </div>
          </div>
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
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>{t('features.free.title')}</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('features.free.desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>{t('features.quality.title')}</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('features.quality.desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>{t('features.understanding.title')}</h3>
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
      <section className="py-16 px-4" style={{ background: 'var(--gen-bg)' }}>
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
      <section className="py-16 px-4 overflow-hidden relative" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-6xl relative">
          <h2 className="text-3xl font-bold text-center mb-10 relative z-10" style={{ color: 'var(--gen-text)' }}>{t('testimonials.title')}</h2>
          
          {/* Top and Bottom gradient masks for the smooth fade effect */}
          <div className="absolute top-[80px] left-0 right-0 h-24 bg-gradient-to-b from-[var(--gen-input-bg)] to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--gen-input-bg)] to-transparent z-10 pointer-events-none" />

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
      <section className="py-16 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-10" style={{ color: 'var(--gen-text)' }}>{t('faq.title')}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {/* FAQ 1 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>{t('faq.q1.q')}</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180 flex-shrink-0 ml-4">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('faq.q1.a')}
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>{t('faq.q2.q')}</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180 flex-shrink-0 ml-4">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('faq.q2.a')}
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>{t('faq.q3.q')}</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180 flex-shrink-0 ml-4">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('faq.q3.a')}
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>{t('faq.q4.q')}</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180 flex-shrink-0 ml-4">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('faq.q4.a')}
              </div>
            </details>

            {/* FAQ 5 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>{t('faq.q5.q')}</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180 flex-shrink-0 ml-4">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('faq.q5.a')}
              </div>
            </details>

            {/* FAQ 6 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>{t('faq.q6.q')}</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180 flex-shrink-0 ml-4">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                {t('faq.q6.a')}
              </div>
            </details>
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
    </div>
  );
}
