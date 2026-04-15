import { GenerationParams } from '../lib/api-client';

export interface InteractiveI2ICase {
  id: string;
  tabLabel: string;
  descKey?: string; // Changed from titleKey to descKey
  beforeImage: string;
  afterImage: string;
  // Optional image focus controls to avoid face/head clipping in fixed-ratio UI cards.
  beforeObjectPosition?: string;
  afterObjectPosition?: string;
  heroObjectPosition?: string;
  thumbObjectPosition?: string;
  actionButtonTextKey: string;
  params: GenerationParams;
  requiredTier?: "free" | "basic" | "pro" | "max" | "ultra";
}

export interface FeatureDiscoveryCase {
  id: string;
  titleKey: string;
  image: string;
  params: GenerationParams;
  requiredTier?: "free" | "basic" | "pro" | "max" | "ultra";
  altKey?: string; // SEO optimized alt text
}

// NOTE:
// These use cases are intentionally hidden for now because they need user-editable prompts.
// Do NOT delete underlying case definitions yet.
// If future cleanup wants to remove code, user explicit second confirmation is required first.
export const PROMPT_EDIT_REQUIRED_USE_CASE_IDS = new Set<string>([
  "changeOutfit",
  "giveUsMatchingOutfit",
  "styleMe",
  "changeHair",
  "ageTransformation",
  "redecorateMyRoom",
  "createAlbumCover",
  "createHolidayCard",
  "whatWouldILookLikeAsAKPopStar",
  "turnIntoGundam",
  "cyberpunk",
  "keychain",
]);

