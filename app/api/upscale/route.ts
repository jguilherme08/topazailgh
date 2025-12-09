import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Timeout para processar imagens (em ms)
const PROCESSING_TIMEOUT = 60000; // 60 segundos

export async function POST(request: NextRequest) {
  try {
    // Validar token
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured. Set REPLICATE_API_TOKEN environment variable.' },
        { status: 500 }
      );
    }

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
          'nightmareai/real-esrgan:42fed498d75f109e402ca388e19e19e27566plane02d3d6b6da7c33ec11b03d84a',
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

      upscaledImageUrl = esrganOutput as string;
      console.log('Real-ESRGAN completed successfully');
    } catch (esrganError) {
      console.error('Real-ESRGAN error:', esrganError);
      throw new Error(`Real-ESRGAN processing failed: ${(esrganError as Error).message}`);
    }

    // Opcional: aplicar restauração facial se solicitado
    let finalImageUrl = upscaledImageUrl;

    if (faceRestore) {
      try {
        console.log('Applying face restoration...');

        const gfpganOutput = await Promise.race([
          replicate.run(
            'tencentarc/gfpgan:0fbacf7afc6c144e5be9767cff079747f7f2ubef5',
            {
              input: {
                img: upscaledImageUrl,
                version: 1.4,
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
