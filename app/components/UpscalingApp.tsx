'use client';

import { useState, useRef } from 'react';
import { UpscalingMethod, TECHNIQUE_DESCRIPTIONS } from '@/lib/upscaling/processor';

const METHODS: UpscalingMethod[] = [
  'lanczos',
  'lanczos+adaptive',
  'chroma',
  'bicubic',
  'bicubic+unsharp',
  'bicubic+highpass',
  'edgeaware',
  'frequency',
  'fractal',
];

const PRESETS = {
  photo: {
    name: '📸 Foto',
    method: 'lanczos+adaptive' as UpscalingMethod,
    scale: 2,
    sharpnessAmount: 1.5,
    sharpnessRadius: 0.7,
    denoise: true,
    denoiseMethod: 'bilateral' as const,
    denoiseStrength: 1,
    enableCLAHE: true,
  },
  text: {
    name: '📄 Texto',
    method: 'lanczos+adaptive' as UpscalingMethod,
    scale: 4,
    sharpnessAmount: 2.0,
    sharpnessRadius: 0.5,
    denoise: false,
    enableCLAHE: false,
  },
  screenshot: {
    name: '🖼️ Screenshot',
    method: 'lanczos+adaptive' as UpscalingMethod,
    scale: 2,
    sharpnessAmount: 1.8,
    sharpnessRadius: 0.6,
    denoise: true,
    denoiseMethod: 'bilateral' as const,
    denoiseStrength: 0.5,
    enableCLAHE: true,
  },
  art: {
    name: '🎨 Arte',
    method: 'chroma' as UpscalingMethod,
    scale: 2,
    sharpnessAmount: 1.2,
    sharpnessRadius: 0.8,
    denoise: false,
    enableCLAHE: true,
  },
};

interface ProcessingItem {
  id: string;
  file: File;
  preview: string;
  upscaled?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export default function UpscalingApp() {
  const [images, setImages] = useState<ProcessingItem[]>([]);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<UpscalingMethod>('lanczos+adaptive');
  const [scale, setScale] = useState(2);
  const [sharpnessAmount, setSharpnessAmount] = useState(1.5);
  const [sharpnessRadius, setSharpnessRadius] = useState(0.7);
  const [edgeThreshold] = useState(50);
  const [contrastBoost] = useState(1.2);
  const [denoise, setDenoise] = useState(true);
  const [denoiseMethod, setDenoiseMethod] = useState<'bilateral' | 'nlm'>('bilateral');
  const [denoiseStrength, setDenoiseStrength] = useState(1);
  const [enableCLAHE, setEnableCLAHE] = useState(true);
  const [claheClipLimit, setClaheClipLimit] = useState(2.0);
  const [enableMultiPass, setEnableMultiPass] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages([{
          id: Date.now().toString(),
          file,
          preview: event.target?.result as string,
          status: 'pending',
        }]);
        setUpscaledImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBatchSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files || []);
    const newItems: ProcessingItem[] = [];
    let filesProcessed = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newItems.push({
          id: Date.now().toString() + Math.random(),
          file,
          preview: event.target?.result as string,
          status: 'pending',
        });
        filesProcessed++;
        
