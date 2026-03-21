"use client";

import { useState } from "react";
import {
  PromptInput,
  StyleSelector,
  UseCaseSelector,
  AspectRatioSelector,
  ColorSelector,
  LightingSelector,
  CompositionSelector,
  GenerateButton,
  TryStyleCards,
  GalleryShowcase,
  RecommendedPrompts,
  GenerationResult,
} from "@/components/generator";

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

  // User state (mock)
  const userPoints = 100;
  const [useCase, setUseCase] = useState<string | null>(null);

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
          useCase,
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
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            Create stunning images with AI. Transform your ideas into beautiful artwork in seconds.
          </p>
        </div>
      </section>

      {/* Generator Section */}
      <section id="generate" className="pt-6 pb-12 md:pt-8 md:pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">Create Your Image</h2>

            {/* Results */}
            {result && (
              <div className="mb-8">
                <GenerationResult
                  imageUrl={result.imageUrl}
                  prompt={prompt}
                  onRegenerate={handleGenerate}
                />
              </div>
            )}

            {/* Main form */}
            <div className="space-y-6">
              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium mb-2">Prompt</label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <PromptInput
                      value={prompt}
                      onChange={setPrompt}
                      placeholder="Describe your image... e.g., A beautiful sunset over the ocean, golden hour lighting"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSurpriseMe}
                    className="flex-shrink-0 px-4 py-2 text-sm font-medium text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                  >
                    ✨ Surprise Me
                  </button>
                </div>
              </div>

              {/* Core Controls - Style, Color, Lighting, Composition */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Style Selection */}
                <StyleSelector value={style} onChange={setStyle} />

                {/* Color Selection */}
                <ColorSelector value={color} onChange={setColor} />

                {/* Lighting Selection */}
                <LightingSelector value={lighting} onChange={setLighting} />

                {/* Composition Selection */}
                <CompositionSelector value={composition} onChange={setComposition} />
              </div>

              {/* Use Case Selection */}
              <UseCaseSelector value={useCase} onChange={setUseCase} />

              {/* Aspect Ratio - Prominent */}
              <AspectRatioSelector value={resolution} onChange={setResolution} />

              {/* Advanced Options */}
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 p-3 bg-gray-50 rounded-lg">
                  <span className="flex items-center gap-2">
                    <span className="transition-transform group-open:rotate-90">▶</span>
                    Advanced Options
                  </span>
                </summary>
                <div className="mt-4 space-y-4 pl-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Negative Prompt</label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="What to avoid..."
                    />
                  </div>
                </div>
              </details>

              {/* Generate Button */}
              <div className="pt-4">
                <GenerateButton
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  disabled={!prompt.trim()}
                  pointsCost={10}
                  points={userPoints}
                />
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
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Lavie AI</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Generation</h3>
              <p className="text-gray-600">
                Generate images in seconds with our optimized AI models powered by Flux and Stable Diffusion
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">32+ Art Styles</h3>
              <p className="text-gray-600">
                Choose from a wide variety of art styles including anime, photorealistic, oil painting, and more
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🆓</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Free to Start</h3>
              <p className="text-gray-600">
                Get started with free daily credits, no credit card needed. Upgrade when you need more
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
