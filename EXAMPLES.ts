/**
 * Exemplos de Uso - Topaz Upscaling API
 * 
 * Este arquivo demonstra como usar o sistema de upscaling
 * para diferentes tipos de imagens e situações.
 */

// ============================================
// EXEMPLO 1: Texto Pequeno (OCR/Screenshots)
// ============================================

async function upscaleText() {
  const input = document.getElementById('imageInput') as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'bicubic+unsharp');
  formData.append('scale', '2'); // 2x
  formData.append('sharpnessAmount', '1.5'); // 150%
  formData.append('sharpnessRadius', '0.7');
  formData.append('sharpnessThreshold', '2');

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  const blob = await response.blob();
  displayResult(blob);
}

// ============================================
// EXEMPLO 2: Foto Natural (Paisagem/Retrato)
// ============================================

async function upscalePhoto() {
  const input = document.getElementById('imageInput') as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'frequency');
  formData.append('scale', '2');
  formData.append('sharpnessAmount', '1.2'); // 120%
  formData.append('sharpnessRadius', '0.5');
  formData.append('contrastBoost', '1.1'); // 110%

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  const blob = await response.blob();
  displayResult(blob);
}

// ============================================
// EXEMPLO 3: UI/Screenshot com Bordas Nítidas
// ============================================

async function upscaleUI() {
  const input = document.getElementById('imageInput') as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'edgeaware');
  formData.append('scale', '2');
  formData.append('edgeThreshold', '50');
  formData.append('sharpnessAmount', '1.3');

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  const blob = await response.blob();
  displayResult(blob);
}

// ============================================
// EXEMPLO 4: Texturas/Padrões (Fractal)
// ============================================

async function upscaleTexture() {
  const input = document.getElementById('imageInput') as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'fractal');
  formData.append('scale', '2');
  formData.append('sharpnessRadius', '0.4');
  formData.append('contrastBoost', '1.2'); // 120%

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  const blob = await response.blob();
  displayResult(blob);
}

// ============================================
// EXEMPLO 5: Teste Rápido (Bicubic Base)
// ============================================

async function quickTest() {
  const input = document.getElementById('imageInput') as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'bicubic');
  formData.append('scale', '2');

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  const blob = await response.blob();
  displayResult(blob);
}

// ============================================
// EXEMPLO 6: Ampliação 4x (Arquivo Grande)
// ============================================

async function upscale4x() {
  const input = document.getElementById('imageInput') as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'frequency'); // Melhor para 4x
  formData.append('scale', '4');
  formData.append('sharpnessAmount', '1.3');
  formData.append('contrastBoost', '1.15');

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  const blob = await response.blob();
  displayResult(blob);
}

// ============================================
// EXEMPLO 7: Comparação de Métodos
// ============================================

async function compareAllMethods() {
  const input = document.getElementById('imageInput') as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const methods = [
    'bicubic',
    'bicubic+unsharp',
    'bicubic+highpass',
    'edgeaware',
    'frequency',
    'fractal',
  ];

  const results: { method: string; blob: Blob }[] = [];

  for (const method of methods) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('method', method);
    formData.append('scale', '2');

    const response = await fetch('/api/upscale', {
      method: 'POST',
      body: formData,
    });

    const blob = await response.blob();
    results.push({ method, blob });
  }

  displayComparison(results);
}

// ============================================
// EXEMPLO 8: Processamento em Lote
// ============================================

async function batchUpscale(files: File[]) {
  const results: { file: string; url: string }[] = [];

  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('method', 'frequency');
    formData.append('scale', '2');

    const response = await fetch('/api/upscale', {
      method: 'POST',
      body: formData,
    });

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    results.push({ file: file.name, url });
  }

  return results;
}

// ============================================
// EXEMPLO 9: Otimizar por Tamanho
// ============================================

async function optimizeForPerformance(file: File) {
  // Arquivo muito grande? Use método rápido
  if (file.size > 2_000_000) { // > 2MB
    return upscaleQuick(file);
  }
  
  // Arquivo pequeno? Use method premium
  if (file.size < 500_000) { // < 500KB
    return upscaleFrequency(file);
  }

  // Tamanho médio? Balance
  return upscaleEdgeAware(file);
}

