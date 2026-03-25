"use client";

import { useState, useEffect } from "react";
import {
  DropdownSelector,
  TryStyleCards,
  GalleryShowcase,
  RecommendedPrompts,
  GenerationResult,
} from "@/components/generator";
import { generateApi, pollTaskStatus, userApi, configApi } from "@/lib/api-client";

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

export default function Home() {
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
      alert(`Not enough credits. You need ${generationCost} credits to generate.`);
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
      alert(error instanceof Error ? error.message : "Generation failed. Please try again.");
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-6 md:py-10 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3"
            style={{
              background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 25%, #3b82f6 55%, #8b5cf6 80%, #c4b5fd 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            Lavie AI Image Generator
          </h1>
          <p className="text-xl md:text-2xl font-semibold max-w-2xl mx-auto mb-2 flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(90deg, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'rainbow-gradient 4s ease infinite'
            }}>
            ✨ Create stunning images in seconds
          </p>
          <p className="text-lg md:text-xl font-medium max-w-2xl mx-auto mb-6"
            style={{
              background: 'linear-gradient(90deg, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'rainbow-gradient 4s ease infinite'
            }}>
            Dream it. Create it. Share it.
          </p>
          {/* Promise Badges */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-4">
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full"
              style={{ background: 'var(--gen-accent-bg)', color: '#22c55e' }}>
              100% Free
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full"
              style={{ background: 'var(--gen-accent-bg)', color: '#3b82f6' }}>
              No Login Required
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full"
              style={{ background: 'var(--gen-accent-bg)', color: '#f59e0b' }}>
              Lightning Fast
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full"
              style={{ background: 'var(--gen-accent-bg)', color: '#8b5cf6' }}>
              Unlimited Generations
            </span>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generator" className="pt-6 pb-12 md:pt-8 md:pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Generator Card with gradient border */}
          <div className="p-[2px] rounded-2xl"
            style={{
              background: 'linear-gradient(90deg, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
              backgroundSize: '200% 200%',
              animation: 'rainbow-gradient 4s ease infinite'
            }}>
            <div className="generator-card rounded-2xl p-6 md:p-8">
              {/* AI Image Generator Title */}
              <h2 className="text-xl font-semibold text-left mb-6" style={{ color: 'var(--gen-text)' }}>
                AI Image Generator
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
                      background: 'linear-gradient(135deg, #f59e0b20, #10b98120)',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
                    </svg>
                    <span className="text-[8px] generator-text-muted">Image</span>
                  </button>

                  {/* Prompt textarea */}
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="flex-1 generator-input focus:outline-none resize-none text-base min-h-[72px] pt-0 px-3 py-2 rounded-xl"
                    rows={3}
                  />
                </div>

                {/* Negative Prompt - below prompt textarea */}
                <div className="pl-[70px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNegativePrompt}
                      onChange={(e) => {
                        setShowNegativePrompt(e.target.checked);
                        if (!e.target.checked) setNegativePrompt("");
                      }}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: '#f59e0b' }}
                    />
                    <span className="text-sm generator-text-muted">Negative prompt</span>
                  </label>
                  {showNegativePrompt && (
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="w-full mt-2 px-4 py-2 rounded-lg text-sm focus:outline-none generator-input border"
                      placeholder="What to avoid..."
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
                    onChange={setColor}
                    options={colorOptions}
                    placeholder="Color"
                    icon={<span style={{ color: '#f59e0b' }}>●</span>}
                  />

                  {/* Lighting */}
                  <DropdownSelector
                    value={lighting}
                    onChange={setLighting}
                    options={lightingOptions}
                    placeholder="Light"
                    icon={<span style={{ color: '#f59e0b' }}>☀</span>}
                  />

                  {/* Composition */}
                  <DropdownSelector
                    value={composition}
                    onChange={setComposition}
                    options={compositionOptions}
                    placeholder="Compose"
                    icon={<span style={{ color: '#f59e0b' }}>▦</span>}
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
                    Clear
                  </button>

                  {/* Random */}
                  <button
                    type="button"
                    onClick={handleSurpriseMe}
                    className="px-4 h-10 text-sm font-medium rounded-full transition-colors generator-accent"
                  >
                    Random
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
                    style={{ background: fastMode ? 'linear-gradient(90deg, #f59e0b, #10b981, #3b82f6)' : 'var(--gen-button-bg)' }}
                  >
                    <span className={`block w-4 h-4 rounded-full shadow transition-transform duration-150`} style={{ background: fastMode ? '#fff' : 'var(--gen-text-muted)' }} />
                  </button>
                  <span className="text-sm generator-text-muted">Fast</span>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating || (userCredits !== null && userCredits < generationCost)}
                    className="flex-1 px-4 py-2.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(90deg, #f59e0b, #10b981, #3b82f6)',
                      color: '#0f0f0f',
                      backgroundSize: '200% 200%'
                    }}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        Generate
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'rgba(0,0,0,0.2)' }}>
                          {generationCost} pts
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
          <div className="container mx-auto max-w-4xl">
            {/* Bordered results frame */}
            <div className="p-[2px] rounded-2xl mb-6"
              style={{
                background: 'linear-gradient(90deg, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899, #f59e0b)',
                backgroundSize: '200% 200%',
                animation: 'rainbow-gradient 4s ease infinite'
              }}>
              <div className="generator-card rounded-2xl p-6">
                <h3 className="text-base font-semibold text-center mb-4"
                  style={{ color: 'var(--gen-text)' }}>
                  Generated Image
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
            <div className="rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #fed7aa, #fecaca)',
                border: '1px solid #fca5a5'
              }}>
              <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-base mb-0.5" style={{ color: '#9a3412' }}>
                    You're using the Free Plan
                  </p>
                  <p className="text-sm" style={{ color: '#c2410c' }}>
                    Upgrade to Premium for 5x faster speed, better quality &amp; ad-free experience
                  </p>
                </div>
                <a
                  href="/pricing"
                  className="flex-shrink-0 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    color: '#fff',
                    boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  Upgrade Now
                </a>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Gallery Section with Use Case filtering */}
      <section className="py-12 px-4" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-4xl">
          <GalleryShowcase onUsePrompt={handleUsePrompt} />
        </div>
      </section>


      {/* Try a Style Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <TryStyleCards onSelectStyle={handleSelectStyle} />
        </div>
      </section>

      {/* Recommended Prompts Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <RecommendedPrompts onUsePrompt={handleUsePrompt} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--gen-text)' }}>Why Choose Lavie AI</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>Zero-Cost Creation</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                World's first completely free AI image generator. No hidden fees, no subscriptions required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>State-of-the-Art Quality</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                Smart routing selects the optimal model for your prompts, ensuring exceptional image quality.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>Advanced Text Understanding</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                Accurately interprets complex prompts with multiple subjects, styles, and descriptions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>Lightning-Fast Generation</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                Optimized inference pipeline delivers results in seconds, not minutes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>Enhanced Privacy</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                Zero data retention policy. Your prompts are never stored or used for training.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl shadow-lg border transition-shadow"
              style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)', boxShadow: 'var(--gen-border)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(236, 72, 153, 0.1)' }}>
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--gen-text)' }}>Multi-Style Support</h3>
              <p className="text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                From photorealistic to anime, oil painting to cyberpunk — 32 styles to explore.
              </p>
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
      <section className="py-16 px-4" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-10" style={{ color: 'var(--gen-text)' }}>What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="p-6 rounded-2xl shadow-md border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-amber-400">★★★★★</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--gen-text-muted)' }}>
                "Absolutely incredible! The image quality is amazing and it's completely free. I've tried many AI generators but this is by far the best."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white font-semibold">
                  S
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--gen-text)' }}>Sarah Chen</div>
                  <div className="text-xs" style={{ color: 'var(--gen-text-muted)' }}>Digital Artist</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-6 rounded-2xl shadow-md border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-amber-400">★★★★★</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--gen-text-muted)' }}>
                "The variety of styles is outstanding. From anime to photorealistic, it handles everything perfectly. My go-to tool for creative projects."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--gen-text)' }}>Marcus Webb</div>
                  <div className="text-xs" style={{ color: 'var(--gen-text-muted)' }}>Game Developer</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-6 rounded-2xl shadow-md border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <div className="flex items-center gap-1 mb-3">
                <span className="text-amber-400">★★★★★</span>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--gen-text-muted)' }}>
                "No login required and completely free! Perfect for quick experiments and brainstorming. The generation speed is impressive."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                  E
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--gen-text)' }}>Emily Park</div>
                  <div className="text-xs" style={{ color: 'var(--gen-text-muted)' }}>Marketing Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10" style={{ color: 'var(--gen-text)' }}>Frequently Asked Questions</h2>
          <div className="space-y-4">
            {/* FAQ 1 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>Is Lavie AI really free to use?</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                Yes! Lavie AI is completely free to use. We offer free daily credits so you can generate images without any payment. No credit card required.
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>Do I need to create an account?</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                No login is required! You can start generating images immediately. However, creating an account lets you save your generation history and access more features.
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>What image styles are available?</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                We offer 32 different art styles including Photorealistic, Anime, Oil Painting, Watercolor, Sketch, 3D Render, Cyberpunk, Fantasy, and many more. New styles are added regularly.
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>How fast can I generate an image?</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                With Fast Mode enabled, most images are generated in just a few seconds. Standard generation typically takes 10-30 seconds depending on complexity and server load.
              </div>
            </details>

            {/* FAQ 5 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>Can I use generated images commercially?</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                Yes! Images you generate with Lavie AI can be used for personal and commercial purposes. You retain full ownership of the images you create.
              </div>
            </details>

            {/* FAQ 6 */}
            <details className="group rounded-xl border" style={{ background: 'var(--gen-bg)', borderColor: 'var(--gen-border)' }}>
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium" style={{ color: 'var(--gen-text)' }}>
                <span>Is my data kept private?</span>
                <span style={{ color: '#8b5cf6' }} className="transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm" style={{ color: 'var(--gen-text-muted)' }}>
                Absolutely. We have a zero data retention policy. Your prompts are never stored on our servers after generation is complete and are never used for training AI models.
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
