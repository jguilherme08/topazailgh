/**
 * Unsharp Mask - Selective Sharpening Technique
 * Enhances edges and details after upscaling
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

  // Apply horizontal blur
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

export function unsharpMask(
  imageData: ImageData,
  amount: number = 1.2, // 100-150% = 1.0-1.5
  radius: number = 0.5,
  threshold: number = 0
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);

  // Create blurred version
  const blurred = gaussianBlur(data, width, height, radius);

  // Apply unsharp mask
  const result = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i++) {
    const original = data[i];
    const blur = blurred[i];
    const difference = original - blur;

    if (Math.abs(difference) > threshold) {
      result[i] = Math.min(255, Math.max(0, original + difference * amount));
    } else {
      result[i] = original;
    }
  }

  return new ImageData(result, width, height);
}

export function highPassFilter(
  imageData: ImageData,
  radius: number = 1.5,
  strength: number = 0.5
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data);

  // Create blurred version
  const blurred = gaussianBlur(data, width, height, radius);

  // High pass = original - blurred
  const result = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i++) {
    const original = data[i];
    const blur = blurred[i];
    // Shift to center around 128 for overlay blending
    const highPass = original - blur + 128;
    result[i] = Math.min(255, Math.max(0, 128 + (highPass - 128) * strength));
  }

  return new ImageData(result, width, height);
}
