/**
 * Main upscaling processor
 * Combines all techniques into a unified interface
 */

import { bicubicUpscale } from './bicubic';
import { lanczosUpscale } from './lanczos';
import { unsharpMask, highPassFilter } from './sharpening';
import { adaptiveUnsharpMask } from './adaptiveSharpening';
import { edgeAwareUpscale } from './edgeAware';
import { frequencySeparationUpscale } from './frequencySeparation';
import { fractalUpscale } from './fractal';
import { bilateralFilter, nonLocalMeansDenoise } from './denoise';
import { clahe } from './clahe';
import { separateChromaUpscale } from './chromaUpscale';

export type UpscalingMethod = 
  | 'bicubic'
  | 'lanczos'
  | 'bicubic+unsharp'
  | 'bicubic+highpass'
  | 'lanczos+adaptive'
  | 'edgeaware'
  | 'frequency'
  | 'fractal'
  | 'chroma';

export interface UpscalingOptions {
  method: UpscalingMethod;
  scale?: number;
  sharpnessAmount?: number;
  sharpnessRadius?: number;
  sharpnessThreshold?: number;
  edgeThreshold?: number;
  contrastBoost?: number;
  denoise?: boolean;
  denoiseMethod?: 'bilateral' | 'nlm';
  denoiseStrength?: number;
  enableCLAHE?: boolean;
  claheClipLimit?: number;
  enableMultiPass?: boolean;
}

export function processUpscaling(
  imageData: ImageData,
  options: UpscalingOptions
): ImageData {
  let scale = options.scale || 2;
  let result = imageData;

  // Pre-processing: Denoise if enabled
  if (options.denoise) {
    result = applyDenoise(result, options.denoiseMethod || 'bilateral', options.denoiseStrength || 1);
  }

  // Multi-pass upscaling for scales >= 4
  if (options.enableMultiPass && scale >= 4) {
    result = multiPassUpscale(result, scale, options);
    return postProcess(result, options);
  }

  // Main upscaling
  switch (options.method) {
    case 'lanczos':
      result = lanczosUpscale(result, scale);
      break;

    case 'lanczos+adaptive':
      result = lanczosUpscale(result, scale);
      result = adaptiveUnsharpMask(
        result,
        options.sharpnessAmount || 1.5,
        options.sharpnessRadius || 0.7,
        options.sharpnessThreshold || 2
      );
      break;

    case 'chroma':
      // Use lanczos for luminance upscaling
      const lanczosWrapper = (data: Uint8ClampedArray, width: number, height: number, s: number) => {
        const imgData = new ImageData(new Uint8ClampedArray(data), width, height);
        const upscaled = lanczosUpscale(imgData, s);
        return upscaled.data;
      };
      result = separateChromaUpscale(result, lanczosWrapper, scale);
      break;

    case 'bicubic':
      result = bicubicUpscale(result, scale);
      break;

    case 'bicubic+unsharp':
      result = bicubicUpscale(result, scale);
      result = unsharpMask(
        result,
        options.sharpnessAmount || 1.3,
        options.sharpnessRadius || 0.7,
        options.sharpnessThreshold || 2
      );
      break;

    case 'bicubic+highpass':
      result = bicubicUpscale(result, scale);
      const hpf = highPassFilter(result, options.sharpnessRadius || 1.5);
      result = blendHighPass(result, hpf, 0.5);
      break;

    case 'edgeaware':
      result = edgeAwareUpscale(
        result,
        scale,
        options.edgeThreshold || 50
      );
      break;

    case 'frequency':
      result = frequencySeparationUpscale(
        result,
        scale,
        options.sharpnessAmount || 1.5
      );
      break;

    case 'fractal':
      result = fractalUpscale(
        result,
        scale,
        options.sharpnessRadius || 0.4,
        options.contrastBoost || 1.2
      );
      break;

    default:
      result = bicubicUpscale(result, scale);
  }

  // Post-processing: CLAHE and tonemapping
  return postProcess(result, options);
}

function multiPassUpscale(
  imageData: ImageData,
  targetScale: number,
  options: UpscalingOptions
): ImageData {
  let result = imageData;

  // Scale: 4x -> 2x then 2x again
  // Scale: 8x -> 2x, 2x, 2x
  const passes = Math.ceil(Math.log2(targetScale));

  for (let i = 0; i < passes; i++) {
    const passOptions = { ...options, scale: 2, enableMultiPass: false };
    result = processUpscaling(result, passOptions);
  }

  return result;
}

function postProcess(
  imageData: ImageData,
  options: UpscalingOptions
): ImageData {
  let result = imageData;

  // Apply CLAHE if enabled
  if (options.enableCLAHE) {
    result = clahe(result, options.claheClipLimit || 2.0);
  }

  return result;
}

function applyDenoise(
  imageData: ImageData,
  method: 'bilateral' | 'nlm',
  strength: number
): ImageData {
  const radius = strength * 2;

  if (method === 'nlm') {
    return nonLocalMeansDenoise(imageData, 5, 21, 10 * strength);
  }

  return bilateralFilter(imageData, radius, 50);
}

function blendHighPass(
  base: ImageData,
  highPass: ImageData,
  strength: number
): ImageData {
  const result = new Uint8ClampedArray(base.data.length);

  for (let i = 0; i < base.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const baseVal = base.data[i + c];
      const hpVal = highPass.data[i + c];
      
      // Blend high-pass overlay
      const hpNorm = (hpVal - 128) * strength;
      result[i + c] = Math.min(255, Math.max(0, baseVal + hpNorm));
    }
    result[i + 3] = base.data[i + 3];
  }

  return new ImageData(result, base.width, base.height);
}

export const TECHNIQUE_DESCRIPTIONS: Record<UpscalingMethod, string> = {
  bicubic: 'Bicubic Interpolation - Base technique using 16 neighboring pixels',
  lanczos: 'Lanczos Resampling - Superior quality using sinc windowing (+30% vs bicubic)',
  'bicubic+unsharp': 'Bicubic + Unsharp Mask - Enhanced with selective sharpening',
  'bicubic+highpass': 'Bicubic + High Pass Filter - Better edge definition',
  'lanczos+adaptive': 'Lanczos + Adaptive Sharpening - Intelligent edge-aware sharpening',
  edgeaware: 'Edge-Aware - Different handling for edges vs smooth areas',
  frequency: 'Frequency Separation - High/low frequency upscaling',
  fractal: 'Fractal Upscaling - Blur overlay with contrast recovery',
  chroma: 'Chroma-Optimized - Separate Y/Cb/Cr processing for better color',
};
