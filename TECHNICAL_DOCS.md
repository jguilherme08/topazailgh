# Projeto Topaz Upscaling - Documentação Técnica Completa

## 📋 Visão Geral

**Topaz Upscaling** é uma aplicação web de código aberto para upscaling de imagens usando 6 técnicas diferentes de processamento digital, sem dependência de modelos de IA. O aplicativo foi construído com Next.js 15, TypeScript e Tailwind CSS, pronto para deploy no Vercel.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         Interface Web (React)            │
│  - Upload de imagem                      │
│  - Controle de parâmetros                │
│  - Preview em tempo real                 │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│      Next.js API Route (/api/upscale)   │
│  - Recebe FormData com imagem            │
│  - Valida parâmetros                     │
│  - Chama processador                     │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│    Motor de Processamento (lib/)         │
│  - Bicubic Interpolation                 │
│  - Sharpening (Unsharp + HighPass)       │
│  - Edge-Aware Detection (Sobel)          │
│  - Frequency Separation                  │
│  - Fractal Upscaling                     │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│      Canvas API (Node.js)                │
│  - Processamento de pixel data           │
│  - Conversão de imagem                   │
│  - Renderização final                    │
└─────────────────────────────────────────┘
```

## 🎨 Técnicas de Upscaling

### 1. Interpolação Bicúbica (`bicubic.ts`)

**Princípio**: Usa 16 pixels vizinhos para interpolar novo pixel.

**Fórmula do Kernel**:
```
K(x) = {
  1 - 2x² + x³              se |x| ≤ 1
  -4 + 8x - 5x² + x³        se 1 < |x| < 2
  0                          caso contrário
}
```

**Processo**:
1. Para cada pixel na imagem ampliada
2. Encontra posição correspondente na original
3. Coleta 16 pixels em matriz 4x4
4. Aplica kernel cúbico bidimensional
5. Normaliza e redimensiona

**Vantagens**: Rápido, suave, baseline confiável
**Limitações**: Pode borrar detalhes finos

**Complexidade**: O(W×H×16) onde W,H = dimensões

### 2. Unsharp Mask (`sharpening.ts`)

**Princípio**: Realça diferenças entre original e borrada.

**Algoritmo**:
```
1. Cria versão borrada: G(x,y) = Gaussian(I, σ)
2. Calcula máscara: M(x,y) = I(x,y) - G(x,y)
3. Aplica: Output = I + Amount × M (com threshold)
```

**Gaussiana Aplicada**:
```
Kernel = e^(-i²/(2σ²)) / √(2πσ²)
Radius: 0.5-1.0px recomendado
```

**Parâmetros**:
- Amount: 100-150% (1.0-1.5)
- Radius: 0.5-1.0 pixels
- Threshold: 2-5 (evita sharpening de ruído)

**Vantagens**: Controle fino, sem artefatos
**Limitações**: Pode aumentar ruído se mal usado

### 3. High Pass Filter (`sharpening.ts`)

**Princípio**: Isola componentes de alta frequência.

**Fórmula**:
```
HighPass = Original - Gaussian
Normalized = (HighPass - 128) × Strength + 128
```

**Blend Mode Overlay**:
```
Overlay(a,b) = {
  2 × a × b              se a < 0.5
  1 - 2(1-a)(1-b)       se a ≥ 0.5
}
```

**Vantagens**: Detalhe com preservação de cores
**Limitações**: Requer blend correto

### 4. Edge-Aware Upscaling (`edgeAware.ts`)

**Detecção com Sobel**:
```
Gx = [-1  0  1]     Gy = [-1 -2 -1]
     [-2  0  2]          [ 0  0  0]
     [-1  0  1]          [ 1  2  1]

Edge = √(Gx² + Gy²)
```

**Estratégia Dual**:
- **Se Edge > Threshold**:
  - Usa Bicubic (16 pixels)
  - Mais detalhe
  
- **Senão (smooth area)**:
  - Usa Bilinear (4 pixels)
  - Mais suavidade

**Vantagens**: Bordas nítidas, cores suaves
**Limitações**: Mais lento (Sobel pass)

### 5. Frequency Separation (`frequencySeparation.ts`)

**Decomposição**:
```
Original = LowFreq + HighFreq
LowFreq = Gaussian(Original, 3px)
HighFreq = Original - LowFreq
```

**Upscaling Independente**:
- **LowFreq**: Bilinear suave (preserva cores)
- **HighFreq**: Bilinear com boost (realça detalhes)

**Recombinação**:
```
Result = LowFreqUpscaled + (HighFreqUpscaled - 128) × Sharpness
```

**Vantagens**: Qualidade premium, balanceado
**Limitações**: Mais processamento

### 6. Fractal Upscaling (`fractal.ts`)

**Passos**:
1. Upscale base com Bilinear
2. Blur leve (0.3-0.5px)
3. Overlay blend com original upscalada
4. Ajusta curvas para recuperar contraste

**Overlay Blend**:
```
Result = 2×Base×Overlay          se Base < 0.5
         1 - 2(1-Base)(1-Overlay) se Base ≥ 0.5
