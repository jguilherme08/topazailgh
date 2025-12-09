/**
 * Edge-Aware Upscaling
 * Detects edges and applies different upscaling to edges vs smooth areas
 */

function sobelEdgeDetection(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Float32Array {
  const edges = new Float32Array(width * height);

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const idx = (y + dy) * width + (x + dx);
          // Use luminosity: R*0.299 + G*0.587 + B*0.114
          const pixel = data[idx * 4] * 0.299 + data[idx * 4 + 1] * 0.587 + data[idx * 4 + 2] * 0.114;
          
          const kernelIdx = (dy + 1) * 3 + (dx + 1);
          gx += pixel * sobelX[kernelIdx];
          gy += pixel * sobelY[kernelIdx];
        }
      }

      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy) / 1024; // Normalize
    }
  }

  return edges;
}

export function edgeAwareUpscale(
  imageData: ImageData,
  scale: number = 2,
  edgeThreshold: number = 50
): ImageData {
  const srcWidth = imageData.width;
  const srcHeight = imageData.height;
  const dstWidth = Math.round(srcWidth * scale);
  const dstHeight = Math.round(srcHeight * scale);

  // Detect edges in original image
  const edges = sobelEdgeDetection(imageData.data, srcWidth, srcHeight);

  // For edge-aware upscaling, we'll use sharper interpolation for edges
  // and softer interpolation for smooth areas
  const dstData = new Uint8ClampedArray(dstWidth * dstHeight * 4);

  for (let y = 0; y < dstHeight; y++) {
    for (let x = 0; x < dstWidth; x++) {
      const srcX = x / scale;
      const srcY = y / scale;

      const srcXFloor = Math.floor(srcX);
      const srcYFloor = Math.floor(srcY);

      // Sample edge strength from nearby pixels
      let edgeStrength = 0;
      let edgeCount = 0;

      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = 0; dx <= 1; dx++) {
          const px = Math.min(srcXFloor + dx, srcWidth - 1);
          const py = Math.min(srcYFloor + dy, srcHeight - 1);
          
          if (px < srcWidth && py < srcHeight) {
            edgeStrength += edges[py * srcWidth + px];
            edgeCount++;
          }
        }
      }

      edgeStrength /= edgeCount;
      const isEdge = edgeStrength > (edgeThreshold / 255);

      for (let channel = 0; channel < 4; channel++) {
        let value: number;

        if (isEdge) {
          // Use sharper interpolation for edges (bicubic-like)
          const xi = Math.floor(srcX);
          const yi = Math.floor(srcY);
          const fx = srcX - xi;
          const fy = srcY - yi;

          value = 0;
          let weight = 0;

          for (let dy = -1; dy <= 2; dy++) {
            for (let dx = -1; dx <= 2; dx++) {
              const px = Math.min(Math.max(xi + dx, 0), srcWidth - 1);
              const py = Math.min(Math.max(yi + dy, 0), srcHeight - 1);
              
              const pixelIndex = (py * srcWidth + px) * 4 + channel;
              const pixelValue = imageData.data[pixelIndex];
              
              // Simple cubic kernel
              const ax = Math.abs(fx - dx);
              const ay = Math.abs(fy - dy);
              const k = (1 - ax * ax * (3 - 2 * ax)) * (1 - ay * ay * (3 - 2 * ay));
              
              value += pixelValue * k;
              weight += k;
            }
          }

          value = Math.round(value / weight);
        } else {
          // Use softer interpolation for smooth areas (bilinear)
          const xi = Math.floor(srcX);
          const yi = Math.floor(srcY);
          const fx = srcX - xi;
          const fy = srcY - yi;

          const x0 = Math.min(xi, srcWidth - 1);
          const x1 = Math.min(xi + 1, srcWidth - 1);
          const y0 = Math.min(yi, srcHeight - 1);
          const y1 = Math.min(yi + 1, srcHeight - 1);

          const p00 = imageData.data[(y0 * srcWidth + x0) * 4 + channel];
          const p10 = imageData.data[(y0 * srcWidth + x1) * 4 + channel];
          const p01 = imageData.data[(y1 * srcWidth + x0) * 4 + channel];
          const p11 = imageData.data[(y1 * srcWidth + x1) * 4 + channel];

          const px0 = p00 * (1 - fx) + p10 * fx;
          const px1 = p01 * (1 - fx) + p11 * fx;
          value = Math.round(px0 * (1 - fy) + px1 * fy);
        }

        dstData[(y * dstWidth + x) * 4 + channel] = value;
      }
    }
  }

  return new ImageData(dstData, dstWidth, dstHeight);
}