const BASE_INTERACTIVE_I2I_CASES: InteractiveI2ICase[] = [
  {
    id: "removeBackground",
    tabLabel: "Remove Background",
    descKey: "useCases.removeBackground.desc", // New description key
    beforeImage: "/images/quick-i2i/give-us-a-matching-outfit.webp", 
    afterImage: "/images/quick-i2i/remove-background.webp",
    actionButtonTextKey: "useCases.removeBackground.action",
    params: {
      useCase: "removeBackground",
      prompt: "Subject completely isolated on a pure solid white background, clean cutout edges, studio lighting, no background scenery, product photography style",
      style: "commercial",
      resolution: [1024, 1024],
      strength: 0.85,
      negativePrompt: "background scenery, messy background, dark background, shadow, room, outdoor"
    }
  },
  {
    id: "sketchToReal",
    tabLabel: "Sketch to Real",
    descKey: "useCases.sketchToReal.desc",
    beforeImage: "/images/quick-i2i/a-rough-pencil-sketch-of-a-futuristic-sports-car-on-white-paper.webp", 
    afterImage: "/images/quick-i2i/a-rough-real-of-a-futuristic-sports-car-on-white-paper.webp",
    actionButtonTextKey: "useCases.sketchToReal.action",
    requiredTier: "pro",
    params: {
      useCase: "sketchToReal",
      prompt: "Convert this sketch into a full-color photorealistic product photo while strictly preserving the original subject identity, object category, silhouette, perspective, and composition; keep the same viewpoint and proportions, remove all sketch strokes and construction lines, and add realistic materials, reflections, lighting, shadows, and fine surface details",
      style: "photorealistic",
      resolution: [1024, 1024],
      strength: 0.86,
      negativePrompt: "sketch style, line art, pencil strokes, construction lines, monochrome, grayscale, outline drawing, hand-drawn texture, change subject, wrong object category, new unrelated object, mattress, bed, sofa, profile mismatch, distorted geometry, deformed perspective, cartoon, anime, low quality, blur"
    }
  },
  {
    id: "turnIntoProfessionalPhoto",
    tabLabel: "Professional Headshot",
    descKey: "useCases.turnIntoProfessionalPhoto.title",
    beforeImage: "/images/quick-i2i/change-outfit-before.webp",
    afterImage: "/images/quick-i2i/change-outfit-after.webp",
    beforeObjectPosition: "50% 14%",
    afterObjectPosition: "50% 18%",
    heroObjectPosition: "50% 16%",
    thumbObjectPosition: "50% 16%",
    actionButtonTextKey: "useCases.turnIntoProfessionalPhoto.title",
    requiredTier: "pro",
    params: {
      useCase: "turnIntoProfessionalPhoto",
      prompt: "Professional corporate headshot, frontal view only, head-and-shoulders portrait, perfectly centered composition, direct eye contact to camera, upright posture, neutral professional expression, clean plain studio background only (solid light gray, white, or soft beige), even diffused studio lighting, sharp facial details, realistic skin texture, business attire, LinkedIn-ready profile photo; fully replace original scene and remove all flowers, plants, decorations, and environmental elements",
      style: "portrait",
      resolution: [1024, 1024],
      strength: 0.82,
      negativePrompt: "side profile, three-quarter profile, looking away, tilted head, off-center framing, full body, original background, floral background, flowers, plants, room scene, outdoor scene, clutter, props, harsh shadows, blur, low quality, distorted face, bad anatomy, cartoon, anime"
    }
  },
  {
    id: "removeWatermark",
    tabLabel: "Remove Watermark",
    descKey: "useCases.removeWatermark.desc",
    beforeImage: "/images/quick-i2i/remove-watermark-before.webp", 
    afterImage: "/images/quick-i2i/remove-watermark-after.webp",
    actionButtonTextKey: "useCases.removeWatermark.action",
    requiredTier: "pro",
    params: {
      useCase: "removeWatermark",
      prompt: "Clean image, perfect quality, no watermarks, no text, no logos, restored, clear, identical to original but clean",
      style: "photorealistic",
      resolution: [1024, 1024],
      strength: 0.40,
      negativePrompt: "watermark, text, logo, signature, letters, words, copyright, messy"
    }
  },
  {
    id: "upscaleImage", // Changed from "Remove People" to "Upscale/Enhance" as it's a huge I2I use case
    tabLabel: "Upscale & Enhance",
    descKey: "useCases.upscaleImage.desc",
    beforeImage: "/images/quick-i2i/a_low_resolution_blurry_photo.webp", // Using restore-photo as placeholder
    afterImage: "/images/quick-i2i/8k resolution, ultra detailed, sharp focus, masterpiece, enhanced quality, crisp textures.webp",
    actionButtonTextKey: "useCases.upscaleImage.action",
    params: {
      useCase: "upscaleImage",
      prompt: "8k resolution, ultra detailed, sharp focus, masterpiece, enhanced quality, crisp textures",
      style: "enhance",
      resolution: [1024, 1024],
      strength: 0.30,
      negativePrompt: "blurry, low res, pixelated, noisy, artifact, jpeg artifacts, dull"
    }
  },
  {
    id: "restorePhoto",
    tabLabel: "Restore Photo",
    descKey: "useCases.restorePhoto.title",
    beforeImage: "/images/quick-i2i/restore-image-before.jpeg",
    afterImage: "/images/quick-i2i/restore_image_after.webp",
    actionButtonTextKey: "useCases.restorePhoto.title",
    params: {
      useCase: "restorePhoto",
      prompt: "A highly detailed, perfectly restored vintage photograph, sepia tone, sharp focus, historical attire, elegant portrait",
      style: "analog-film",
      resolution: [896, 1152],
      strength: 0.35,
      negativePrompt: "scratches, dust, noise, torn, damaged, blurry, modern"
    }
  },
  {
    id: "colorizePhoto",
    tabLabel: "Colorize Photo",
    descKey: "useCases.colorizePhoto.title",
    beforeImage: "/images/quick-i2i/colorize-photo-before-albert-einstein.jpg",
    afterImage: "/images/quick-i2i/colorize-photo-after-albert-einstein.png",
    actionButtonTextKey: "useCases.colorizePhoto.title",
    requiredTier: "pro",
    params: {
      useCase: "colorizePhoto",
      prompt: "Perfectly colorized historical photo, natural realistic skin tones, vibrant and accurate colors, highly detailed, restored photography",
      style: "photorealistic",
      resolution: [1024, 1024],
      strength: 0.40,
      negativePrompt: "black and white, monochrome, grayscale, sepia, faded, desaturated, unrealistic colors"
    }
  },
  {
    id: "turnIntoAnime", // Changed from Claymation to Anime as Anime has much higher market volume
    tabLabel: "Turn into Anime",
    descKey: "useCases.turnIntoAnime.desc",
    beforeImage: "/images/quick-i2i/change-outfit-before.webp", 
    afterImage: "/images/quick-i2i/turn-into-anime-after.webp",
    beforeObjectPosition: "50% 16%",
    afterObjectPosition: "50% 18%",
    heroObjectPosition: "50% 17%",
    thumbObjectPosition: "50% 17%",
    actionButtonTextKey: "useCases.turnIntoAnime.action",
    requiredTier: "pro",
    params: {
      useCase: "turnIntoAnime",
      prompt: "Anime style, highly detailed, vibrant colors, studio ghibli style, beautiful shading, masterpiece, 2d illustration",
      style: "anime",
      resolution: [1024, 1024],
      strength: 0.60,
      negativePrompt: "photorealistic, 3d, cg, deformed, ugly, realistic"
    }
  }
];

