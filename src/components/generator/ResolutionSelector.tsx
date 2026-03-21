"use client";

import { useState } from "react";

interface ResolutionSelectorProps {
  value: [number, number];
  onChange: (resolution: [number, number]) => void;
  maxResolution?: number;
}

const presetResolutions: [number, number][] = [
  [512, 512],
  [768, 768],
  [1024, 1024],
  [1024, 768],
  [768, 1024],
];

export function ResolutionSelector({ value, onChange, maxResolution = 2048 }: ResolutionSelectorProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState(value[0]);
  const [customHeight, setCustomHeight] = useState(value[1]);

  const handlePresetClick = (resolution: [number, number]) => {
    onChange(resolution);
    setIsCustom(false);
  };

  const handleCustomChange = () => {
    const width = Math.min(Math.max(customWidth, 256), maxResolution);
    const height = Math.min(Math.max(customHeight, 256), maxResolution);
    onChange([width, height]);
  };

  const isPresetSelected = (resolution: [number, number]) => {
    return !isCustom && value[0] === resolution[0] && value[1] === resolution[1];
  };

  return (
    <div className="space-y-4">
      {/* Preset resolutions */}
      <div className="flex flex-wrap gap-2">
        {presetResolutions.map((resolution) => (
          <button
            key={`${resolution[0]}x${resolution[1]}`}
            onClick={() => handlePresetClick(resolution)}
            disabled={resolution[0] > maxResolution || resolution[1] > maxResolution}
            className={`px-4 py-2 text-sm rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              isPresetSelected(resolution)
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {resolution[0]} × {resolution[1]}
          </button>
        ))}
        <button
          onClick={() => setIsCustom(true)}
          className={`px-4 py-2 text-sm rounded-lg border-2 transition-all ${
            isCustom
              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom resolution */}
      {isCustom && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={customWidth}
              onChange={(e) => setCustomWidth(parseInt(e.target.value) || 256)}
              onBlur={handleCustomChange}
              min={256}
              max={maxResolution}
              className="w-24 px-3 py-2 border rounded-lg"
            />
            <span className="text-gray-500">×</span>
            <input
              type="number"
              value={customHeight}
              onChange={(e) => setCustomHeight(parseInt(e.target.value) || 256)}
              onBlur={handleCustomChange}
              min={256}
              max={maxResolution}
              className="w-24 px-3 py-2 border rounded-lg"
            />
            <span className="text-sm text-gray-500">px</span>
          </div>
          <span className="text-sm text-gray-500">
            Max: {maxResolution}px
          </span>
        </div>
      )}

      {/* Current selection info */}
      <div className="text-sm text-gray-600">
        Selected: <span className="font-medium">{value[0]} × {value[1]}</span> px
        <span className="mx-2">•</span>
        <span>Aspect ratio: {value[0] === value[1] ? "Square" : `${(value[0] / value[1]).toFixed(2)}`}</span>
      </div>
    </div>
  );
}