async function upscaleQuick(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'bicubic');
  formData.append('scale', '2');

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  return await response.blob();
}

async function upscaleFrequency(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'frequency');
  formData.append('scale', '2');

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  return await response.blob();
}

async function upscaleEdgeAware(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', 'edgeaware');
  formData.append('scale', '2');

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  return await response.blob();
}

// ============================================
// EXEMPLO 10: Tuning Avançado
// ============================================

interface UpscaleConfig {
  method:
    | 'bicubic'
    | 'bicubic+unsharp'
    | 'bicubic+highpass'
    | 'edgeaware'
    | 'frequency'
    | 'fractal';
  scale: number;
  sharpnessAmount?: number;
  sharpnessRadius?: number;
  edgeThreshold?: number;
  contrastBoost?: number;
}

async function upscaleWithConfig(file: File, config: UpscaleConfig) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('method', config.method);
  formData.append('scale', config.scale.toString());

  if (config.sharpnessAmount)
    formData.append('sharpnessAmount', config.sharpnessAmount.toString());
  if (config.sharpnessRadius)
    formData.append('sharpnessRadius', config.sharpnessRadius.toString());
  if (config.edgeThreshold)
    formData.append('edgeThreshold', config.edgeThreshold.toString());
  if (config.contrastBoost)
    formData.append('contrastBoost', config.contrastBoost.toString());

  const response = await fetch('/api/upscale', {
    method: 'POST',
    body: formData,
  });

  return await response.blob();
}

// Uso:
const config: UpscaleConfig = {
  method: 'frequency',
  scale: 2,
  sharpnessAmount: 1.4,
  sharpnessRadius: 0.6,
  contrastBoost: 1.15,
};
// const blob = await upscaleWithConfig(file, config);

// ============================================
// Funções Auxiliares
// ============================================

function displayResult(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = url;
  img.style.maxWidth = '100%';
  document.getElementById('result')?.appendChild(img);
}

function displayComparison(results: { method: string; blob: Blob }[]) {
  const container = document.getElementById('comparison');
  if (!container) return;

  results.forEach(({ method, blob }) => {
    const div = document.createElement('div');
    div.style.display = 'inline-block';
    div.style.margin = '10px';

    const title = document.createElement('h3');
    title.textContent = method;

    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    img.style.maxWidth = '300px';

    div.appendChild(title);
    div.appendChild(img);
    container.appendChild(div);
  });
}

// ============================================
// Presets Recomendados
// ============================================

export const PRESETS = {
  // Texto e código
  text: {
    method: 'bicubic+unsharp',
    scale: 2,
    sharpnessAmount: 1.5,
    sharpnessRadius: 0.7,
    sharpnessThreshold: 2,
  } as UpscaleConfig,

  // Fotos
  photo: {
    method: 'frequency',
    scale: 2,
    sharpnessAmount: 1.2,
    contrastBoost: 1.1,
  } as UpscaleConfig,

  // Screenshots/UI
  screenshot: {
    method: 'edgeaware',
    scale: 2,
    edgeThreshold: 50,
    sharpnessAmount: 1.3,
  } as UpscaleConfig,

  // Texturas
  texture: {
    method: 'fractal',
    scale: 2,
    sharpnessRadius: 0.4,
    contrastBoost: 1.2,
  } as UpscaleConfig,

  // Rápido
  fast: {
    method: 'bicubic',
    scale: 2,
  } as UpscaleConfig,

  // Premium
  premium: {
    method: 'frequency',
    scale: 2,
    sharpnessAmount: 1.3,
    contrastBoost: 1.15,
  } as UpscaleConfig,
};

/**
 * Como usar os exemplos:
 * 
 * 1. Para texto: await upscaleText()
 * 2. Para fotos: await upscalePhoto()
 * 3. Para UI: await upscaleUI()
 * 4. Para texturas: await upscaleTexture()
 * 5. Teste rápido: await quickTest()
 * 6. Ampliação 4x: await upscale4x()
 * 7. Comparar tudo: await compareAllMethods()
 * 8. Em lote: await batchUpscale(fileArray)
 * 9. Auto otimizar: await optimizeForPerformance(file)
 * 10. Customizado: await upscaleWithConfig(file, config)
 */
