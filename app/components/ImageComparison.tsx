'use client';

import { useState, useRef, useEffect } from 'react';

interface ImageComparisonProps {
  originalSrc: string;
  upscaledSrc: string;
  title?: string;
  description?: string;
}

export default function ImageComparison({
  originalSrc,
  upscaledSrc,
  title = 'Comparison',
  description,
}: ImageComparisonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-purple-100">{title}</h3>
        {description && <p className="text-sm text-purple-200 mt-1">{description}</p>}
      </div>

      <div
        ref={containerRef}
        className="relative w-full bg-black/30 rounded-lg overflow-hidden border border-white/20 select-none cursor-col-resize"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        style={{ aspectRatio: '16 / 9' }}
      >
        {/* Original Image (Background) */}
        <div className="absolute inset-0">
          <img
            src={originalSrc}
            alt="Original"
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Upscaled Image (Foreground) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={upscaledSrc}
            alt="Upscaled"
            className="w-full h-full object-cover"
            style={{ width: `${(100 / sliderPosition) * 100}%` }}
            draggable={false}
          />
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyan-400 to-transparent"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-cyan-400 rounded-full p-3 shadow-lg cursor-grab active:cursor-grabbing">
            <div className="flex gap-1">
              <span className="text-white text-xs font-bold">◀</span>
              <span className="text-white text-xs font-bold">▶</span>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded text-white text-sm font-semibold">
          Original
        </div>
        <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded text-white text-sm font-semibold">
          Upscaled
        </div>

        {/* Percentage Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded text-cyan-400 text-sm font-semibold">
          {sliderPosition.toFixed(0)}%
        </div>
      </div>

      {/* Touch Instructions */}
      <p className="text-xs text-purple-200 mt-3 text-center">
        Drag the slider to compare | 📱 Touch and drag to adjust
      </p>
    </div>
  );
}