```

**Curva de Contraste**:
```
Adjusted = Mid + (Value - Mid) × ContrastBoost
```

**Vantagens**: Texturas naturais
**Limitações**: Pode parecer suavizado

## 📡 API Endpoint

### POST `/api/upscale`

**Requisição**:
```typescript
FormData {
  file: File                    // Imagem (PNG/JPG/WebP)
  method: UpscalingMethod       // Técnica
  scale: number                 // 1-4x
  sharpnessAmount: number       // 0.5-2.0
  sharpnessRadius: number       // 0.3-2.0
  edgeThreshold: number         // 10-200
  contrastBoost: number         // 0.8-2.0
}
```

**Resposta**:
```
HTTP 200
Content-Type: image/png
Body: PNG binary
```

**Erros**:
- `400`: Arquivo ausente/inválido
- `500`: Erro de processamento

## 🎛️ Componentes React

### `UpscalingApp.tsx` (Principal)

**Estados**:
- `originalImage`: URL data da imagem original
- `upscaledImage`: URL blob do resultado
- `loading`: Flag de processamento
- `method`: Técnica selecionada
- `scale`, `sharpnessAmount`, etc.: Parâmetros

**Fluxo**:
1. Upload → FileReader → Data URL
2. Clique Upscale → FormData
3. Fetch POST → /api/upscale
4. Response → Blob URL
5. Display & Download

## 🔄 Fluxo de Processamento

```
1. Cliente: Upload imagem
   ↓
2. Cliente: Configura parâmetros UI
   ↓
3. Cliente: FormData com tudo
   ↓
4. Servidor: Recebe e valida
   ↓
5. Servidor: Carrega imagem (Canvas)
   ↓
6. Servidor: Extrai ImageData (RGBA)
   ↓
7. Servidor: Executa processador
   ↓
8. Processador: Escolhe técnica
   ↓
9. Processador: Aplica algoritmo
   ↓
10. Servidor: Converte para PNG
    ↓
11. Servidor: Retorna buffer
    ↓
12. Cliente: Display + Download
```

## 📊 Comparação Técnica

| Aspecto | Bicubic | Unsharp | HighPass | EdgeAware | Frequency | Fractal |
|---------|---------|---------|----------|-----------|-----------|---------|
| Tempo (ms) | 200 | 300 | 250 | 500 | 800 | 600 |
| Suavidade | 6/10 | 6/10 | 7/10 | 8/10 | 9/10 | 9/10 |
| Nitidez | 5/10 | 9/10 | 9/10 | 10/10 | 9/10 | 7/10 |
| Artefatos | Baixo | Baixo | Baixo | Muito baixo | Muito baixo | Baixo |
| Uso | Base | Geral | Detalhes | Bordas | Premium | Texturas |

## 🚀 Deploy Vercel

### Passos

1. **GitHub Setup**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Vercel Connect**
   - Acesse vercel.com
   - "New Project"
   - Conectar repositório GitHub
   - Vercel detecta Next.js automaticamente

3. **Build Command**
   ```
   npm install && npm run build
   ```

4. **Output Directory**
   ```
   .next
   ```

5. **Environment**
   - Nenhuma variável obrigatória
   - Opcional: NEXT_PUBLIC_API_ROUTE

6. **Deploy**
   - Clique "Deploy"
   - Aguarde ~3-5 min
   - URL automática: `seu-projeto.vercel.app`

### Continuous Deployment

GitHub Actions automaticamente:
1. Testa em cada push
2. Executa linter
3. Build
4. Deploy se main branch

Veja `.github/workflows/deploy.yml`

## 🛠️ Desenvolvimento Local

### Requisitos
- Node.js 18+
- npm/yarn/pnpm

### Setup
```bash
git clone <repo>
cd topaz
npm install
npm run dev
```

### Servidor de Desenvolvimento
```
http://localhost:3000
```

### Build
```bash
npm run build
npm start
```

## 📦 Dependências Principais

```json
{
  "next": "^15.0.0",          // Framework
  "react": "^19.0.0",         // UI
  "react-dom": "^19.0.0",     // DOM
  "canvas": "^2.11.0",        // Processamento Node
  "tailwindcss": "^3.4.0",    // Estilos
  "typescript": "^5.0.0"      // Type safety
}
```

## ⚡ Otimizações Implementadas

1. **Lazy Loading**: Componentes carregam sob demanda
2. **Image Optimization**: Next/image automático
3. **CSS Minimization**: Tailwind purga
4. **Server-Side Processing**: Offload CPU
5. **Caching Headers**: Vercel automático
6. **Compression**: Gzip automático

## 📈 Escalabilidade

- **Função serverless**: Vercel auto-scales
- **Timeout**: 30-60s recomendado
- **Memória**: 1024MB padrão
- **CPU**: Compartilhado, suficiente
- **Limite arquivo**: ~5MB recomendado

## 🔐 Segurança

- Validação de entrada
- Limite de tamanho
- Sem upload permanente
- Processamento isolado
- Sem dados sensíveis

## 📝 Futuros Melhoramentos

- [ ] Batch processing
- [ ] Mais técnicas (AI upscale wrapper)
- [ ] Preview comparativo
- [ ] Histórico de processamentos
- [ ] Exportação múltiplos formatos
- [ ] API pública
- [ ] Mobile app native

---

**Desenvolvido com ❤️ para processamento de imagem**
