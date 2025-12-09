/**
 * Frequency Separation Upscaling
 * Separates high frequency (details) and low frequency (color/tone)
 * and upscales each with different parameters
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

  // Build Gaussian kernel
  for (let i = -Math.ceil(radius); i <= Math.ceil(radius); i++) {
    const value = Math.exp(-(i * i) / (2 * radius * radius));
    kernel.push(value);
    sum += value;
  }

  // Normalize kernel
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  const kradius = Math.ceil(radius);

  // Apply blur
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

export function frequencySeparationUpscale(
  imageData: ImageData,
  scale: number = 2,
  highFreqSharpness: number = 1.5
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const dstWidth = Math.round(width * scale);
  const dstHeight = Math.round(height * scale);

  // Step 1: Separate frequencies
  // Low frequency = heavily blurred version
  const lowFreq = gaussianBlur(imageData.data, width, height, 3);

  // High frequency = original - low frequency
  const highFreq = new Uint8ClampedArray(imageData.data.length);
  for (let i = 0; i < imageData.data.length; i++) {
    highFreq[i] = imageData.data[i] - lowFreq[i] + 128;
  }

  // Step 2: Upscale low frequency (color/tone) with smoothing
  const lowFreqUpscaled = bilinearUpscale(
    new ImageData(lowFreq as any, width, height),
    scale
  );

  // Step 3: Upscale high frequency (details) with sharpening
  const highFreqData = new ImageData(highFreq, width, height);
  const highFreqUpscaled = bilinearUpscale(highFreqData, scale);

  // Step 4: Recombine
  const result = new Uint8ClampedArray(dstWidth * dstHeight * 4);

  for (let i = 0; i < result.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const lowVal = lowFreqUpscaled.data[i + c];
      const highVal = (highFreqUpscaled.data[i + c] - 128) * highFreqSharpness;

      result[i + c] = Math.min(255, Math.max(0, lowVal + highVal));
    }
    result[i + 3] = 255; // Alpha
  }

  return new ImageData(result as any, dstWidth, dstHeight);
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