export const FEATURE_DISCOVERY_CASES: FeatureDiscoveryCase[] = [
  // 1. Create / Design
  {
    id: "createHolidayCard",
    titleKey: "useCases.createHolidayCard.title",
    altKey: "useCases.createHolidayCard.alt",
    image: "/images/quick-i2i/create-a-holiday-card.webp",
    params: {
      useCase: "createHolidayCard",
      prompt: "A beautiful holiday greeting card design, festive decorations, warm cozy atmosphere, highly detailed illustration, 4k",
      style: "illustration",
      resolution: [1024, 1024],
      strength: 0.70,
      negativePrompt: "text, letters, words, messy, blurry"
    }
  },
  {
    id: "createAlbumCover",
    titleKey: "useCases.createAlbumCover.title",
    altKey: "useCases.createAlbumCover.alt",
    image: "/images/quick-i2i/create-an-album-cover.webp",
    params: {
      useCase: "createAlbumCover",
      prompt: "An artistic vinyl album cover, abstract surrealism, retro aesthetic, bold typography space, moody cinematic lighting",
      style: "digital-art",
      resolution: [1024, 1024],
      strength: 0.70,
      negativePrompt: "text, letters, boring, plain, low quality"
    }
  },
  {
    id: "petRoyalPainting",
    titleKey: "useCases.petRoyalPainting.title",
    altKey: "useCases.petRoyalPainting.alt",
    image: "/images/quick-i2i/pet-royal-painting.webp",
    params: {
      useCase: "petRoyalPainting",
      prompt: "A regal oil painting of a pet wearing historical European royal clothing, golden crown, velvet robe, classical Renaissance art style, masterpiece",
      style: "oil-painting",
      resolution: [896, 1152],
      strength: 0.70,
      negativePrompt: "modern, photograph, casual, cartoon, 3d render"
    }
  },

  // 2. Turn Into / Become
  {
    id: "whatWouldILookLikeAsAKPopStar",
    titleKey: "useCases.whatWouldILookLikeAsAKPopStar.title",
    altKey: "useCases.whatWouldILookLikeAsAKPopStar.alt",
    image: "/images/quick-i2i/what-would-i-look-like-as-a-k-pop-star.webp",
    params: {
      useCase: "whatWouldILookLikeAsAKPopStar",
      prompt: "A glamorous K-Pop idol portrait, stage lighting, stylish stage outfit, perfect makeup, highly detailed face, professional photography",
      style: "portrait",
      resolution: [768, 1344],
      strength: 0.60,
      negativePrompt: "ugly, deformed, blurry, bad anatomy"
    }
  },
  {
    id: "meAsTheGirlWithAPearl",
    titleKey: "useCases.meAsTheGirlWithAPearl.title",
    altKey: "useCases.meAsTheGirlWithAPearl.alt",
    image: "/images/quick-i2i/me-as-the-girl-with-a-pearl.webp",
    params: {
      useCase: "meAsTheGirlWithAPearl",
      prompt: "A portrait of a modern girl styled like 'Girl with a Pearl Earring', classical oil painting style, chiaroscuro lighting, masterpiece",
      style: "oil-painting",
      resolution: [896, 1152],
      strength: 0.60,
      negativePrompt: "modern clothes, bad anatomy, poorly drawn face"
    }
  },
  {
    id: "turnIntoGundam",
    titleKey: "useCases.turnIntoGundam.title",
    altKey: "useCases.turnIntoGundam.alt",
    image: "/images/quick-i2i/gundam-style.webp",
    params: {
      useCase: "turnIntoGundam",
      prompt: "Turn the person into an anime mecha battle suit, white-blue-red color blocking, V-fin head crest, angular armor plating, backpack thrusters, beam-saber energy glow, intricate mechanical parts, metallic armor. Also transform the entire background into a futuristic battlefield hangar with mechanical structures, smoke, sparks, neon energy trails, and cinematic sci-fi lighting so the subject and environment share one consistent Gundam-style look",
      style: "3d-render",
      resolution: [1024, 1024],
      strength: 0.70,
      negativePrompt: "human skin, flesh, soft, realistic human, organic, unchanged original background, plain real-world background, blurry, low quality"
    }
  },
  {
    id: "turnIntoCyborg",
    titleKey: "useCases.turnIntoCyborg.title",
    altKey: "useCases.turnIntoCyborg.alt",
    image: "/images/quick-i2i/cyberpunk.webp",
    params: {
      useCase: "turnIntoCyborg",
      prompt: "Transform the person into a premium half-human half-machine cyborg while preserving identity, pose, hairstyle, clothing silhouette, and body proportions. Make the cybernetic modifications unmistakable but elegant: one glowing cybernetic eye or visor detail, metallic cheek and temple plates, illuminated neck and collarbone ports, chest-core interface hints under the neckline, biomechanical forearms or hands, precision leg prosthetic details, subtle chrome implants, glowing circuit seams, and seamless synthetic materials blended with remaining human skin. Avoid a toy robot look; keep it cinematic, high-end, believable, and fashion-forward. Restyle the full background into a dense neon cyberpunk megacity with holograms, rain reflections, futuristic billboards, mist, and dramatic magenta-cyan lighting so the subject and environment share one cohesive premium sci-fi aesthetic.",
      style: "cyberpunk",
      resolution: [1024, 1024],
      strength: 0.76,
      negativePrompt: "fully normal human, no cybernetic parts, no robotic eye, organic face only, plain skin only, cheap toy robot, bulky mech suit, full android, plastic robot limbs, low-end cosplay armor, soft cartoon, cute anime, 2d illustration, low detail, blurry, plain background, unchanged real-world background, non-cyberpunk background, weak lighting, distorted anatomy, broken hands"
    }
  },
  {
    id: "zombieStyle",
    titleKey: "useCases.zombieStyle.title",
    altKey: "useCases.zombieStyle.alt",
    image: "/images/quick-i2i/zombie-style.webp",
    params: {
      useCase: "zombieStyle",
      prompt: "Scary Halloween zombie portrait, pale decaying skin, glowing eyes, dark cinematic lighting, horror concept art, highly detailed",
      style: "fantasy",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "cute, happy, cartoon, normal, healthy, boring"
    }
  },
  {
    id: "keychain",
    titleKey: "useCases.keychain.title",
    altKey: "useCases.keychain.alt",
    image: "/images/quick-i2i/lavie_a_cute_3d_rendered_keychain_of.webp",
    params: {
      useCase: "keychain",
      prompt: "A cute 3D rendered keychain of a dog wearing red goggles, standing on a wooden table, metallic ring attached, octane render, soft lighting",
      style: "3d-render",
      resolution: [1024, 1024],
      strength: 0.75,
      negativePrompt: "2d, flat, realistic photo, messy background"
    }
  },

  // 3. Style / Apply (Artistic Filters)
  {
    id: "ghibliStyle",
    titleKey: "useCases.ghibliStyle.title",
    altKey: "useCases.ghibliStyle.alt",
    image: "/images/quick-i2i/convert-to-ghibli-style.webp",
    params: {
      useCase: "ghibliStyle",
      prompt: "Transform the photo into a cinematic Studio Ghibli-inspired frame while preserving the same person identity, facial geometry, pose, and composition. Keep natural skin texture and realistic lighting, then blend hand-painted Ghibli linework, soft watercolor shading, and warm filmic color grading for a believable semi-realistic anime look.",
      style: "anime",
      resolution: [1024, 1024],
      strength: 0.55,
      negativePrompt: "chibi proportions, oversized anime eyes, flat cel shading, plastic skin, waxy face, low detail, blurry, noisy, distorted face, extra limbs, deformed hands, 3d render, uncanny expression, over-saturated colors"
    }
  },
  {
    id: "pixarStyle",
    titleKey: "useCases.pixarStyle.title",
    altKey: "useCases.pixarStyle.alt",
    image: "/images/quick-i2i/pixar-style.webp",
    params: {
      useCase: "pixarStyle",
      prompt: "Pixar 3D animation style, cute character design, expressive eyes, soft lighting, highly detailed, Disney style, masterpiece",
      style: "3d-render",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "photorealistic, realistic, 2d, flat, ugly, creepy"
    }
  },
  {
    id: "ps2Retro",
    titleKey: "useCases.ps2Retro.title",
    altKey: "useCases.ps2Retro.alt",
    image: "/images/quick-i2i/ps2-retro.webp",
    params: {
      useCase: "ps2Retro",
      prompt: "Early 2000s PS2 game graphics, low poly 3D render, retro video game aesthetic, vintage CGI, PlayStation 2 style, slightly pixelated",
      style: "retro",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "high poly, realistic, highly detailed, modern graphics, 8k, photorealistic"
    }
  },
  {
    id: "gtaStyle",
    titleKey: "useCases.gtaStyle.title",
    altKey: "useCases.gtaStyle.alt",
    image: "/images/quick-i2i/gta-style.webp",
    params: {
      useCase: "gtaStyle",
      prompt: "Transform the photo into Grand Theft Auto V loading screen promotional character art while preserving the same person identity, pose, and overall composition. Use editorial poster composition, bold black outlines, polished cel shading, dramatic rim lighting, high-contrast comic-book rendering, saturated cinematic colors, and mature Rockstar-style splash art. Keep the character as the dominant hero subject and restyle the environment into a stylish urban crime-game city scene with billboard-heavy streets, dramatic traffic, strong depth, and premium commercial cover-art impact. Do not add title text or logo overlays.",
      style: "comic-book",
      resolution: [1024, 1024],
      strength: 0.75,
      negativePrompt: "photorealistic, realistic photo, 3d render, soft watercolor, children's book illustration, childlike illustration, cute cartoon, family-friendly cartoon, anime, manga, flat simple cartoon, low contrast, blurry, washed out colors, weak outlines, messy background, deformed hands, distorted anatomy, title text, logo overlay, watermark, random letters, fake typography"
    }
  },
  {
    id: "cyberpunk",
    titleKey: "useCases.cyberpunk.title",
    altKey: "useCases.cyberpunk.alt",
    image: "/images/quick-i2i/cyberpunk.webp",
    params: {
      useCase: "cyberpunk",
      prompt: "Cyberpunk style, futuristic city neon lights, dark sci-fi atmosphere, glowing blue and pink neon, Blade Runner aesthetic, highly detailed concept art",
      style: "cyberpunk",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "daylight, natural, realistic, boring, simple, flat, low contrast"
    }
  },
  {
    id: "legoStyle",
    titleKey: "useCases.legoStyle.title",
    altKey: "useCases.legoStyle.alt",
    image: "/images/quick-i2i/lego-style.webp",
    params: {
      useCase: "legoStyle",
      prompt: "Made entirely of Lego bricks, Lego minifigure style, plastic texture, vibrant colors, studio lighting, macro photography",
      style: "3d-render",
      resolution: [1024, 1024],
      strength: 0.75,
      negativePrompt: "human, realistic skin, drawn, 2d, flesh, real clothes"
    }
  },

  // 4. Style / Apply (Traditional & Digital Art)
  {
    id: "pixelArt",
    titleKey: "useCases.pixelArt.title",
    altKey: "useCases.pixelArt.alt",
    image: "/images/quick-i2i/pixel-art.webp",
    params: {
      useCase: "pixelArt",
      prompt: "8-bit pixel art, retro video game style, colorful, sharp edges, nostalgic, high quality sprite, 16-bit",
      style: "pixel-art",
      resolution: [1024, 1024],
      strength: 0.70,
      negativePrompt: "high res, photorealistic, smooth, 3d, realistic"
    }
  },
  {
    id: "pencilSketch",
    titleKey: "useCases.pencilSketch.title",
    altKey: "useCases.pencilSketch.alt",
    image: "/images/quick-i2i/pencil-sketch.webp",
    params: {
      useCase: "pencilSketch",
      prompt: "Highly detailed pencil sketch, charcoal drawing, rough lines, black and white, realistic shading, artistic portrait, graphite",
      style: "line-art",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "color, colorful, painting, 3d, photograph, smooth"
    }
  },
  {
    id: "watercolor",
    titleKey: "useCases.watercolor.title",
    altKey: "useCases.watercolor.alt",
    image: "/images/quick-i2i/watercolor.webp",
    params: {
      useCase: "watercolor",
      prompt: "Beautiful watercolor painting, expressive brush strokes, translucent colors, ink bleeds, artistic splash, traditional art style",
      style: "illustration",
      resolution: [1024, 1024],
      strength: 0.60,
      negativePrompt: "photorealistic, 3d, digital art, sharp edges, cg, solid colors"
    }
  },
  {
    id: "oilPainting",
    titleKey: "useCases.oilPainting.title",
    altKey: "useCases.oilPainting.alt",
    image: "/images/quick-i2i/oil-painting.webp",
    params: {
      useCase: "oilPainting",
      prompt: "Classic oil painting masterpiece, thick impasto brushstrokes, rich vibrant colors, museum quality, classical art style, dramatic chiaroscuro lighting",
      style: "illustration",
      resolution: [1024, 1024],
      strength: 0.60,
      negativePrompt: "photographic, digital art, 3d render, modern, flat colors, cartoon"
    }
  },
  {
    id: "papercraft",
    titleKey: "useCases.papercraft.title",
    altKey: "useCases.papercraft.alt",
    image: "/images/quick-i2i/papercraft.webp",
    params: {
      useCase: "papercraft",
      prompt: "Intricate papercraft art, origami style, layered cut paper, clean edges, soft shadows, pastel colors, 3D paper illustration",
      style: "illustration",
      resolution: [1024, 1024],
      strength: 0.70,
      negativePrompt: "photorealistic, human, flesh, realistic, painting, drawing"
    }
  },
  {
    id: "claymation",
    titleKey: "useCases.claymation.title",
    altKey: "useCases.claymation.alt",
    image: "/images/quick-i2i/claymation.webp",
    params: {
      useCase: "claymation",
      prompt: "Claymation style, Wallace and Gromit style, made of modeling clay, stop motion animation aesthetic, fingerprint textures, cute and tactile",
      style: "3d-render",
      resolution: [1024, 1024],
      strength: 0.70,
      negativePrompt: "realistic, 2d, drawn, anime, flat, painting"
    }
  },

  // 5. Modify / Utility
  {
    id: "redecorateMyRoom",
    titleKey: "useCases.redecorateMyRoom.title",
    altKey: "useCases.redecorateMyRoom.alt",
    image: "/images/quick-i2i/redecorate-my-room.webp",
    params: {
      useCase: "redecorateMyRoom",
      prompt: "Modern cozy bedroom interior design, minimalist furniture, large windows with sunlight, indoor plants, architectural photography",
      style: "interior",
      resolution: [1344, 756],
      strength: 0.65,
      negativePrompt: "messy, cluttered, distorted, deformed furniture"
    }
  },
  {
    id: "styleMe",
    titleKey: "useCases.styleMe.title",
    altKey: "useCases.styleMe.alt",
    image: "/images/quick-i2i/style-me.webp",
    params: {
      useCase: "styleMe",
      prompt: "Fashion editorial photography, a model wearing trendy high-end streetwear, urban background, elegant pose, Vogue style",
      style: "fashion",
      resolution: [768, 1344],
      strength: 0.65,
      negativePrompt: "bad proportions, missing limbs, bad anatomy"
    }
  },
  {
    id: "changeHair",
    titleKey: "useCases.changeHair.title",
    altKey: "useCases.changeHair.alt",
    image: "/images/quick-i2i/change-hair.webp",
    params: {
      useCase: "changeHair",
      prompt: "Same person with a modern stylish haircut, vibrant hair color, salon quality, identical facial features, professional portrait",
      style: "portrait",
      resolution: [1024, 1024],
      strength: 0.50,
      negativePrompt: "different face, bad anatomy, deformed, distorted, cartoon"
    }
  },
  {
    id: "ageTransformation",
    titleKey: "useCases.ageTransformation.title",
    altKey: "useCases.ageTransformation.alt",
    image: "/images/quick-i2i/age-transformation.webp",
    params: {
      useCase: "ageTransformation",
      prompt: "Same person looking significantly older, grey hair, wrinkles, natural aging, realistic skin texture, highly detailed portrait photography",
      style: "portrait",
      resolution: [1024, 1024],
      strength: 0.50,
      negativePrompt: "young, smooth skin, cartoon, unrealistic, distorted"
    }
  },
  {
    id: "turnIntoDoodle",
    titleKey: "useCases.turnIntoDoodle.title",
    altKey: "useCases.turnIntoDoodle.alt",
    image: "/images/quick-i2i/turn-into-doodle.webp",
    params: {
      useCase: "turnIntoDoodle",
      prompt: "Convert into a hand-drawn doodle illustration, whimsical sketch style, black ink on white paper, playful scribbles, expressive linework, cute and charming",
      style: "line-art",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "photorealistic, 3d render, color, shading, smooth, photographic"
    }
  },
  {
    id: "turnIntoPlushie",
    titleKey: "useCases.turnIntoPlushie.title",
    altKey: "useCases.turnIntoPlushie.alt",
    image: "/images/quick-i2i/turn-into-plushie.webp",
    params: {
      useCase: "turnIntoPlushie",
      prompt: "Transform into a soft plush toy character, fluffy fabric texture, cute oversized eyes, stitched seams, squishy and huggable appearance, kawaii aesthetic",
      style: "3d-render",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "realistic human, photographic, sharp edges, hard materials, metal, realistic skin"
    }
  }
];

