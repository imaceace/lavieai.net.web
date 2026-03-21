"use client";

import { useState } from "react";
import {
  DropdownSelector,
  TryStyleCards,
  GalleryShowcase,
  RecommendedPrompts,
  GenerationResult,
} from "@/components/generator";

// Dropdown options
const styleOptions = [
  { id: "photorealistic", label: "Photorealistic" },
  { id: "anime", label: "Anime" },
  { id: "oil-painting", label: "Oil Painting" },
  { id: "watercolor", label: "Watercolor" },
  { id: "sketch", label: "Sketch" },
  { id: "3d-render", label: "3D Render" },
  { id: "pixel-art", label: "Pixel Art" },
  { id: "cyberpunk", label: "Cyberpunk" },
  { id: "fantasy", label: "Fantasy" },
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
  { id: "illustration", label: "Illustration" },
];

const colorOptions = [
  { id: "vibrant", label: "Vibrant" },
  { id: "muted", label: "Muted" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "pastel", label: "Pastel" },
  { id: "monochrome", label: "Monochrome" },
  { id: "neon", label: "Neon" },
];

const lightingOptions = [
  { id: "soft", label: "Soft" },
  { id: "dramatic", label: "Dramatic" },
  { id: "golden-hour", label: "Golden Hour" },
  { id: "blue-hour", label: "Blue Hour" },
  { id: "studio", label: "Studio" },
  { id: "natural", label: "Natural" },
  { id: "neon", label: "Neon" },
];

const compositionOptions = [
  { id: "none", label: "No Composition" },
  { id: "none2", label: "None" },
  { id: "blurry-background", label: "Blurry Background" },
  { id: "close-up", label: "Close Up" },
  { id: "key-light", label: "K" },
  { id: "wide-angle", label: "Wide Angle" },
  { id: "narrow-dof", label: "Narrow Depth Of Field" },
  { id: "shot-below", label: "Shot From Below" },
  { id: "shot-above", label: "Shot From Above" },
  { id: "macrophotography", label: "Macrophotography" },
];

const ratioOptions = [
  { id: "1:1", label: "1:1" },
  { id: "16:9", label: "16:9" },
  { id: "9:16", label: "9:16" },
  { id: "4:3", label: "4:3" },
  { id: "3:4", label: "3:4" },
];

