# Topaz Upscaling - Professional Image Enhancement

Uma aplicação web moderna para upscaling de imagens usando técnicas manuais de processamento avançadas, sem dependência de IA. Deploy direto no Vercel!

## 🎯 Características Principais

### Técnicas de Upscaling Implementadas

1. **Interpolação Bicúbica** (Base)
   - Usa 16 pixels vizinhos ao invés de 4 (vs bilinear)
   - Transições mais suaves
   - Melhor que bilinear, mas menos blur que bilinear puro

2. **Unsharp Mask** (Sharpening Seletivo)
   - Amount: 100-150% (ajustável)
   - Radius: 0.5-1.0px
   - Threshold: 2-5
   - Melhora clareza após upscale

3. **High Pass Filter**
   - Detecta e realça detalhes
   - Blend mode overlay
   - Melhor definição de bordas

4. **Edge-Aware Upscaling**
   - Detecta bordas com Sobel
   - Upscaling diferenciado para bordas
   - Preserva características nítidas

5. **Frequency Separation**
   - Separa alta frequência (detalhes)
   - Separa baixa frequência (cores/tons)
   - Upscale independente com parâmetros diferentes

6. **Fractal Upscaling**
   - Upscale 200%
   - Blur gaussiano leve (0.3-0.5px)
   - Overlay com blend mode
   - Ajuste de curvas para recuperar contraste

## 🚀 Como Usar

### Instalação Local

```bash
# Clone o repositório
git clone <seu-repo>
cd topaz

# Instale as dependências
npm install

# Execute em desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Deploy no Vercel

```bash
# 1. Faça push para seu GitHub
git push

# 2. Acesse vercel.com e conecte seu repositório
# 3. Configure as variáveis de ambiente se necessário
# 4. Deploy automático!
```

## 📋 Controles da Interface

- **Select Image**: Carrega uma imagem para upscaling
- **Upscaling Method**: Escolhe entre 6 técnicas diferentes
- **Scale**: 1x até 4x ampliação
- **Sharpness**: 50% até 200% (ajusta força do sharpening)
- **Sharpness Radius**: 0.3 até 2.0 (raio do filtro)
- **Edge Threshold**: 10-200 (sensibilidade de detecção de bordas)
- **Contrast**: 80% até 200% (recuperação de contraste)

## 🛠️ Stack Técnico

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Styling**: Tailwind CSS
- **Processamento**: Canvas API + algoritmos customizados
- **Servidor**: Node.js com Canvas
- **Deploy**: Vercel

## 📁 Estrutura do Projeto

```
topaz/
├── app/
│   ├── api/
│   │   └── upscale/
│   │       └── route.ts          # API de processamento
│   ├── components/
│   │   └── UpscalingApp.tsx       # UI principal
│   ├── globals.css                # Estilos globais
│   ├── layout.tsx                 # Layout raiz
│   └── page.tsx                   # Página inicial
├── lib/
│   └── upscaling/
│       ├── bicubic.ts             # Interpolação bicúbica
│       ├── sharpening.ts          # Unsharp Mask + High Pass
│       ├── edgeAware.ts           # Edge-Aware Upscaling
│       ├── frequencySeparation.ts # Separação de frequências
│       ├── fractal.ts             # Fractal Upscaling
│       └── processor.ts           # Processador unificado
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── vercel.json
```

## 🎨 Como Cada Técnica Funciona

### Bicubic Interpolation
```
1. Para cada pixel na imagem ampliada
2. Busca 16 pixels vizinhos na imagem original
3. Aplica kernel de interpolação cúbica
4. Resultado: transições suaves
```

### Unsharp Mask
```
1. Cria versão borrada da imagem
2. Calcula diferença = original - borrada
3. Amplifica a diferença por "amount"
4. Resultado: detalhes realçados
```

### High Pass Filter
```
1. Cria versão borrada (low pass)
2. Calcula high pass = original - borrada
3. Centraliza em 128 para overlay blend
4. Resultado: bordas e detalhes destacados
```

### Edge-Aware
```
1. Detecta bordas com filtro Sobel
2. Para bordas: interpolação cúbica (mais detalhes)
3. Para áreas lisas: bilinear (mais suavidade)
4. Resultado: bordas nítidas + suavidade em cores
```

### Frequency Separation
```
1. Cria low frequency (blur 3px)
2. High frequency = original - low frequency
3. Upscale low frequency com smoothing
4. Upscale high frequency com sharpening
5. Recombina = detalhe + cor/tom otimizados
```

### Fractal Upscaling
```
1. Upscale base com bilinear
2. Cria versão borrada do resultado
3. Overlay blend com original upscalada
4. Ajusta curvas para recuperar contraste
5. Resultado: detalhes mais naturais
```

## 📊 Comparação de Técnicas

| Técnica | Suavidade | Nitidez | Tempo | Uso Ideal |
|---------|-----------|---------|-------|-----------|
| Bicubic | Média | Baixa | Rápido | Baseline |
| Bicubic+Unsharp | Média | Alta | Rápido | Geral |
| Bicubic+HighPass | Alta | Alta | Rápido | Detalhes |
| Edge-Aware | Alta | Muito Alta | Médio | Bordas |
| Frequency | Muito Alta | Muito Alta | Lento | Premium |
| Fractal | Muito Alta | Alta | Lento | Texturas |

## 🔧 Personalizações

Você pode ajustar os algoritmos em `lib/upscaling/`:

```typescript
// Exemplo: Aumentar força do Unsharp Mask
unsharpMask(imageData, 1.5, 0.7, 2)
              // amount ↑ (1.0-2.0)
              // radius (0.3-2.0)
              // threshold (0-10)
```

## 🌐 Deployment Vercel

1. **Conecte GitHub**: https://vercel.com/new
2. **Selecione o repositório**
3. **Configure framework**: Next.js (detectado automaticamente)
4. **Deploy**: Um clique!
5. **Domínio automático**: `seu-projeto.vercel.app`

## 📝 Notas Importantes

- Compatibilidade: Navegadores modernos com suporte a Canvas
- Limite de tamanho: Recomendado até 5MB por imagem
- Processamento: Ocorre no servidor (Vercel serverless)
- Sem CORS: Funciona com qualquer imagem

## 🎓 Aprendizado

Este projeto demonstra:
- Processamento de imagem em tempo real
- Algoritmos clássicos de computação gráfica
- Integração Next.js API + Client
- Deploy serverless
- TypeScript em produção

## 📜 Licença

MIT - Use livremente em seus projetos!

## 🚀 Próximas Melhorias

- [ ] Batch processing de múltiplas imagens
- [ ] Modo comparativo antes/depois
- [ ] Mais técnicas de upscaling
- [ ] Download em diferentes formatos
- [ ] Histórico de processamentos
- [ ] API pública para integração

---

**Desenvolvido com ❤️ para upscaling profissional sem IA**
