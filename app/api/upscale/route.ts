import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const PROCESSING_TIMEOUT = 290000; // ~4.8 minutos

export async function POST(request: NextRequest) {
  let errorContext = 'initialization';

  try {
    // Validar token
    errorContext = 'token-validation';
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.error('REPLICATE_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: token,
    });

    // Parse FormData
    errorContext = 'form-parsing';
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const scale = Math.min(Math.max(parseInt(formData.get('scale') as string) || 2, 1), 4);
    const faceRestore = (formData.get('faceRestore') as string) === 'true';

    console.log(`[Upscale] Received: file=${file?.name}, size=${file?.size}, scale=${scale}, faceRestore=${faceRestore}`);

    // Validações
    errorContext = 'file-validation';
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 413 });
    }

    // Converter para URL (usando blob URL temporário ou carregando)
    errorContext = 'image-conversion';
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64}`;

    console.log(`[Upscale] Converted to base64: ${base64.length} bytes`);

    // Chamar Real-ESRGAN
    errorContext = 'real-esrgan-call';
    console.log(`[Upscale] Starting Real-ESRGAN with scale=${scale}`);

    let upscaledImageUrl: string | null = null;

    try {
      const esrganResult = await Promise.race([
        (async () => {
          console.log(`[Upscale] Calling replicate.run for Real-ESRGAN...`);
          const result = await replicate.run(
            'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164291fe0739df7adf4634a3a6c547f4f2fcf7a',
            {
              input: {
                image: dataUrl,
                scale: scale,
                face_enhance: false,
              },
            }
          );
          console.log(`[Upscale] Real-ESRGAN result type:`, typeof result, Array.isArray(result) ? 'array' : 'value');
          console.log(`[Upscale] Real-ESRGAN result:`, result);
          return result;
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Real-ESRGAN timeout')), PROCESSING_TIMEOUT)
        ),
      ]);

      // Extrair URL do resultado (pode ser string ou array)
      if (Array.isArray(esrganResult)) {
        upscaledImageUrl = esrganResult[0] as string;
      } else if (typeof esrganResult === 'string') {
        upscaledImageUrl = esrganResult;
      } else if (esrganResult && typeof esrganResult === 'object' && 'output' in esrganResult) {
        upscaledImageUrl = (esrganResult as any).output;
      }

      if (!upscaledImageUrl) {
        throw new Error(`Invalid Real-ESRGAN result: ${JSON.stringify(esrganResult)}`);
      }

      console.log(`[Upscale] Real-ESRGAN success: ${upscaledImageUrl}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Upscale] Real-ESRGAN failed: ${msg}`, err);
      throw new Error(`Real-ESRGAN: ${msg}`);
    }

    // Face Restoration (opcional)
    let finalImageUrl = upscaledImageUrl;

    if (faceRestore && upscaledImageUrl) {
      errorContext = 'gfpgan-call';
      try {
        console.log(`[Upscale] Starting GFPGAN...`);

        const gfpganResult = await Promise.race([
          (async () => {
            const result = await replicate.run(
              'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff079fbef5',
              {
                input: {
                  img: upscaledImageUrl,
                  version: '1.4',
                  scale: 2,
                },
              }
            );
            console.log(`[Upscale] GFPGAN result:`, result);
            return result;
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('GFPGAN timeout')), PROCESSING_TIMEOUT)
          ),
        ]);

        if (Array.isArray(gfpganResult)) {
          finalImageUrl = gfpganResult[0] as string;
        } else if (typeof gfpganResult === 'string') {
          finalImageUrl = gfpganResult;
        }

        console.log(`[Upscale] GFPGAN success`);
      } catch (err) {
        console.warn(`[Upscale] GFPGAN failed (continuing with upscaled image):`, err);
      }
    }

    // Download final image
    errorContext = 'image-download';
    console.log(`[Upscale] Downloading final image from: ${finalImageUrl}`);

    const response = await fetch(finalImageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();
    if (imageBuffer.byteLength === 0) {
      throw new Error('Downloaded image is empty');
    }

    console.log(`[Upscale] Success! Image size: ${imageBuffer.byteLength} bytes`);

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Upscale] Error in ${errorContext}: ${errorMsg}`, error);

    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: errorMsg,
        context: errorContext,
      },
      { status: 500 }
    );
  }
}
