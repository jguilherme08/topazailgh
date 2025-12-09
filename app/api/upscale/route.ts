import { NextRequest, NextResponse } from 'next/server';
// import Replicate from 'replicate';

// Timeout para processar imagens (em ms)
const PROCESSING_TIMEOUT = 290000; // ~4.8 minutos (deixa margem para o limite do Vercel)

export async function POST(request: NextRequest) {
  // Serviço de upscaling desativado no deploy Vercel sem Replicate
  return NextResponse.json(
    {
      error: 'O serviço de upscaling está desativado neste deploy. Nenhuma chave Replicate foi configurada. Para usar o upscaling, configure a variável REPLICATE_API_TOKEN ou utilize uma versão local.',
    },
    { status: 501 }
  );
}
