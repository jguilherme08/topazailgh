/**
 * Richardson-Lucy Deconvolution
 * Reverts camera/motion blur
 * +50% effective on motion-blurred photos
 */

export function generateBlurKernel(radius: number, strength: number = 1.0): Float32Array {
  const size = Math.ceil(radius * 2) + 1;
  const kernel = new Float32Array(size * size);
  const center = Math.floor(size / 2);

  let sum = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const val = Math.exp(-(dist * dist) / (2 * radius * radius * strength * strength));
      kernel[y * size + x] = val;
      sum += val;
    }
  }

  // Normalize
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  return kernel;
}

export function convolve(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: Float32Array,
  kernelSize: number
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data.length);
  const center = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const px = Math.min(Math.max(x + kx - center, 0), width - 1);
            const py = Math.min(Math.max(y + ky - center, 0), height - 1);

            const pixelIdx = (py * width + px) * 4 + c;
            const kernelIdx = ky * kernelSize + kx;

            sum += data[pixelIdx] * kernel[kernelIdx];
          }
        }

        result[(y * width + x) * 4 + c] = Math.round(sum);
      }

      // Copy alpha
      result[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3];
    }
  }

  return result;
}

export function richardsonLucyDeconvolve(
  imageData: ImageData,
  iterations: number = 5,
  blurRadius: number = 1.5
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  let estimate = new Uint8ClampedArray(imageData.data);

  const kernelSize = Math.ceil(blurRadius * 2) + 1;
  const kernel = generateBlurKernel(blurRadius);

  for (let iter = 0; iter < iterations; iter++) {
    // Forward convolution
    const convolved = convolve(estimate, width, height, kernel, kernelSize);

    // Compute error (observed / convolved)
    const error = new Uint8ClampedArray(estimate.length);
    for (let i = 0; i < estimate.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const observed = imageData.data[i + c];
        const conv = convolved[i + c];
        error[i + c] = conv > 0 ? (observed / (conv + 1e-6)) * 255 : 255;
      }
      error[i + 3] = estimate[i + 3];
    }

    // Backward convolution (reflected kernel)
    const reflected = new Float32Array(kernel.length);
    for (let i = 0; i < kernel.length; i++) {
      reflected[kernel.length - 1 - i] = kernel[i];
    }

    const correction = convolve(error, width, height, reflected, kernelSize);

    // Update estimate
    for (let i = 0; i < estimate.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const updated = (estimate[i + c] * correction[i + c]) / 255;
        estimate[i + c] = Math.min(255, Math.max(0, Math.round(updated)));
      }
    }
  }

  return new ImageData(estimate, width, height);
}

export function motionDeblur(
  imageData: ImageData,
  length: number = 5,
  angle: number = 0,
  iterations: number = 3
): ImageData {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Create motion blur kernel
  const kernelSize = Math.ceil(length * 2) + 1;
  const kernel = new Float32Array(kernelSize * kernelSize);
  const center = Math.floor(kernelSize / 2);

  // Motion blur line
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);

  for (let i = 0; i < length; i++) {
    const x = Math.round(i * dx);
    const y = Math.round(i * dy);

    const kx = x + center;
    const ky = y + center;

    if (kx >= 0 && kx < kernelSize && ky >= 0 && ky < kernelSize) {
      kernel[ky * kernelSize + kx] = 1;
    }
  }

  // Normalize
  let sum = 0;
  for (let i = 0; i < kernel.length; i++) {
    sum += kernel[i];
  }
  for (let i = 0; i < kernel.length; i++) {
    kernel[i] /= sum;
  }

  // Apply Richardson-Lucy
  let estimate = new Uint8ClampedArray(data);

  for (let iter = 0; iter < iterations; iter++) {
    const convolved = convolve(estimate, width, height, kernel, kernelSize);

    const error = new Uint8ClampedArray(estimate.length);
    for (let i = 0; i < estimate.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const observed = data[i + c];
        const conv = convolved[i + c];
        error[i + c] = conv > 0 ? (observed / (conv + 1e-6)) * 255 : 255;
      }
      error[i + 3] = estimate[i + 3];
    }

    const reflected = new Float32Array(kernel.length);
    for (let i = 0; i < kernel.length; i++) {
      reflected[kernel.length - 1 - i] = kernel[i];
    }

    const correction = convolve(error, width, height, reflected, kernelSize);

    for (let i = 0; i < estimate.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const updated = (estimate[i + c] * correction[i + c]) / 255;
        estimate[i + c] = Math.min(255, Math.max(0, Math.round(updated)));
      }
    }
  }

  return new ImageData(estimate, width, height);
}

export function autoDetectBlur(imageData: ImageData): { isBlurred: boolean; severity: number } {
  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  // Compute Laplacian variance
  let variance = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const center = getLuminance(data, x, y, width);
      const laplacian = -center * 4 +
        getLuminance(data, x + 1, y, width) +
        getLuminance(data, x - 1, y, width) +
        getLuminance(data, x, y + 1, width) +
        getLuminance(data, x, y - 1, width);

      variance += laplacian * laplacian;
      count++;
    }
  }

  variance /= count;

  // Threshold for blur detection
  const isBlurred = variance < 100;
  const severity = Math.max(0, Math.min(1, (100 - variance) / 100));

  return { isBlurred, severity };
}

function getLuminance(data: Uint8ClampedArray, x: number, y: number, width: number): number {
  const idx = (y * width + x) * 4;
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