const MIGRATED_TO_INTERACTIVE_CASE_IDS_IN_ORDER = [
  "ghibliStyle",
  "pixarStyle",
  "gtaStyle",
  "legoStyle",
  "turnIntoCyborg",
  "pixelArt",
  "pencilSketch",
  "petRoyalPainting",
] as const;

const MIGRATED_TO_INTERACTIVE_CASE_IDS = new Set<string>(
  MIGRATED_TO_INTERACTIVE_CASE_IDS_IN_ORDER
);

const MIGRATED_TO_INTERACTIVE_META: Record<
  (typeof MIGRATED_TO_INTERACTIVE_CASE_IDS_IN_ORDER)[number],
  {
    tabLabel: string;
    descKey: string;
    beforeImage: string;
    afterImage: string;
    beforeObjectPosition?: string;
    afterObjectPosition?: string;
    heroObjectPosition?: string;
    thumbObjectPosition?: string;
  }
> = {
  ghibliStyle: {
    tabLabel: "Ghibli Style",
    descKey: "useCases.ghibliStyle.desc",
    beforeImage: "/images/quick-i2i/style-me.webp",
    afterImage: "/images/quick-i2i/convert-to-ghibli-style.webp",
  },
  pixarStyle: {
    tabLabel: "Pixar Style",
    descKey: "useCases.pixarStyle.desc",
    beforeImage: "/images/quick-i2i/little_girl.webp",
    afterImage: "/images/quick-i2i/pixar-style.webp",
    beforeObjectPosition: "50% 20%",
    afterObjectPosition: "50% 22%",
    heroObjectPosition: "50% 21%",
    thumbObjectPosition: "50% 21%",
  },
  gtaStyle: {
    tabLabel: "GTA Style",
    descKey: "useCases.gtaStyle.desc",
    beforeImage: "/images/quick-i2i/little_girl.webp",
    afterImage: "/images/quick-i2i/gta-style.webp",
    beforeObjectPosition: "50% 20%",
    afterObjectPosition: "50% 22%",
    heroObjectPosition: "50% 21%",
    thumbObjectPosition: "50% 21%",
  },
  legoStyle: {
    tabLabel: "Lego Style",
    descKey: "useCases.legoStyle.desc",
    beforeImage: "/images/quick-i2i/little_girl.webp",
    afterImage: "/images/quick-i2i/lego-style.webp",
    beforeObjectPosition: "50% 20%",
    afterObjectPosition: "50% 22%",
    heroObjectPosition: "50% 21%",
    thumbObjectPosition: "50% 21%",
  },
  turnIntoCyborg: {
    tabLabel: "Turn into Cyborg",
    descKey: "useCases.turnIntoCyborg.desc",
    beforeImage: "/images/quick-i2i/little_girl.webp",
    afterImage: "/images/quick-i2i/cyberpunk.webp",
    beforeObjectPosition: "50% 20%",
    afterObjectPosition: "50% 22%",
    heroObjectPosition: "50% 21%",
    thumbObjectPosition: "50% 21%",
  },
  pixelArt: {
    tabLabel: "Pixel Art",
    descKey: "useCases.pixelArt.desc",
    beforeImage: "/images/quick-i2i/little_girl.webp",
    afterImage: "/images/quick-i2i/pixel-art.webp",
  },
  pencilSketch: {
    tabLabel: "Pencil Sketch",
    descKey: "useCases.pencilSketch.desc",
    beforeImage: "/images/quick-i2i/little_girl.webp",
    afterImage: "/images/quick-i2i/pencil-sketch.webp",
  },
  petRoyalPainting: {
    tabLabel: "Royal Portrait",
    descKey: "useCases.petRoyalPainting.desc",
    beforeImage: "/images/quick-i2i/pet-royal-painting.webp",
    afterImage: "/images/quick-i2i/pet-royal-painting.webp",
  },
};

