import { type TaxonomyOption } from "@/lib/gallery-taxonomy";

type LandingCopy = {
  title: string;
  description: string;
  keywords: string[];
};

type ComboCopy = {
  title: string;
  description: string;
  keywords: string[];
};

const COMBO_COPY_MAP: Record<string, (styleLabel: string, useCaseLabel: string) => ComboCopy> = {
  "anime::avatar": (styleLabel, useCaseLabel) => ({
    title: `${styleLabel} ${useCaseLabel} AI Gallery | Lavie AI`,
    description:
      "Explore anime avatar prompt examples, profile-picture inspiration, and public AI portraits created with Lavie AI. Great for social avatars, character profiles, and identity concepts.",
    keywords: [
      "anime avatar ai",
      "anime profile picture",
      "anime avatar prompt",
      `${styleLabel} ${useCaseLabel} ai`,
    ],
  }),
  "photographic::product": (styleLabel, useCaseLabel) => ({
    title: `${styleLabel} ${useCaseLabel} AI Gallery | Lavie AI`,
    description:
      "Browse photographic product AI images, commercial prompt examples, and clean packshot inspiration created with Lavie AI. Useful for ecommerce listings, product ads, and hero shots.",
    keywords: [
      "product photography ai",
      "ecommerce product image ai",
      "product photo prompt",
      `${styleLabel} ${useCaseLabel} ai`,
    ],
  }),
  "illustration::book": (styleLabel, useCaseLabel) => ({
    title: `${styleLabel} ${useCaseLabel} AI Gallery | Lavie AI`,
    description:
      "Discover illustrated book-cover AI image prompts, storytelling compositions, and public cover inspiration created with Lavie AI. Helpful for novels, ebooks, and editorial concepts.",
    keywords: [
      "book cover ai",
      "illustrated cover prompt",
      "novel cover inspiration",
      `${styleLabel} ${useCaseLabel} ai`,
    ],
  }),
  "cyberpunk::social": (styleLabel, useCaseLabel) => ({
    title: `${styleLabel} ${useCaseLabel} AI Gallery | Lavie AI`,
    description:
      "Browse cyberpunk social-media AI images, neon portrait prompt examples, and eye-catching public visuals created with Lavie AI. Good for banners, profile art, and campaign visuals.",
    keywords: [
      "cyberpunk social media ai",
      "neon portrait prompt",
      "cyberpunk banner inspiration",
      `${styleLabel} ${useCaseLabel} ai`,
    ],
  }),
  "photorealistic::sketchToReal": (styleLabel, useCaseLabel) => ({
    title: `${styleLabel} ${useCaseLabel} AI Gallery | Lavie AI`,
    description:
      "See how rough sketches turn into polished photorealistic images with Lavie AI. Explore real examples, get prompt ideas, and find a direction you can use for concept art, product ideas, or visual drafts.",
    keywords: [
      "sketch to real ai",
      "photorealistic sketch ai",
      "sketch to image prompt",
      `${styleLabel} ${useCaseLabel} ai`,
    ],
  }),
};

export function buildStyleSeoCopy(styleOption: TaxonomyOption): LandingCopy {
  return {
    title: `${styleOption.label} AI Art Gallery | Lavie AI`,
    description: `Explore ${styleOption.label.toLowerCase()} image ideas, prompt inspiration, and real examples created with Lavie AI. A quick way to find a look you want and create something similar.`,
    keywords: [
      `${styleOption.label} AI art`,
      `${styleOption.label} AI image gallery`,
      `${styleOption.label} prompt ideas`,
      "Lavie AI gallery",
    ],
  };
}

export function buildUseCaseSeoCopy(useCaseOption: TaxonomyOption): LandingCopy {
  return {
    title: `${useCaseOption.label} AI Image Gallery | Lavie AI`,
    description: `Explore real ${useCaseOption.label.toLowerCase()} examples, prompt inspiration, and public creations made with Lavie AI. Great for getting ideas before you make your own version.`,
    keywords: [
      `${useCaseOption.label} AI images`,
      `${useCaseOption.label} prompt ideas`,
      `${useCaseOption.label} gallery`,
      "Lavie AI gallery",
    ],
  };
}

export function buildComboSeoCopy(styleOption: TaxonomyOption, useCaseOption: TaxonomyOption): ComboCopy {
  const key = `${styleOption.id}::${useCaseOption.id}`;
  const mapped = COMBO_COPY_MAP[key];

  if (mapped) {
    return mapped(styleOption.label, useCaseOption.label);
  }

  return {
    title: `${styleOption.label} ${useCaseOption.label} AI Gallery | Lavie AI`,
    description: `Explore ${styleOption.label.toLowerCase()} ${useCaseOption.label.toLowerCase()} examples, prompt inspiration, and real creations made with Lavie AI. A simple way to discover ideas you can reuse and turn into your own image.`,
    keywords: [
      `${styleOption.label} ${useCaseOption.label} ai`,
      `${styleOption.label} ${useCaseOption.label} prompts`,
      `${styleOption.label} ${useCaseOption.label} gallery`,
      "Lavie AI gallery",
    ],
  };
}