export default function Home() {
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

  // User state (mock)
  const userPoints = 100;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate/text-to-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          style,
          resolution,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Poll for result
        const pollResult = async () => {
          const statusRes = await fetch(`/api/generate/status/${data.data.workId}`);
          const statusData = await statusRes.json();
          if (statusData.data.status === "completed") {
            setResult({ imageUrl: statusData.data.result_url });
            setIsGenerating(false);
          } else if (statusData.data.status === "failed") {
            setIsGenerating(false);
            alert("Generation failed. Please try again.");
          } else {
            setTimeout(pollResult, 2000);
          }
        };
        pollResult();
      } else {
        alert(data.error.message || "Generation failed");
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Generation error:", error);
      // Fallback to mock for development
      setTimeout(() => {
        setResult({
          imageUrl: "https://picsum.photos/1024/1024",
        });
        setIsGenerating(false);
      }, 3000);
    }
  };

  const handleUsePrompt = (p: string) => {
    setPrompt(p);
  };

  const handleSelectStyle = (styleId: string, examplePrompt: string) => {
    setStyle(styleId);
    setPrompt(examplePrompt);
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
    console.log("Surprise Me clicked!");
    const randomPrompt = randomPrompts[Math.floor(Math.random() * randomPrompts.length)];
    console.log("Setting prompt:", randomPrompt);
    setPrompt(randomPrompt);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-6 md:py-10 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Lavie AI Image Generator
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Create stunning AI-generated images in seconds. Transform your ideas into beautiful artwork.
          </p>
          {/* Promise Badges */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full bg-green-100 text-green-700">
              100% Free
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full bg-blue-100 text-blue-700">
              No Login Required
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full bg-amber-100 text-amber-700">
              Lightning Fast
            </span>
            <span className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full bg-purple-100 text-purple-700">
              Unlimited Generations
            </span>
          </div>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generate" className="pt-6 pb-12 md:pt-8 md:pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#262626] p-6 md:p-8">
            {/* Results */}
            {result && (
              <div className="mb-6">
                <GenerationResult
                  imageUrl={result.imageUrl}
                  prompt={prompt}
                  onRegenerate={handleGenerate}
                />
              </div>
            )}

            {/* Main form */}
            <div className="space-y-3">
              {/* Image upload + Prompt row */}
              <div className="flex gap-3">
                {/* Upload Image button */}
                <button
                  type="button"
                  className="flex-shrink-0 w-14 h-14 rounded-xl border border-[#3a3530]/30 bg-[#2a2520]/10 flex flex-col items-center justify-center gap-1 text-[#9a948a]/60 hover:bg-[#2a2520]/30 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                  <span className="text-[8px]">Image</span>
                </button>

                {/* Prompt textarea */}
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="flex-1 bg-transparent focus:outline-none text-[#e8e4df] resize-none text-base placeholder:text-[#9a948a]/60 min-h-[72px] pt-0"
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
                    className="w-4 h-4 rounded border-[#3a3530]/50 bg-[#2a2520]/30 text-[#ca8a04] focus:ring-[#ca8a04]/50"
                  />
                  <span className="text-sm text-[#9a948a]">Negative prompt</span>
                </label>
                {showNegativePrompt && (
                  <input
                    type="text"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                    className="w-full mt-2 px-4 py-2 bg-[#2a2520]/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ca8a04]/50 text-[#e8e4df]"
                    placeholder="What to avoid..."
                    autoFocus
                  />
                )}
              </div>

              {/* Row 1: Ratio, Style, Color, Lighting, Composition */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Ratio */}
                <DropdownSelector
                  value={ratioOptions.find(r => r.label === (resolution[0]/resolution[1] === 1 ? "1:1" : resolution[0]/resolution[1] === 16/9 ? "16:9" : resolution[0]/resolution[1] === 9/16 ? "9:16" : resolution[0]/resolution[1] === 4/3 ? "4:3" : "3:4"))?.id || "1:1"}
                  onChange={(val) => {
                    if (val) {
                      const r = ratioOptions.find(r => r.id === val);
                      if (r?.id === "1:1") setResolution([1024, 1024]);
                      else if (r?.id === "16:9") setResolution([1024, 576]);
                      else if (r?.id === "9:16") setResolution([576, 1024]);
                      else if (r?.id === "4:3") setResolution([1024, 768]);
                      else if (r?.id === "3:4") setResolution([768, 1024]);
                    }
                  }}
                  options={ratioOptions}
                  placeholder="1:1"
                />

                {/* Style */}
                <DropdownSelector
                  value={style}
                  onChange={setStyle}
                  options={styleOptions}
                  placeholder="Style"
                />

                {/* Color */}
                <DropdownSelector
                  value={color}
                  onChange={setColor}
                  options={colorOptions}
                  placeholder="Color"
                />

                {/* Lighting */}
                <DropdownSelector
                  value={lighting}
                  onChange={setLighting}
                  options={lightingOptions}
                  placeholder="Light"
                />

                {/* Composition */}
                <DropdownSelector
                  value={composition}
                  onChange={setComposition}
                  options={compositionOptions}
                  placeholder="No Composition"
                />
              </div>

              {/* Row 2: Clear, Random, Model, Fast Mode, Generate */}
              <div className="flex flex-wrap gap-2 items-center">
                {/* Clear */}
                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="px-4 h-10 text-sm font-medium rounded-full text-[#9a948a] hover:text-[#e8e4df] hover:bg-[#2a2520]/50 transition-colors disabled:opacity-50"
                  disabled={!prompt}
                >
                  Clear
                </button>

                {/* Random */}
                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className="px-4 h-10 text-sm font-medium rounded-full text-[#ca8a04] hover:text-[#ca8a04] hover:bg-[#ca8a04]/10 transition-colors"
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
                  className="relative w-10 h-5 rounded-full p-0.5 transition-colors duration-150 bg-[#3a3530]"
                >
                  <span className={`block w-4 h-4 rounded-full bg-[#e8e4df] shadow transition-transform duration-150 ${fastMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm text-[#9a948a]">Fast</span>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="flex-1 px-4 py-2.5 rounded-full font-semibold text-[#1a1a1a] transition-all flex items-center justify-center gap-2 bg-[#ca8a04] hover:bg-[#ca8a04]/90 disabled:bg-[#3a3530] disabled:text-[#6a6560] disabled:cursor-not-allowed"
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
                      <span className="px-1.5 py-0.5 bg-[#1a1a1a]/20 rounded-full text-[10px] font-medium">
                        Free
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section with Use Case filtering */}
      <section className="py-12 px-4 bg-gray-50">
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
      <section className="py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Lavie AI</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 bg-white rounded-2xl shadow-lg shadow-indigo-500/10 border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/15 transition-shadow">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Zero-Cost Creation</h3>
              <p className="text-gray-600 text-sm">
                World's first completely free AI image generator. No hidden fees, no subscriptions required.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 bg-white rounded-2xl shadow-lg shadow-indigo-500/10 border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/15 transition-shadow">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">State-of-the-Art Quality</h3>
              <p className="text-gray-600 text-sm">
                Smart routing selects the optimal model for your prompts, ensuring exceptional image quality.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 bg-white rounded-2xl shadow-lg shadow-indigo-500/10 border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/15 transition-shadow">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Advanced Text Understanding</h3>
              <p className="text-gray-600 text-sm">
                Accurately interprets complex prompts with multiple subjects, styles, and descriptions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 bg-white rounded-2xl shadow-lg shadow-indigo-500/10 border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/15 transition-shadow">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning-Fast Generation</h3>
              <p className="text-gray-600 text-sm">
                Optimized inference pipeline delivers results in seconds, not minutes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 bg-white rounded-2xl shadow-lg shadow-indigo-500/10 border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/15 transition-shadow">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Enhanced Privacy</h3>
              <p className="text-gray-600 text-sm">
                Zero data retention policy. Your prompts are never stored or used for training.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 bg-white rounded-2xl shadow-lg shadow-indigo-500/10 border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/15 transition-shadow">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Style Support</h3>
              <p className="text-gray-600 text-sm">
                From photorealistic to anime, oil painting to cyberpunk — 32 styles to explore.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 bg-indigo-600">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">3M+</div>
              <div className="text-indigo-200 text-sm">Monthly Active Users</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">1,530</div>
              <div className="text-indigo-200 text-sm">Images Generated/min</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">4.9</div>
              <div className="text-indigo-200 text-sm">Average Quality Score</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-1">25K+</div>
              <div className="text-indigo-200 text-sm">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-10">What Our Users Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Review 1 */}
            <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                <span className="text-amber-400">★★★★★</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                "Absolutely incredible! The image quality is amazing and it's completely free. I've tried many AI generators but this is by far the best."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white font-semibold">
                  S
                </div>
                <div>
                  <div className="font-semibold text-sm">Sarah Chen</div>
                  <div className="text-gray-500 text-xs">Digital Artist</div>
                </div>
              </div>
            </div>

            {/* Review 2 */}
            <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                <span className="text-amber-400">★★★★★</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                "The variety of styles is outstanding. From anime to photorealistic, it handles everything perfectly. My go-to tool for creative projects."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
                  M
                </div>
                <div>
                  <div className="font-semibold text-sm">Marcus Webb</div>
                  <div className="text-gray-500 text-xs">Game Developer</div>
                </div>
              </div>
            </div>

            {/* Review 3 */}
            <div className="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                <span className="text-amber-400">★★★★★</span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                "No login required and completely free! Perfect for quick experiments and brainstorming. The generation speed is impressive."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                  E
                </div>
                <div>
                  <div className="font-semibold text-sm">Emily Park</div>
                  <div className="text-gray-500 text-xs">Marketing Manager</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {/* FAQ 1 */}
            <details className="group bg-white rounded-xl border border-gray-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">
                <span>Is Lavie AI really free to use?</span>
                <span className="text-indigo-600 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-gray-600 text-sm">
                Yes! Lavie AI is completely free to use. We offer free daily credits so you can generate images without any payment. No credit card required.
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="group bg-white rounded-xl border border-gray-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">
                <span>Do I need to create an account?</span>
                <span className="text-indigo-600 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-gray-600 text-sm">
                No login is required! You can start generating images immediately. However, creating an account lets you save your generation history and access more features.
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group bg-white rounded-xl border border-gray-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">
                <span>What image styles are available?</span>
                <span className="text-indigo-600 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-gray-600 text-sm">
                We offer 32 different art styles including Photorealistic, Anime, Oil Painting, Watercolor, Sketch, 3D Render, Cyberpunk, Fantasy, and many more. New styles are added regularly.
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group bg-white rounded-xl border border-gray-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">
                <span>How fast can I generate an image?</span>
                <span className="text-indigo-600 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-gray-600 text-sm">
                With Fast Mode enabled, most images are generated in just a few seconds. Standard generation typically takes 10-30 seconds depending on complexity and server load.
              </div>
            </details>

            {/* FAQ 5 */}
            <details className="group bg-white rounded-xl border border-gray-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">
                <span>Can I use generated images commercially?</span>
                <span className="text-indigo-600 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-gray-600 text-sm">
                Yes! Images you generate with Lavie AI can be used for personal and commercial purposes. You retain full ownership of the images you create.
              </div>
            </details>

            {/* FAQ 6 */}
            <details className="group bg-white rounded-xl border border-gray-200">
              <summary className="flex items-center justify-between p-5 cursor-pointer font-medium">
                <span>Is my data kept private?</span>
                <span className="text-indigo-600 transition-transform group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-gray-600 text-sm">
                Absolutely. We have a zero data retention policy. Your prompts are never stored on our servers after generation is complete and are never used for training AI models.
              </div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
