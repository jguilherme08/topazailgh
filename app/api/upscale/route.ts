import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const PROCESSING_TIMEOUT = 600000; // 10 minutos para uploads grandes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Convert File to base64 data URL
 */
function fileToDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Extract image URL from Replicate result
 */
function extractImageUrl(result: any): string | null {
  // Handle array result
  if (Array.isArray(result) && result.length > 0) {
    const url = result[0];
    if (typeof url === 'string') return url;
  }
  
  // Handle string result
  if (typeof result === 'string') return result;
  
  // Handle object with output property
  if (result && typeof result === 'object') {
    if ('output' in result && typeof result.output === 'string') return result.output;
    if ('url' in result && typeof result.url === 'string') return result.url;
    if ('image' in result && typeof result.image === 'string') return result.image;
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  let errorContext = 'initialization';
  const startTime = Date.now();

  try {
    // Validar token
    errorContext = 'token-validation';
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.error('[Upscale] ERROR: REPLICATE_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Replicate API token not configured', context: errorContext },
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
    
    if (!file) {
      console.error('[Upscale] ERROR: No file provided');
      return NextResponse.json(
        { error: 'No file provided', context: errorContext },
        { status: 400 }
      );
    }

    const scale = Math.min(Math.max(parseInt(formData.get('scale') as string) || 2, 1), 4);
    const faceRestore = (formData.get('faceRestore') as string) === 'true';

    console.log(`[Upscale] START: file=${file.name}, size=${file.size}B, scale=${scale}x, faceRestore=${faceRestore}`);

    // Validações
    errorContext = 'file-validation';
    
    if (file.size === 0) {
      console.error('[Upscale] ERROR: File is empty');
      return NextResponse.json(
        { error: 'File is empty', context: errorContext },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      console.error(`[Upscale] ERROR: File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit: ${file.size}B`);
      return NextResponse.json(
        { error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`, context: errorContext },
        { status: 413 }
      );
    }

    // Converter para data URL
    errorContext = 'image-conversion';
    const buffer = await file.arrayBuffer();
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = fileToDataUrl(Buffer.from(buffer), mimeType);

    console.log(`[Upscale] Converted to base64: ${buffer.byteLength}B -> ${dataUrl.length}B`);

    // Chamar Real-ESRGAN com melhor tratamento de erros
    errorContext = 'real-esrgan-call';
    console.log(`[Upscale] Calling Real-ESRGAN with scale=${scale}...`);

    let upscaledImageUrl: string | null = null;

    try {
      const esrganResult = await Promise.race([
        (async () => {
          try {
            console.log(`[Upscale] Replicate.run started for Real-ESRGAN`);
            const result = await replicate.run(
              'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164291fe0739df7adf4634a3a6c547f4f2fcf7a',
              {
                input: {
                  image: dataUrl,
                  scale: scale,
                  face_enhance: false,
                  tile: 400, // Adicionar tile para evitar problemas de memória
                  suffix: '',
                  alpha_upsampler: 'realesrgan',
                },
              }
            );
            
            console.log(`[Upscale] Real-ESRGAN response type: ${typeof result}`);
            console.log(`[Upscale] Real-ESRGAN is array: ${Array.isArray(result)}`);
            
            if (!result) {
              throw new Error('Real-ESRGAN returned empty result');
            }
            
            console.log(`[Upscale] Real-ESRGAN result:`, JSON.stringify(result).substring(0, 200));
            return result;
          } catch (innerError) {
            const msg = innerError instanceof Error ? innerError.message : String(innerError);
            console.error(`[Upscale] Real-ESRGAN inner error: ${msg}`);
            throw innerError;
          }
        })(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Real-ESRGAN timeout after ${PROCESSING_TIMEOUT / 1000}s`)),
            PROCESSING_TIMEOUT
          )
        ),
      ]);

      upscaledImageUrl = extractImageUrl(esrganResult);

      if (!upscaledImageUrl) {
        const resultStr = JSON.stringify(esrganResult);
        throw new Error(`Could not extract image URL from result. Result: ${resultStr.substring(0, 500)}`);
      }

      console.log(`[Upscale] Real-ESRGAN success: ${upscaledImageUrl.substring(0, 80)}...`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Upscale] Real-ESRGAN failed: ${msg}`);
      throw new Error(`Real-ESRGAN failed: ${msg}`);
    }

    // Face Restoration (opcional)
    let finalImageUrl = upscaledImageUrl;

    if (faceRestore && upscaledImageUrl) {
      errorContext = 'gfpgan-call';
      try {
        console.log(`[Upscale] Starting GFPGAN face restoration...`);

        const gfpganResult = await Promise.race([
          (async () => {
            try {
              const result = await replicate.run(
                'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff079fbef6',
                {
                  input: {
                    img: upscaledImageUrl,
                    version: '1.4',
                    scale: 2,
                  },
                }
              );
              
              console.log(`[Upscale] GFPGAN response type: ${typeof result}`);
              if (!result) {
                throw new Error('GFPGAN returned empty result');
              }
              
              console.log(`[Upscale] GFPGAN result:`, JSON.stringify(result).substring(0, 200));
              return result;
            } catch (innerError) {
              const msg = innerError instanceof Error ? innerError.message : String(innerError);
              console.error(`[Upscale] GFPGAN inner error: ${msg}`);
              throw innerError;
            }
          })(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`GFPGAN timeout after ${PROCESSING_TIMEOUT / 1000}s`)),
              PROCESSING_TIMEOUT
            )
          ),
        ]);

        const gfpganUrl = extractImageUrl(gfpganResult);
        if (gfpganUrl) {
          finalImageUrl = gfpganUrl;
          console.log(`[Upscale] GFPGAN success: ${gfpganUrl.substring(0, 80)}...`);
        } else {
          console.warn(`[Upscale] GFPGAN result invalid, continuing with upscaled image`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[Upscale] GFPGAN failed (continuing with upscaled image): ${msg}`);
      }
    }

    // Download final image
    errorContext = 'image-download';
    console.log(`[Upscale] Downloading final image from Replicate...`);

    let imageBuffer: ArrayBuffer;
    try {
      const controller = new AbortController();
      const downloadTimeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

      try {
        const response = await fetch(finalImageUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Topaz-Upscaler',
          },
        });

        clearTimeout(downloadTimeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText} from ${finalImageUrl}`);
        }

        imageBuffer = await response.arrayBuffer();
        
        if (imageBuffer.byteLength === 0) {
          throw new Error('Downloaded image is empty');
        }

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Upscale] SUCCESS! Downloaded ${imageBuffer.byteLength}B in ${elapsedTime}s`);
      } catch (fetchErr) {
        clearTimeout(downloadTimeout);
        if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
          throw new Error('Download timeout (60s exceeded)');
        }
        throw fetchErr;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Upscale] Download failed: ${msg}`);
      throw new Error(`Failed to download image: ${msg}`);
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Processing-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.error(`[Upscale] FAILED in ${errorContext} after ${elapsedTime}s: ${errorMsg}`);
    if (error instanceof Error && error.stack) {
      console.error(`[Upscale] Stack trace:`, error.stack);
    }

    return NextResponse.json(
      {
        error: 'Failed to upscale image',
        details: errorMsg,
        context: errorContext,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
