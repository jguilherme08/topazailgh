# 🚀 Guia Rápido - Topaz Upscaling

## Início Rápido

### 1. Clonar e Instalar
```bash
git clone <seu-repo-url>
cd topaz
npm install
```

### 2. Desenvolvimento Local
```bash
npm run dev
```
Abra `http://localhost:3000` no navegador.

### 3. Build para Produção
```bash
npm run build
npm start
```

## 📱 Como Usar a Aplicação

1. **Upload da Imagem**
   - Clique em "Choose Image"
   - Selecione um arquivo PNG, JPG ou WebP

2. **Escolher Técnica**
   - Bicubic: Base, rápido
   - Bicubic+Unsharp: Melhor sharpening
   - Bicubic+HighPass: Bordas nítidas
   - Edge-Aware: Detecção de bordas
   - Frequency: Separação alta/baixa frequência
   - Fractal: Texturas naturais

3. **Ajustar Parâmetros**
   - Scale: 2x, 3x ou 4x
   - Sharpness: 50-200%
   - Radius: 0.3-2.0
   - Edge Threshold: 10-200
   - Contrast: 80-200%

4. **Processar**
   - Clique "Upscale Image"
   - Aguarde o processamento
   - Download do resultado

## 🔧 Estrutura de Pastas

```
app/
├── api/upscale/     ← Processamento no servidor
├── components/      ← Componentes React
└── page.tsx         ← Página principal

lib/upscaling/
├── bicubic.ts       ← Interpolação cúbica
├── sharpening.ts    ← Unsharp + HighPass
├── edgeAware.ts     ← Detecção de bordas
├── frequencySeparation.ts
├── fractal.ts       ← Blend e contraste
└── processor.ts     ← Orquestrador
```

## 🎯 Quando Usar Cada Técnica

| Situação | Técnica | Razão |
|----------|---------|-------|
| Texto/UI em baixa res | Bicubic+Unsharp | Máximo detalhe |
| Fotos naturais | Frequency | Melhor balanceamento |
| Screenshots | Edge-Aware | Bordas nítidas |
| Texturas | Fractal | Padrão natural |
| Teste rápido | Bicubic | Mais rápido |

## 📊 Parâmetros Recomendados

### Para Texto Pequeno
```
Scale: 2x
Method: Bicubic+Unsharp
Sharpness: 150%
Radius: 0.7
Threshold: 2
```

### Para Fotos
```
Scale: 2x
Method: Frequency Separation
Sharpness: 120%
Radius: 0.5
Contrast: 110%
```

### Para Objetos com Bordas Nítidas
```
Scale: 2x
Method: Edge-Aware
Edge Threshold: 50
Sharpness: 130%
```

## 🌐 Deploy Vercel

### Opção 1: Automático via Git
1. Push para `main` branch
2. Vercel detecta e faz deploy automático
3. URL: `seu-projeto.vercel.app`

### Opção 2: Manual
```bash
npm install -g vercel
vercel login
vercel deploy
```

### Variáveis de Ambiente (se necessário)
```
NEXT_PUBLIC_API_ROUTE=/api/upscale
```

## 📈 Performance

- Upload: até 5MB recomendado
- Processamento: 500ms - 5s (depende da técnica)
- Compressão: PNG sem perda
- Caching: Ativado automaticamente

## 🐛 Troubleshooting

### Erro: "Failed to process image"
- Verifique o tamanho da imagem
- Tente formato diferente (PNG → JPG)
- Limpe cache do navegador

### Resultado muito borrado
- Aumentar Sharpness
- Usar Bicubic+HighPass
- Aumentar Contrast

### Resultado com artefatos
- Reduzir Edge Threshold
- Usar Frequency Separation
- Diminuir Sharpness

## 📚 Documentação Completa

Ver `README.md` para detalhes técnicos completos.

## 🔗 Links Úteis

- [Next.js Docs](https://nextjs.org/docs)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Vercel Deploy](https://vercel.com/docs)

---

**Dúvidas?** Abra uma issue no GitHub!
