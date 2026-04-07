import { GenerationParams } from '../lib/api-client';

export interface InteractiveI2ICase {
  id: string;
  tabLabel: string;
  descKey: string; // Changed from titleKey to descKey
  beforeImage: string;
  afterImage: string;
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
}

export const INTERACTIVE_I2I_CASES: InteractiveI2ICase[] = [
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
      prompt: "Highly detailed photorealistic render, highly finished, professional photography, realistic textures, ray tracing, unreal engine 5, masterpiece",
      style: "photorealistic",
      resolution: [1024, 1024],
      strength: 0.75,
      negativePrompt: "sketch, drawing, lines, outline, uncolored, flat, 2d, cartoon, anime"
    }
  },
  {
    id: "changeOutfit", // Updated ID to match market trend
    tabLabel: "Change Outfit",
    descKey: "useCases.giveUsMatchingOutfit.desc",
    beforeImage: "/images/quick-i2i/change-outfit-before.webp", 
    afterImage: "/images/quick-i2i/change-outfit-after.webp",
    actionButtonTextKey: "useCases.giveUsMatchingOutfit.action",
    requiredTier: "pro",
    params: {
      useCase: "giveUsMatchingOutfit",
      prompt: "Same person, exact same face and identity as original image, wearing a luxurious haute couture evening gown, professional fashion photography, high-end fashion magazine style, perfectly tailored clothes",
      style: "fashion",
      resolution: [768, 1024],
      strength: 0.65,
      negativePrompt: "different face, changed identity, morphed facial features, bad anatomy, deformed body, casual clothes, messy, blurry face"
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
    id: "turnIntoAnime", // Changed from Claymation to Anime as Anime has much higher market volume
    tabLabel: "Turn into Anime",
    descKey: "useCases.turnIntoAnime.desc",
    beforeImage: "/images/quick-i2i/change-outfit-before.webp", 
    afterImage: "/images/quick-i2i/turn-into-anime-after.webp",
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
    id: "createProfessionalProductPhoto",
    titleKey: "useCases.createProfessionalProductPhoto.title",
    image: "/images/quick-i2i/create-a-professional-product-photo.webp",
    requiredTier: "pro",
    params: {
      useCase: "createProfessionalProductPhoto",
      prompt: "Professional commercial photography of a premium product, floating on a sleek pedestal, clean background, studio lighting, 8k",
      style: "commercial",
      resolution: [1024, 1024],
      strength: 0.60,
      negativePrompt: "text, watermark, blurry, low quality"
    }
  },
  {
    id: "createProfessionalJobPhoto",
    titleKey: "useCases.createProfessionalJobPhoto.title",
    image: "/images/quick-i2i/create-a-professional-job-photo.webp",
    requiredTier: "pro",
    params: {
      useCase: "createProfessionalJobPhoto",
      prompt: "A professional corporate headshot, business attire, neutral background, soft friendly smile, LinkedIn profile picture style",
      style: "portrait",
      resolution: [1024, 1024],
      strength: 0.55,
      negativePrompt: "casual clothes, messy hair, bad lighting"
    }
  },
  {
    id: "createLogo",
    titleKey: "useCases.createLogo.title",
    image: "/images/quick-i2i/create-an-album-cover.webp", // Fallback image
    params: {
      useCase: "createLogo",
      prompt: "A professional minimalist flat vector logo design, isolated on solid white background, high quality, corporate identity, clean shapes",
      style: "illustration",
      resolution: [1024, 1024],
      strength: 0.70,
      negativePrompt: "text, watermark, messy, 3d, photorealistic, complex, busy"
    }
  },
  {
    id: "petRoyalPainting",
    titleKey: "useCases.petRoyalPainting.title",
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
    image: "/images/quick-i2i/gundam-style.webp",
    params: {
      useCase: "turnIntoGundam",
      prompt: "Turn into a mecha Gundam robot, intricate mechanical parts, glowing neon accents, metallic armor, sci-fi cyberpunk aesthetic, highly detailed masterpiece",
      style: "3d-render",
      resolution: [1024, 1024],
      strength: 0.70,
      negativePrompt: "human skin, flesh, soft, realistic human, organic, blurry, low quality"
    }
  },
  {
    id: "turnIntoCyborg",
    titleKey: "useCases.turnIntoCyborg.title",
    image: "/images/quick-i2i/cyberpunk.webp", // Fallback image
    params: {
      useCase: "turnIntoCyborg",
      prompt: "Turn into a futuristic cyborg, half human half machine, glowing robotic eye, metallic face plates, cyberpunk aesthetic, highly detailed sci-fi portrait",
      style: "cyberpunk",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "normal human, casual clothes, soft, cartoon, 2d, plain"
    }
  },
  {
    id: "zombieStyle",
    titleKey: "useCases.zombieStyle.title",
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
    image: "/images/quick-i2i/convert-to-ghibli-style.webp",
    params: {
      useCase: "ghibliStyle",
      prompt: "Studio Ghibli style animation art, Hayao Miyazaki, vibrant colors, anime masterpiece, highly detailed, beautiful scenery, 2d animation",
      style: "anime",
      resolution: [1024, 1024],
      strength: 0.60,
      negativePrompt: "photorealistic, 3d, cg, deformed, poorly drawn, ugly, realistic"
    }
  },
  {
    id: "pixarStyle",
    titleKey: "useCases.pixarStyle.title",
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
    image: "/images/quick-i2i/ps2-retro.webp", // fallback if not exists
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
    image: "/images/quick-i2i/gta-style.webp",
    params: {
      useCase: "gtaStyle",
      prompt: "GTA V loading screen art style, cel shaded, thick outlines, high contrast, bold colors, comic book style, digital illustration",
      style: "comic-book",
      resolution: [1024, 1024],
      strength: 0.65,
      negativePrompt: "photorealistic, 3d render, soft, blurry, realistic photo"
    }
  },
  {
    id: "cyberpunk",
    titleKey: "useCases.cyberpunk.title",
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
    id: "colorizePhoto",
    titleKey: "useCases.colorizePhoto.title",
    image: "/images/quick-i2i/colorize-photo.webp",
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
    id: "restorePhoto",
    titleKey: "useCases.restorePhoto.title",
    image: "/images/quick-i2i/restore-photo.webp", // Need fallback if not exist
    params: {
      useCase: "restorePhoto",
      prompt: "A highly detailed, perfectly restored vintage photograph, sepia tone, sharp focus, historical attire, elegant portrait",
      style: "analog-film",
      resolution: [896, 1152],
      strength: 0.35,
      negativePrompt: "scratches, dust, noise, torn, damaged, blurry, modern"
    }
  }
];
