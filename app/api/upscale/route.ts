import { NextRequest, NextResponse } from 'next/server';
import { processUpscaling, UpscalingMethod } from '@/lib/upscaling/processor';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const method = (formData.get('method') as UpscalingMethod) || 'lanczos+adaptive';
    const scale = parseInt(formData.get('scale') as string) || 2;
    const sharpnessAmount = parseFloat(formData.get('sharpnessAmount') as string) || 1.5;
    const sharpnessRadius = parseFloat(formData.get('sharpnessRadius') as string) || 0.7;
    const edgeThreshold = parseInt(formData.get('edgeThreshold') as string) || 50;
    const contrastBoost = parseFloat(formData.get('contrastBoost') as string) || 1.2;
    const denoise = formData.get('denoise') === 'true' || true;
    const denoiseMethod = (formData.get('denoiseMethod') as 'bilateral' | 'nlm') || 'bilateral';
    const denoiseStrength = parseFloat(formData.get('denoiseStrength') as string) || 1;
    const enableCLAHE = formData.get('enableCLAHE') === 'true' || false;
    const claheClipLimit = parseFloat(formData.get('claheClipLimit') as string) || 2.0;
    const enableMultiPass = formData.get('enableMultiPass') === 'true' || false;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to blob and then to canvas
    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });
    const url = URL.createObjectURL(blob);

    // Use dynamic import to get canvas in Node.js
    const { createCanvas, loadImage } = await import('canvas');

    try {
      const image = await loadImage(url);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, image.width, image.height);

      // Process upscaling with new options
      const result = processUpscaling(imageData as any, {
        method,
        scale,
        sharpnessAmount,
        sharpnessRadius,
        edgeThreshold,
        contrastBoost,
        denoise,
        denoiseMethod,
        denoiseStrength,
        enableCLAHE,
        claheClipLimit,
        enableMultiPass,
      });

      // Convert back to canvas and get image
      const outputCanvas = createCanvas(result.width, result.height);
      const outputCtx = outputCanvas.getContext('2d');
      outputCtx.putImageData(result, 0, 0);

      // Convert to buffer
      const pngBuffer = outputCanvas.toBuffer('image/png');

      return new NextResponse(pngBuffer as any, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Length': pngBuffer.length.toString(),
        },
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Upscaling error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
