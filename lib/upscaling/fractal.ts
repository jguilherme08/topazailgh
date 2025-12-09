/**
 * Fractal Upscaling Technique
 * 1. Scale to 200%
 * 2. Apply light Gaussian blur
 * 3. Overlay original with specific blend mode
 * 4. Adjust curves for contrast recovery
 */

function gaussianBlur(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
): Uint8ClampedArray {
  const blurred = new Uint8ClampedArray(data.length);
  const kernel: number[] = [];
  let sum = 0;

  for (let i = -Math.ceil(radius); i <= Math.ceil(radius); i++) {
    const value = Math.exp(-(i * i) / (2 * radius * radius));
    kernel.push(value);
    sum += value;
  }

  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  const kradius = Math.ceil(radius);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 4; c++) {
        let value = 0;
        let weight = 0;

        for (let i = -kradius; i <= kradius; i++) {
          const px = Math.min(Math.max(x + i, 0), width - 1);
          const k = kernel[i + kradius];
          value += data[(y * width + px) * 4 + c] * k;
          weight += k;
        }

        blurred[(y * width + x) * 4 + c] = Math.round(value / weight);
      }
    }
  }

  return blurred;
}

function bilinearUpscale(imageData: ImageData, scale: number): ImageData {
  const srcWidth = imageData.width;
  const srcHeight = imageData.height;
  const dstWidth = Math.round(srcWidth * scale);
  const dstHeight = Math.round(srcHeight * scale);

  const dstData = new Uint8ClampedArray(dstWidth * dstHeight * 4);

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = x / scale;
      const srcY = y / scale;

      const xi = Math.floor(srcX);
      const yi = Math.floor(srcY);
      const fx = srcX - xi;
      const fy = srcY - yi;

      const x0 = Math.min(xi, srcWidth - 1);
      const x1 = Math.min(xi + 1, srcWidth - 1);
      const y0 = Math.min(yi, srcHeight - 1);
      const y1 = Math.min(yi + 1, srcHeight - 1);

      for (let c = 0; c < 4; c++) {
        const p00 = imageData.data[(y0 * srcWidth + x0) * 4 + c];
        const p10 = imageData.data[(y0 * srcWidth + x1) * 4 + c];
        const p01 = imageData.data[(y1 * srcWidth + x0) * 4 + c];
        const p11 = imageData.data[(y1 * srcWidth + x1) * 4 + c];

        const px0 = p00 * (1 - fx) + p10 * fx;
        const px1 = p01 * (1 - fx) + p11 * fx;
        const value = Math.round(px0 * (1 - fy) + px1 * fy);

        dstData[(y * dstWidth + x) * 4 + c] = value;
      }
    }
  }

  return new ImageData(dstData, dstWidth, dstHeight);
}

function overlayBlend(
  base: Uint8ClampedArray,
  overlay: Uint8ClampedArray
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(base.length);

  for (let i = 0; i < base.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const b = base[i + c] / 255;
      const o = overlay[i + c] / 255;

      let blended: number;
      if (b < 0.5) {
        blended = 2 * b * o;
      } else {
        blended = 1 - 2 * (1 - b) * (1 - o);
      }

      result[i + c] = Math.round(blended * 255);
    }
    result[i + 3] = 255;
  }

  return result;
}

function adjustCurves(
  data: Uint8ClampedArray,
  contrast: number = 1.2
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data.length);
  const mid = 128;

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const val = data[i + c];
      // Contrast curve: push values away from middle
      const adjusted = mid + (val - mid) * contrast;
      result[i + c] = Math.min(255, Math.max(0, Math.round(adjusted)));
    }
    result[i + 3] = 255;
  }

  return result;
}

export function fractalUpscale(
  imageData: ImageData,
  scale: number = 2,
  blurRadius: number = 0.4,
  contrastBoost: number = 1.2
): ImageData {
  // Step 1: Upscale to target size (using bilinear for base)
  const upscaled = bilinearUpscale(imageData, scale);

  // Step 2: Apply light Gaussian blur to upscaled
  const blurred = gaussianBlur(upscaled.data, upscaled.width, upscaled.height, blurRadius);

  // Step 3: Resize original to match upscaled dimensions for overlay
  const originalResized = bilinearUpscale(imageData, scale);

  // Step 4: Overlay blend - combine blurred upscale with original
  const overlayed = overlayBlend(blurred, originalResized.data);

  // Step 5: Adjust curves to recover contrast
  const final = adjustCurves(overlayed, contrastBoost);

  return new ImageData(final as any, upscaled.width, upscaled.height);
}