        if (filesProcessed === files.length) {
          setImages((prev: ProcessingItem[]) => [...prev, ...newItems]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const applyPreset = (presetKey: keyof typeof PRESETS): void => {
    const preset = PRESETS[presetKey];
    setMethod(preset.method);
    setScale(preset.scale);
    setSharpnessAmount(preset.sharpnessAmount);
    setSharpnessRadius(preset.sharpnessRadius);
    setDenoise(preset.denoise);
    if ('denoiseMethod' in preset && preset.denoiseMethod) setDenoiseMethod(preset.denoiseMethod);
    if ('denoiseStrength' in preset && preset.denoiseStrength) setDenoiseStrength(preset.denoiseStrength);
    setEnableCLAHE(preset.enableCLAHE);
  };

  const handleUpscale = async (item?: ProcessingItem): Promise<void> => {
    const targetItem = item || images[0];
    if (!targetItem) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', targetItem.file);
      formData.append('method', method);
      formData.append('scale', scale.toString());
      formData.append('sharpnessAmount', sharpnessAmount.toString());
      formData.append('sharpnessRadius', sharpnessRadius.toString());
      formData.append('edgeThreshold', edgeThreshold.toString());
      formData.append('contrastBoost', contrastBoost.toString());
      formData.append('denoise', denoise.toString());
      formData.append('denoiseMethod', denoiseMethod);
      formData.append('denoiseStrength', denoiseStrength.toString());
      formData.append('enableCLAHE', enableCLAHE.toString());
      formData.append('claheClipLimit', claheClipLimit.toString());
      formData.append('enableMultiPass', enableMultiPass.toString());

      const res = await fetch('/api/upscale', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const imageBlob = await res.blob();
        const url = URL.createObjectURL(imageBlob);
        setUpscaledImage(url);
        
        if (item) {
          setImages((prev: ProcessingItem[]) => prev.map((img: ProcessingItem) => 
            img.id === item.id ? { ...img, upscaled: url, status: 'done' as const } : img
          ));
        }
      } else {
        alert('Failed to upscale image');
        if (item) {
          setImages((prev: ProcessingItem[]) => prev.map((img: ProcessingItem) => 
            img.id === item.id ? { ...img, status: 'error' as const } : img
          ));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing image');
      if (item) {
        setImages((prev: ProcessingItem[]) => prev.map((img: ProcessingItem) => 
          img.id === item.id ? { ...img, status: 'error' as const } : img
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (imageUrl?: string): void => {
    const url = imageUrl || upscaledImage;
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;
    link.download = `upscaled-${method}-${scale}x.png`;
    link.click();
  };

  const downloadAll = (): void => {
    images.forEach((img: ProcessingItem, idx: number) => {
      if (img.upscaled) {
        const link = document.createElement('a');
        link.href = img.upscaled;
        link.download = `upscaled-${idx + 1}-${method}-${scale}x.png`;
        // Stagger downloads slightly
        setTimeout(() => link.click(), idx * 100);
      }
    });
  };

  const clearAll = (): void => {
    setImages([]);
    setUpscaledImage(null);
  };

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">
            Topaz Upscaling Pro
          </h1>
          <p className="text-xl text-purple-100">
            Advanced Image Upscaling with AI-Inspired Techniques
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <button
              onClick={() => setBatchMode(false)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                !batchMode
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/20 text-purple-100 hover:bg-white/30'
              }`}
            >
              Single Image
            </button>
            <button
              onClick={() => setBatchMode(true)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                batchMode
                  ? 'bg-purple-500 text-white'
                  : 'bg-white/20 text-purple-100 hover:bg-white/30'
              }`}
            >
              Batch Processing
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Controls Panel */}
          <div className="lg:col-span-1 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold mb-6 text-white">⚙️ Controls</h2>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-purple-100">
                {batchMode ? 'Select Multiple Images' : 'Select Image'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={batchInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleBatchSelect}
                className="hidden"
              />
              <button
                onClick={() => (batchMode ? batchInputRef.current?.click() : fileInputRef.current?.click())}
                className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-semibold transition"
              >
                {batchMode ? '📁 Choose Images' : '🖼️ Choose Image'}
              </button>
            </div>

            {/* Presets */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-purple-100">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyPreset(key as keyof typeof PRESETS)}
                    className="px-2 py-1 bg-white/20 hover:bg-white/30 border border-white/30 rounded text-white text-xs font-semibold transition"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-purple-100">
                Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as UpscalingMethod)}
                className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:border-white/50 text-sm"
              >
                {METHODS.map((m) => (
                  <option key={m} value={m} className="bg-gray-900">
                    {TECHNIQUE_DESCRIPTIONS[m]}
                  </option>
                ))}
              </select>
            </div>

            {/* Scale */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-purple-100">
                Scale: {scale}x
              </label>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={scale}
                onChange={(e) => setScale(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Sharpness Amount */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-purple-100">
                Sharpness: {(sharpnessAmount * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={sharpnessAmount}
                onChange={(e) => setSharpnessAmount(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Sharpness Radius */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-purple-100">
                Sharpness Radius: {sharpnessRadius.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.3"
                max="2"
                step="0.1"
                value={sharpnessRadius}
                onChange={(e) => setSharpnessRadius(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Denoise */}
            <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <label className="flex items-center text-sm font-semibold text-purple-100 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={denoise}
                  onChange={(e) => setDenoise(e.target.checked)}
                  className="mr-2 w-4 h-4"
                />
                🔇 Enable Denoise
              </label>
              {denoise && (
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-purple-100 mb-1">
                      Type
                    </label>
                    <select
                      value={denoiseMethod}
                      onChange={(e) => setDenoiseMethod(e.target.value as 'bilateral' | 'nlm')}
                      className="w-full px-2 py-1 bg-white/20 border border-white/30 rounded text-white text-xs"
                    >
                      <option value="bilateral" className="bg-gray-900">Bilateral Filter (Fast)</option>
                      <option value="nlm" className="bg-gray-900">Non-Local Means (Quality)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-purple-100 mb-1">
                      Strength: {denoiseStrength.toFixed(1)}
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={denoiseStrength}
                      onChange={(e) => setDenoiseStrength(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CLAHE */}
            <div className="mb-6 p-4 bg-white/10 rounded-lg border border-white/20">
              <label className="flex items-center text-sm font-semibold text-purple-100 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCLAHE}
                  onChange={(e) => setEnableCLAHE(e.target.checked)}
                  className="mr-2 w-4 h-4"
                />
                ✨ Contrast Enhancement
              </label>
              {enableCLAHE && (
                <div className="mt-3">
                  <label className="block text-xs font-semibold text-purple-100 mb-1">
                    Clip Limit: {claheClipLimit.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={claheClipLimit}
                    onChange={(e) => setClaheClipLimit(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* Multi-pass */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-purple-100 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMultiPass}
                  onChange={(e) => setEnableMultiPass(e.target.checked)}
                  className="mr-2 w-4 h-4"
                />
                🔄 Multi-Pass (4x+)
              </label>
              <p className="text-xs text-purple-200 mt-1">Better quality for large scales</p>
            </div>

            {/* Process Button */}
            <button
              onClick={() => handleUpscale()}
              disabled={images.length === 0 || loading}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-400 disabled:to-gray-500 rounded-lg text-white font-bold transition text-lg"
            >
              {loading ? '⏳ Processing...' : '✨ Upscale' + (batchMode ? ' All' : '')}
            </button>

            {images.length > 0 && (
              <button
                onClick={clearAll}
                className="w-full mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-200 font-semibold transition text-sm"
              >
                🗑️ Clear All
              </button>
            )}
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {batchMode ? '📦 Batch Queue' : '👀 Preview'}
              </h2>
              {batchMode && images.some(img => img.upscaled) && (
                <button
                  onClick={downloadAll}
                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded text-white text-sm font-semibold transition"
                >
                  📥 Download All
                </button>
              )}
            </div>

            {batchMode ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {images.length === 0 ? (
                  <div className="text-center py-12 text-purple-200">
                    <p className="text-lg">Upload images to get started</p>
                  </div>
                ) : (
                  images.map((img: ProcessingItem) => (
                    <div key={img.id} className="bg-black/30 rounded-lg p-4 border border-white/20">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs text-purple-200 mb-2">Original</p>
                          <img src={img.preview} alt="Preview" className="w-full h-20 object-cover rounded" />
                        </div>
                        <div className="flex items-center justify-center">
                          {img.status === 'processing' && <div className="animate-spin text-2xl">⏳</div>}
                          {img.status === 'done' && <div className="text-2xl">✅</div>}
                          {img.status === 'error' && <div className="text-2xl">❌</div>}
                          {img.status === 'pending' && <div className="text-2xl">⏹️</div>}
                        </div>
                        <div>
                          <p className="text-xs text-purple-200 mb-2">Upscaled</p>
                          {img.upscaled ? (
                            <img src={img.upscaled} alt="Upscaled" className="w-full h-20 object-cover rounded" />
                          ) : (
                            <div className="w-full h-20 bg-white/10 rounded flex items-center justify-center">
                              <span className="text-xs text-purple-200">-</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {img.upscaled && (
                        <button
                          onClick={() => downloadImage(img.upscaled)}
                          className="mt-2 w-full px-2 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded text-blue-200 font-semibold transition"
                        >
                          📥 Download
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-purple-100">Original</h3>
                      <div className="bg-black/30 rounded-lg p-2 overflow-auto max-h-64">
                        <img
                          src={images[0].preview}
                          alt="Original"
                          className="max-w-full h-auto"
                        />
                      </div>
                    </div>

                    {upscaledImage && (
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold text-purple-100">Upscaled</h3>
                          <button
                            onClick={() => downloadImage()}
                            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded text-white text-sm font-semibold transition"
                          >
                            📥 Download
                          </button>
                        </div>
                        <div className="bg-black/30 rounded-lg p-2 overflow-auto max-h-64">
                          <img
                            src={upscaledImage}
                            alt="Upscaled"
                            className="max-w-full h-auto"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {images.length === 0 && (
                  <div className="text-center py-12 text-purple-200">
                    <p className="text-lg">Upload an image to get started</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Techniques Info */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-6 text-white">🎓 Techniques Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold mb-2 text-purple-100">🚀 Lanczos Resampling</h3>
              <p className="text-sm text-purple-200">
                Best quality interpolation using sinc windowing. +30% better than bicubic.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold mb-2 text-purple-100">🎯 Adaptive Sharpening</h3>
              <p className="text-sm text-purple-200">
                Intelligent sharpness that respects edges and smooth areas separately.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold mb-2 text-purple-100">🎨 Chroma Upsampling</h3>
              <p className="text-sm text-purple-200">
                Separate Y/Cb/Cr upscaling for 20% better color quality and less artifacts.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold mb-2 text-purple-100">🔇 Denoise Filters</h3>
              <p className="text-sm text-purple-200">
                Bilateral or Non-Local Means filtering removes noise before upscaling.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold mb-2 text-purple-100">✨ CLAHE</h3>
              <p className="text-sm text-purple-200">
                Local contrast enhancement reveals details in dark and bright areas.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="font-semibold mb-2 text-purple-100">🔄 Multi-Pass</h3>
              <p className="text-sm text-purple-200">
                For 4x+ scales, multiple 2x passes provide +25% better quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
