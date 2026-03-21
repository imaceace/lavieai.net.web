"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

interface Style {
  id: string;
  name: string;
  icon: string;
  examplePrompt: string;
}

const artStyles: Style[] = [
  { id: "photorealistic", name: "Photorealistic", icon: "📷", examplePrompt: "A majestic lion in the savanna, golden hour lighting, professional wildlife photography, highly detailed" },
  { id: "anime", name: "Anime", icon: "🎌", examplePrompt: "Beautiful anime girl with pink hair, cherry blossoms background, soft lighting, studio quality" },
  { id: "oil-painting", name: "Oil Painting", icon: "🖼️", examplePrompt: "Classical oil painting of a Victorian lady, rich colors, dramatic chiaroscuro lighting" },
  { id: "watercolor", name: "Watercolor", icon: "🎨", examplePrompt: "Delicate watercolor painting of a cottage with roses, soft wet-on-wet technique" },
  { id: "sketch", name: "Sketch", icon: "✏️", examplePrompt: "Detailed pencil sketch of a mountain landscape, cross-hatching shading, artistic" },
  { id: "3d-render", name: "3D Render", icon: "🎲", examplePrompt: "Cute 3D rendered robot character, glossy materials, studio lighting, Pixar style" },
  { id: "pixel-art", name: "Pixel Art", icon: "👾", examplePrompt: "Retro pixel art game scene, 16-bit style, vibrant colors, detailed sprites" },
  { id: "cyberpunk", name: "Cyberpunk", icon: "🤖", examplePrompt: "Cyberpunk street market at night, neon signs, rain reflections, futuristic atmosphere" },
  { id: "fantasy", name: "Fantasy", icon: "🧙", examplePrompt: "Epic fantasy dragon battle scene, magical effects, dramatic lighting, highly detailed" },
  { id: "ukiyo-e", name: "Ukiyo-e", icon: "🏯", examplePrompt: "Traditional Japanese ukiyo-e print of Mount Fuji, waves and cherry blossoms" },
  { id: "chinese-style", name: "Chinese Style", icon: "🐉", examplePrompt: "Traditional Chinese ink painting of a dragon among clouds, elegant brushstrokes" },
  { id: "minimalist", name: "Minimalist", icon: "◼️", examplePrompt: "Minimalist abstract art, geometric shapes, clean lines, monochromatic palette" },
];

const photoStyles: Style[] = [
  { id: "portrait", name: "Portrait", icon: "👤", examplePrompt: "Professional portrait photography, studio lighting, capture personality" },
  { id: "landscape", name: "Landscape", icon: "🏔️", examplePrompt: "Breathtaking mountain landscape at sunrise, mist rolling through valleys, golden light" },
  { id: "architecture", name: "Architecture", icon: "🏛️", examplePrompt: "Modern architecture building, clean lines, dramatic angle, professional photography" },
  { id: "interior", name: "Interior", icon: "🏠", examplePrompt: "Cozy living room interior, warm lighting, Scandinavian design, real estate photo" },
  { id: "fashion", name: "Fashion", icon: "👗", examplePrompt: "Fashion photography of elegant dress, editorial style, magazine cover quality" },
  { id: "commercial", name: "Commercial", icon: "📺", examplePrompt: "Professional product photography for advertising, clean background, studio lighting" },
  { id: "food", name: "Food", icon: "🍜", examplePrompt: "Gourmet pizza with fresh ingredients, overhead shot, professional food photography" },
  { id: "pet", name: "Pet", icon: "🐱", examplePrompt: "Adorable golden retriever puppy, playful pose, natural lighting, professional pet photography" },
  { id: "floral", name: "Floral", icon: "🌸", examplePrompt: "Beautiful bouquet of roses with peonies, soft natural lighting, top-down view" },
  { id: "bw", name: "Black & White", icon: "⬛", examplePrompt: "Classic black and white street photography, high contrast, cinematic mood" },
  { id: "film", name: "Film", icon: "📽️", examplePrompt: "Vintage film photography aesthetic, grain texture, warm tones, 35mm style" },
  { id: "macro", name: "Macro", icon: "🔬", examplePrompt: "Extreme macro photography of a butterfly wing, intricate patterns, shallow depth of field" },
];

const designStyles: Style[] = [
  { id: "illustration", name: "Illustration", icon: "✍️", examplePrompt: "Digital illustration of a magical forest, whimsical style, detailed characters" },
  { id: "poster", name: "Poster", icon: "📋", examplePrompt: "Vintage travel poster design, art deco style, bold colors, retro typography" },
  { id: "ui-design", name: "UI Design", icon: "📱", examplePrompt: "Modern app UI design mockup, clean interface, mobile phone showcase" },
  { id: "logo", name: "Logo", icon: "🔵", examplePrompt: "Minimalist logo design for tech company, geometric shapes, professional brand identity" },
  { id: "cover", name: "Cover", icon: "📔", examplePrompt: "Book cover design with dramatic lighting, professional typography, genre-appropriate mood" },
  { id: "ecommerce", name: "E-commerce", icon: "🛒", examplePrompt: "E-commerce product listing image, clean white background, professional product presentation" },
  { id: "packaging", name: "Packaging", icon: "📦", examplePrompt: "Creative packaging design for luxury cosmetics, premium materials, elegant branding" },
  { id: "typography", name: "Typography", icon: "🔤", examplePrompt: "Creative typography design with 3D effect, bold statement, artistic letterforms" },
];

const categories = [
  { id: "all", label: "All" },
  { id: "art", label: "Art" },
  { id: "photo", label: "Photo" },
  { id: "design", label: "Design" },
] as const;

interface TryStyleCardsProps {
  onSelectStyle: (styleId: string, prompt: string) => void;
}

export function TryStyleCards({ onSelectStyle }: TryStyleCardsProps) {
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]["id"]>("all");

  const getStyles = () => {
    switch (activeCategory) {
      case "art":
        return artStyles;
      case "photo":
        return photoStyles;
      case "design":
        return designStyles;
      default:
        return [...artStyles, ...photoStyles, ...designStyles];
    }
  };

  const styles = getStyles();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold">Try a Style</h3>
          <span className="text-sm text-gray-500">Click to create</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
              activeCategory === cat.id
                ? "bg-indigo-100 text-indigo-700 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Style cards grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelectStyle(style.id, style.examplePrompt)}
            className="group relative bg-white rounded-xl border-2 border-gray-100 hover:border-indigo-300 transition-all p-3 text-center hover:shadow-lg hover:-translate-y-1"
          >
            <span className="text-3xl mb-1 block">{style.icon}</span>
            <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {style.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