const migratedFeatureDiscoveryCases: InteractiveI2ICase[] =
  MIGRATED_TO_INTERACTIVE_CASE_IDS_IN_ORDER.reduce<InteractiveI2ICase[]>((acc, id) => {
    const source = FEATURE_DISCOVERY_CASES.find((item) => item.id === id);
    if (!source) return acc;

    const meta = MIGRATED_TO_INTERACTIVE_META[id];

    const nextCase: InteractiveI2ICase = {
      id: source.id,
      tabLabel: meta.tabLabel,
      descKey: meta.descKey,
      beforeImage: meta.beforeImage,
      afterImage: meta.afterImage,
      actionButtonTextKey: source.titleKey,
      params: source.params,
      ...(source.requiredTier ? { requiredTier: source.requiredTier } : {}),
      ...(meta.beforeObjectPosition ? { beforeObjectPosition: meta.beforeObjectPosition } : {}),
      ...(meta.afterObjectPosition ? { afterObjectPosition: meta.afterObjectPosition } : {}),
      ...(meta.heroObjectPosition ? { heroObjectPosition: meta.heroObjectPosition } : {}),
      ...(meta.thumbObjectPosition ? { thumbObjectPosition: meta.thumbObjectPosition } : {}),
    };

    acc.push(nextCase);
    return acc;
  }, []);

export const INTERACTIVE_I2I_CASES: InteractiveI2ICase[] = [
  ...BASE_INTERACTIVE_I2I_CASES,
  ...migratedFeatureDiscoveryCases,
];

// UI should consume this filtered list for now.
// Keep FEATURE_DISCOVERY_CASES intact to preserve source data and future rollback ability.
export const FEATURE_DISCOVERY_VISIBLE_CASES: FeatureDiscoveryCase[] = FEATURE_DISCOVERY_CASES.filter(
  (item) =>
    !PROMPT_EDIT_REQUIRED_USE_CASE_IDS.has(item.id) &&
    !MIGRATED_TO_INTERACTIVE_CASE_IDS.has(item.id)
);
