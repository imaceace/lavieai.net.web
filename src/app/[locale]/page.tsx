"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  DropdownSelector,
  TryStyleCards,
  GalleryShowcase,
  GenerationResult,
} from "@/components/generator";
import { LoginModal } from "@/components/auth/LoginModal";
import { UpgradeModal } from "@/components/auth/UpgradeModal";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { generateApi, pollTaskStatus, userApi, configApi, authApi, uploadApi } from "@/lib/api-client";
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
  const [color, setColor] = useState<string | null>("none");
  const [lighting, setLighting] = useState<string | null>("none");
  const [composition, setComposition] = useState<string | null>("none");
  const [model, setModel] = useState<string>("basic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string } | null>(null);
  
  // Image to Image state
  const [referenceImage, setReferenceImage] = useState<{ url: string; id: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeUseCase, setActiveUseCase] = useState<string>('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User points state
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [user, setUser] = useState<any>(null); // To store user details for checking tier

  // Generator extra state
  const [fastMode, setFastMode] = useState(false);
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeModalTitle, setUpgradeModalTitle] = useState("");
  const [upgradeModalSubtitle, setUpgradeModalSubtitle] = useState("");

  // Track last manual action for "Last Operation Wins" logic
  const lastPromptEditTime = useRef<number>(0);
  const lastDropdownEditTime = useRef<number>(0);

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
    // Fetch user info and credits on mount
    authApi.getMe().then(u => {
      setUser(u);
      if (u) {
        setUserCredits(u.credits);
        setFastMode(true); // Default to Fast Mode for logged-in users
      } else {
        setUserCredits(null);
        setFastMode(false); // Guests cannot use Fast Mode
      }
    }).catch(() => {
      setUser(null);
      setUserCredits(null);
      setFastMode(false);
    });

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
  const getGenerationCost = () => {
    if (model === 'basic') {
      return fastMode ? 4 : 0;
    }
    const generationCosts: Record<string, number> = {
      "pro": 6,
      "max": 120,
      "ultra": 160
    };
    return generationCosts[model] || 10;
  };
  const generationCost = getGenerationCost();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
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
      let task;
      if (referenceImage) {
        task = await generateApi.imageToImage({
          prompt: finalPrompt,
          negativePrompt: showNegativePrompt ? negativePrompt : undefined,
          style: style || undefined,
          resolution,
          model: model,
          fastMode: fastMode,
          imageUrl: referenceImage.url,
          imageId: referenceImage.id,
        });
      } else {
        task = await generateApi.textToImage({
          prompt: finalPrompt,
          negativePrompt: showNegativePrompt ? negativePrompt : undefined,
          style: style || undefined,
          resolution,
          model: model,
          fastMode: fastMode,
        });
      }

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
      
      const errorCode = (error as any).code;
      if (errorCode === 'RESOLUTION_LIMIT' || errorCode === 'UPGRADE_REQUIRED') {
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

  const handleSelectUseCase = (params: any) => {
    if (params.prompt) setPrompt(params.prompt);
    if (params.style) setStyle(params.style);
    if (params.resolution) setResolution(params.resolution);
    if (params.color) setColor(params.color);
    if (params.lighting) setLighting(params.lighting);
    if (params.composition) setComposition(params.composition);
    
    if (params.negativePrompt) {
      setNegativePrompt(params.negativePrompt);
      setShowNegativePrompt(true);
    } else {
      setNegativePrompt("");
      setShowNegativePrompt(false);
    }

    if (params.id) setActiveUseCase(params.id);

    // Trigger file upload dialog automatically for all use cases to encourage img2img
    if (!referenceImage) {
      fileInputRef.current?.click();
    }

    // Update timestamp to override sniffing
    lastPromptEditTime.current = Date.now();
    lastDropdownEditTime.current = Date.now() + 100; // make dropdown edits win

    // Scroll to generator section
    setTimeout(() => {
      const generatorSection = document.getElementById('generator');
      if (generatorSection) {
        generatorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50/30 to-indigo-50/30 dark:from-stone-950 dark:via-rose-950/20 dark:to-indigo-950/20">
      <Script id="software-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Script id="faq-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* Hero Section */}
      <section className="py-10 md:py-16 px-4" style={{ background: 'var(--gen-bg)' }}>
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
      <section id="generator" className="pt-6 pb-12 md:pt-8 md:pb-16 px-4" style={{ background: 'var(--gen-bg)' }}>
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
                    }}
                    className="px-4 h-10 text-sm font-medium rounded-full transition-colors disabled:opacity-50 generator-button"
                    disabled={!prompt && !negativePrompt && style === "none" && color === "none" && lighting === "none" && composition === "none"}
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
                        if ((val === 'max' || val === 'ultra') && (!user || user.tier === 'free')) {
                          setUpgradeModalTitle(t('generator.upgradeRequiredTitle') || 'Upgrade Required');
                          setUpgradeModalSubtitle(t('generator.upgradeRequired'));
                          setIsUpgradeModalOpen(true);
                          return;
                        }
                        setModel(val);
                      }
                    }}
                    options={[
                      { id: "basic", label: "LavieAI Basic(0+ credits)" },
                      { id: "pro", label: "LavieAI Pro(6+ credits)" },
                      { id: "max", label: "LavieAI Max(120+ credits)" },
                      { id: "ultra", label: "LavieAI ultra(160+ credits)" },
                    ]}
                    placeholder="LavieAI Basic(0+ credits)"
                    hideClearOption={true}
                  />

                  {/* Fast Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        setIsLoginModalOpen(true);
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
      <section className="py-12 px-4" style={{ background: 'var(--gen-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <TryStyleCards onSelectStyle={handleSelectStyle} />
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4" style={{ background: 'var(--gen-input-bg)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold" style={{ color: 'var(--gen-text)' }}>{t('useCases.title')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              
              {
                id: "removeWatermark",
                titleKey: "useCases.removeWatermark.title",
                image: "/images/quick-i2i/remove-watermark.webp",
                params: {
                  id: "removeWatermark",
                  prompt: "Clean image, perfect quality, no watermarks, no text, no logos, restored, clear, identical to original but clean",
                  style: "photorealistic",
                  resolution: [1024, 1024],
                  lighting: "natural",
                  negativePrompt: "watermark, text, logo, signature, letters, words, copyright, messy"
                }
              },
               {
                id: "giveUsMatchingOutfit",
                titleKey: "useCases.giveUsMatchingOutfit.title",
                image: "/images/quick-i2i/give-us-a-matching-outfit.webp",
                params: {
                  id: "giveUsMatchingOutfit",
                  prompt: "A cute couple walking a dog in a park, wearing matching aesthetic outfits, autumn leaves, romantic atmosphere, cinematic lighting",
                  style: "photorealistic",
                  resolution: [1344, 756],
                  lighting: "golden-hour",
                  negativePrompt: "deformed faces, extra limbs, messy background"
                }
              },
              {
                id: "removeBackground",
                titleKey: "useCases.removeBackground.title",
                image: "/images/quick-i2i/remove-background.webp",
                params: {
                  id: "removeBackground",
                  prompt: "Subject completely isolated on a pure solid white background, clean cutout edges, studio lighting, no background scenery, product photography style",
                  style: "commercial",
                  resolution: [1024, 1024],
                  lighting: "studio",
                  negativePrompt: "background scenery, messy background, dark background, shadow, room, outdoor"
                }
              },
              {
                id: "removePeopleInTheBackground",
                titleKey: "useCases.removePeopleInTheBackground.title",
                image: "/images/quick-i2i/remove-people-in-the-background.webp",
                params: {
                  id: "removePeopleInTheBackground",
                  prompt: "Clean and pure original background, completely empty, no people, no humans, identical to the original environment but without any characters, pure scenery",
                  style: "photorealistic",
                  resolution: [1024, 1024],
                  lighting: "natural",
                  negativePrompt: "people, person, human, crowd, figures, silhouettes, text, blurry"
                }
              },
              
              {
                id: "ghibliStyle",
                titleKey: "useCases.ghibliStyle.title",
                image: "/images/quick-i2i/convert-to-ghibli-style.webp",
                params: {
                  id: "ghibliStyle",
                  prompt: "Studio Ghibli style animation art, Hayao Miyazaki, vibrant colors, anime masterpiece, highly detailed, beautiful scenery, 2d animation",
                  style: "anime",
                  resolution: [1024, 1024],
                  lighting: "natural",
                  color: "vibrant",
                  negativePrompt: "photorealistic, 3d, cg, deformed, poorly drawn, ugly, realistic"
                }
              },
              {
                id: "turnIntoClaymationStyle",
                titleKey: "useCases.turnIntoClaymationStyle.title",
                image: "/images/quick-i2i/turn-into-claymation-style.webp",
                params: {
                  id: "turnIntoClaymationStyle",
                  prompt: "Cute claymation style, 3D clay render, Popmart blind box toy style, smooth plastic and clay texture, Pixar style, adorable, soft studio lighting, octane render",
                  style: "3d-render",
                  resolution: [1024, 1024],
                  lighting: "soft",
                  negativePrompt: "realistic, photorealistic, 2d, flat, drawing, sketch, ugly, deformed"
                }
              },
              {
                id: "sketchToReal",
                titleKey: "useCases.sketchToReal.title",
                image: "/images/quick-i2i/sketch-to-real.webp",
                params: {
                  id: "sketchToReal",
                  prompt: "Highly detailed photorealistic render, highly finished, professional photography, realistic textures, ray tracing, unreal engine 5, masterpiece",
                  style: "photorealistic",
                  resolution: [1024, 1024],
                  lighting: "natural",
                  negativePrompt: "sketch, drawing, lines, outline, uncolored, flat, 2d, cartoon, anime"
                }
              },
              {
                id: "ps2Retro",
                titleKey: "useCases.ps2Retro.title",
                image: "/images/quick-i2i/ps2-retro.webp",
                params: {
                  id: "ps2Retro",
                  prompt: "Early 2000s PS2 game graphics, low poly 3D render, retro video game aesthetic, vintage CGI, PlayStation 2 style, slightly pixelated",
                  style: "retro",
                  resolution: [1024, 1024],
                  lighting: "dramatic",
                  negativePrompt: "high poly, realistic, highly detailed, modern graphics, 8k, photorealistic"
                }
              },
              {
                id: "colorizePhoto",
                titleKey: "useCases.colorizePhoto.title",
                image: "/images/quick-i2i/colorize-photo.webp",
                params: {
                  id: "colorizePhoto",
                  prompt: "Perfectly colorized historical photo, natural realistic skin tones, vibrant and accurate colors, highly detailed, restored photography",
                  style: "photorealistic",
                  resolution: [1024, 1024],
                  lighting: "natural",
                  negativePrompt: "black and white, monochrome, grayscale, sepia, faded, desaturated, unrealistic colors"
                }
              },
              {
                id: "cyberpunk",
                titleKey: "useCases.cyberpunk.title",
                image: "/images/quick-i2i/cyberpunk.webp",
                params: {
                  id: "cyberpunk",
                  prompt: "Cyberpunk style, futuristic city neon lights, dark sci-fi atmosphere, glowing blue and pink neon, Blade Runner aesthetic, highly detailed concept art",
                  style: "cyberpunk",
                  resolution: [1024, 1024],
                  lighting: "dramatic",
                  negativePrompt: "daylight, natural, realistic, boring, simple, flat, low contrast"
                }
              },
              {
                id: "createHolidayCard",
                titleKey: "useCases.createHolidayCard.title",
                image: "/images/quick-i2i/create-a-holiday-card.webp",
                params: {
                  id: "createHolidayCard",
                  prompt: "A beautiful holiday greeting card design, festive decorations, warm cozy atmosphere, highly detailed illustration, 4k",
                  style: "illustration",
                  resolution: [1024, 1024],
                  color: "warm",
                  lighting: "soft",
                  negativePrompt: "text, letters, words, messy, blurry"
                }
              },
              {
                id: "createAlbumCover",
                titleKey: "useCases.createAlbumCover.title",
                image: "/images/quick-i2i/create-an-album-cover.webp",
                params: {
                  id: "createAlbumCover",
                  prompt: "An artistic vinyl album cover, abstract surrealism, retro aesthetic, bold typography space, moody cinematic lighting",
                  style: "digital-art",
                  resolution: [1024, 1024],
                  color: "vibrant",
                  lighting: "dramatic",
                  negativePrompt: "text, letters, boring, plain, low quality"
                }
              },
              {
                id: "redecorateMyRoom",
                titleKey: "useCases.redecorateMyRoom.title",
                image: "/images/quick-i2i/redecorate-my-room.webp",
                params: {
                  id: "redecorateMyRoom",
                  prompt: "Modern cozy bedroom interior design, minimalist furniture, large windows with sunlight, indoor plants, architectural photography",
                  style: "interior",
                  resolution: [1344, 756],
                  lighting: "natural",
                  composition: "wide",
                  negativePrompt: "messy, cluttered, distorted, deformed furniture"
                }
              },
              {
                id: "whatWouldILookLikeAsAKPopStar",
                titleKey: "useCases.whatWouldILookLikeAsAKPopStar.title",
                image: "/images/quick-i2i/what-would-i-look-like-as-a-k-pop-star.webp",
                params: {
                  id: "whatWouldILookLikeAsAKPopStar",
                  prompt: "A glamorous K-Pop idol portrait, stage lighting, stylish stage outfit, perfect makeup, highly detailed face, professional photography",
                  style: "portrait",
                  resolution: [768, 1344],
                  lighting: "studio",
                  negativePrompt: "ugly, deformed, blurry, bad anatomy"
                }
              },
              {
                id: "styleMe",
                titleKey: "useCases.styleMe.title",
                image: "/images/quick-i2i/style-me.webp",
                params: {
                  id: "styleMe",
                  prompt: "Fashion editorial photography, a model wearing trendy high-end streetwear, urban background, elegant pose, Vogue style",
                  style: "fashion",
                  resolution: [768, 1344],
                  lighting: "soft",
                  negativePrompt: "bad proportions, missing limbs, bad anatomy"
                }
              },
             
              {
                id: "meAsTheGirlWithAPearl",
                titleKey: "useCases.meAsTheGirlWithAPearl.title",
                image: "/images/quick-i2i/me-as-the-girl-with-a-pearl.webp",
                params: {
                  id: "meAsTheGirlWithAPearl",
                  prompt: "A portrait of a modern girl styled like 'Girl with a Pearl Earring', classical oil painting style, chiaroscuro lighting, masterpiece",
                  style: "oil-painting",
                  resolution: [896, 1152],
                  lighting: "dramatic",
                  negativePrompt: "modern clothes, bad anatomy, poorly drawn face"
                }
              },
              {
                id: "createProfessionalProductPhoto",
                titleKey: "useCases.createProfessionalProductPhoto.title",
                image: "/images/quick-i2i/create-a-professional-product-photo.webp",
                params: {
                  id: "createProfessionalProductPhoto",
                  prompt: "Professional commercial photography of a premium product, floating on a sleek pedestal, clean background, studio lighting, 8k",
                  style: "commercial",
                  resolution: [1024, 1024],
                  lighting: "studio",
                  negativePrompt: "text, watermark, blurry, low quality"
                }
              },
              {
                id: "createProfessionalJobPhoto",
                titleKey: "useCases.createProfessionalJobPhoto.title",
                image: "/images/quick-i2i/create-a-professional-job-photo.webp",
                params: {
                  id: "createProfessionalJobPhoto",
                  prompt: "A professional corporate headshot, business attire, neutral background, soft friendly smile, LinkedIn profile picture style",
                  style: "portrait",
                  resolution: [1024, 1024],
                  lighting: "soft",
                  negativePrompt: "casual clothes, messy hair, bad lighting"
                }
              },
              {
                id: "restorePhoto",
                titleKey: "useCases.restorePhoto.title",
                image: "/images/quick-i2i/restore-photo.webp",
                params: {
                  id: "restorePhoto",
                  prompt: "A highly detailed, perfectly restored vintage photograph, sepia tone, sharp focus, historical attire, elegant portrait",
                  style: "analog-film",
                  resolution: [896, 1152],
                  lighting: "soft",
                  negativePrompt: "scratches, dust, noise, torn, damaged, blurry, modern"
                }
              },
              {
                id: "keychain",
                titleKey: "useCases.keychain.title",
                image: "/images/quick-i2i/keychain.webp",
                params: {
                  id: "keychain",
                  prompt: "A cute 3D rendered keychain of a dog wearing red goggles, standing on a wooden table, metallic ring attached, octane render, soft lighting",
                  style: "3d-render",
                  resolution: [1024, 1024],
                  lighting: "studio",
                  negativePrompt: "2d, flat, realistic photo, messy background"
                }
              }
            ].map((useCase) => (
              <div 
                key={useCase.id}
                className="group flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all hover:bg-black/5 dark:hover:bg-white/5 border border-transparent hover:border-[var(--gen-border)]"
                onClick={() => handleSelectUseCase(useCase.params)}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative">
                  <img 
                    src={useCase.image} 
                    alt={t(useCase.titleKey as any)} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="flex-1 font-semibold text-sm md:text-base leading-snug" style={{ color: 'var(--gen-text)' }}>
                  {t(useCase.titleKey as any)}
                </div>
              </div>
            ))}
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

      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        title={t('generator.loginRequiredTitle')}
        subtitle={t('generator.loginRequiredForFastMode')}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title={upgradeModalTitle}
        subtitle={upgradeModalSubtitle}
      />
    </div>
  );
}
