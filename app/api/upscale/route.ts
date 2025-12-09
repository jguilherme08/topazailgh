import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Timeout para processar imagens (em ms)
const PROCESSING_TIMEOUT = 290000; // ~4.8 minutos (deixa margem para o limite do Vercel)

export async function POST(request: NextRequest) {
  try {
    // Validar token
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      console.error('REPLICATE_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Replicate API token not configured. Set REPLICATE_API_TOKEN environment variable.' },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: token,
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const scale = parseInt(formData.get('scale') as string) || 2;
    const faceRestore = formData.get('faceRestore') === 'true' || false;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validar tamanho da imagem (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 413 }
      );
    }

    // Converter arquivo para base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    console.log(`Processing image with Replicate - Scale: ${scale}, FaceRestore: ${faceRestore}`);

    // Chamar Real-ESRGAN para upscaling
    let upscaledImageUrl = null;

    try {
      const esrganOutput = await Promise.race([
        replicate.run(
          'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164291fe0739df7adf4634a3a6c547f4f2fcf7a',
          {
            input: {
              image: dataUrl,
              scale: scale,
              face_enhance: false,
            },
          }
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Real-ESRGAN timeout')), PROCESSING_TIMEOUT)
        ),
      ]);

      if (!esrganOutput) {
        throw new Error('Real-ESRGAN returned empty result');
      }

      upscaledImageUrl = esrganOutput as string;
      console.log('Real-ESRGAN completed successfully:', upscaledImageUrl);
    } catch (esrganError) {
      const errorMsg = esrganError instanceof Error ? esrganError.message : String(esrganError);
      console.error('Real-ESRGAN error:', errorMsg, esrganError);
      throw new Error(`Real-ESRGAN processing failed: ${errorMsg}`);
    }

    // Opcional: aplicar restauração facial se solicitado
    let finalImageUrl = upscaledImageUrl;

    if (faceRestore) {
      try {
        console.log('Applying face restoration...');

        const gfpganOutput = await Promise.race([
          replicate.run(
            'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff079fbef5',
            {
              input: {
                img: upscaledImageUrl,
                version: '1.4',
                scale: 2,
              },
            }
          ),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('GFPGAN timeout')), PROCESSING_TIMEOUT)
          ),
        ]);

        finalImageUrl = gfpganOutput as string;
        console.log('GFPGAN face restoration completed');
      } catch (gfpganError) {
        console.warn('Face restoration failed, returning upscaled image:', gfpganError);
        // Não fazer falha se face restore não funcionar - retornar upscaled image mesmo assim
      }
    }

    // Baixar a imagem final
    const response = await fetch(finalImageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download processed image: ${response.statusText}`);
    }

    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Upscaling error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
