/**
 * Bicubic Interpolation - Base upscaling technique
 * Uses 16 neighboring pixels for smoother results than bilinear
 */

export function cubicKernel(x: number): number {
  const absX = Math.abs(x);
  
  if (absX <= 1) {
    return 1 - 2 * absX * absX + absX * absX * absX;
  } else if (absX < 2) {
    return -4 + 8 * absX - 5 * absX * absX + absX * absX * absX;
  }
  
  return 0;
}

export function bicubicInterpolation(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  channel: number
): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;

  let value = 0;
  let weight = 0;

  for (let dy = -1; dy <= 2; dy++) {
    for (let dx = -1; dx <= 2; dx++) {
      const px = Math.min(Math.max(xi + dx, 0), width - 1);
      const py = Math.min(Math.max(yi + dy, 0), height - 1);
      
      const pixelIndex = (py * width + px) * 4 + channel;
      const pixelValue = data[pixelIndex];
      
      const kernelX = cubicKernel(fx - dx);
      const kernelY = cubicKernel(fy - dy);
      const k = kernelX * kernelY;
      
      value += pixelValue * k;
      weight += k;
    }
  }

  return weight !== 0 ? Math.round(value / weight) : 0;
}

export function bicubicUpscale(
  imageData: ImageData,
  scale: number = 2
): ImageData {
  const srcWidth = imageData.width;
  const srcHeight = imageData.height;
  const dstWidth = Math.round(srcWidth * scale);
  const dstHeight = Math.round(srcHeight * scale);

  const srcData = imageData.data;
  const dstData = new Uint8ClampedArray(dstWidth * dstHeight * 4);

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = x / scale;
      const srcY = y / scale;

      for (let channel = 0; channel < 4; channel++) {
        const value = bicubicInterpolation(srcData, srcWidth, srcHeight, srcX, srcY, channel);
        dstData[(y * dstWidth + x) * 4 + channel] = value;
      }
    }
  }

  return new ImageData(dstData, dstWidth, dstHeight);
}
