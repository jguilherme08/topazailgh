# 🚀 Integração Replicate - Guia de Configuração

## ✅ Status da Integração

A aplicação Topaz foi **totalmente integrada com Replicate** para upscaling com IA real.

### O que foi feito:

1. ✅ Instalada dependência `replicate` (v10.x)
2. ✅ Reescrita rota `/api/upscale` para usar Real-ESRGAN + GFPGAN
3. ✅ Adicionadas variáveis de ambiente
4. ✅ Build compilada com sucesso (5.6s)

---

## 🔑 Configuração Obrigatória

### 1. Obter Token Replicate

**Acesso:** https://replicate.com/account/api-tokens

1. Crie uma conta (free tier disponível)
2. Vá para Settings → API Tokens
3. Copie seu token

### 2. Configurar Variáveis de Ambiente

**Localmente (desenvolvimento):**

```bash
# Criar arquivo .env.local na raiz do projeto
echo "REPLICATE_API_TOKEN=seu_token_aqui" > .env.local
```

**Na Vercel (produção):**

1. Vá para seu projeto no Vercel
2. Settings → Environment Variables
3. Adicione:
   - **Name:** `REPLICATE_API_TOKEN`
   - **Value:** Seu token do Replicate
   - **Environments:** Production, Preview, Development

---

## 🎯 Como Funciona Agora

### Fluxo de Processamento:

```
Usuário sobe imagem
    ↓
Next.js (Vercel) recebe
    ↓
Envia para Real-ESRGAN (Replicate)
    ↓
IA upscala com qualidade 4K (2x-4x)
    ↓
[Opcional] Restauração facial com GFPGAN
    ↓
Retorna imagem final ao usuário
```

### Parâmetros da Rota:

```javascript
POST /api/upscale

Body (FormData):
- file: File (obrigatório) - imagem PNG/JPG
- scale: number (opcional, padrão: 2) - 2, 3, ou 4x
- faceRestore: boolean (opcional, padrão: false) - aplicar GFPGAN
```

### Exemplo de Uso (Frontend):

```javascript
const formData = new FormData();
formData.append('file', imagemFile);
formData.append('scale', 2);
formData.append('faceRestore', true);

const response = await fetch('/api/upscale', {
  method: 'POST',
  body: formData,
});

const imageBlob = await response.blob();
```

---

## 💰 Custo e Limites

### Preços Replicate:

| Modelo | Custo | Tempo |
|--------|-------|-------|
| Real-ESRGAN (2x) | $0.004-0.01 | 10-30s |
| Real-ESRGAN (4x) | $0.008-0.02 | 20-40s |
| GFPGAN | $0.001-0.003 | 5-10s |

**Free tier:** $5/mês em créditos grátis (suficiente para testes)

### Limites Implementados:

- ✅ Tamanho máximo: 5MB
- ✅ Timeout: 60 segundos
- ✅ Escala máxima: 4x
- ✅ Face restore é opcional

---

## 🧪 Testando Localmente

### 1. Instalar dependências:
```bash
npm install
```

### 2. Criar `.env.local`:
```
REPLICATE_API_TOKEN=seu_token_aqui
```

### 3. Rodar em desenvolvimento:
```bash
npm run dev
```

### 4. Testar a rota:
```bash
curl -X POST http://localhost:3000/api/upscale \
  -F "file=@imagem.jpg" \
  -F "scale=2" \
  -F "faceRestore=true" \
  -o resultado.png
```

---

## 🔄 Deploy na Vercel

### 1. Fazer push do código:
```bash
git add .
git commit -m "Feat: Integração Replicate com Real-ESRGAN"
git push origin main
```

### 2. Configurar variáveis na Vercel:
- Vá ao painel do projeto
- Settings → Environment Variables
- Adicione `REPLICATE_API_TOKEN`

### 3. Redeploy:
- Vercel detecta push automaticamente
- Ou clique em "Redeploy" no painel

---

## ⚠️ Troubleshooting

### Erro: "API token not configured"
**Solução:** Confirme que `REPLICATE_API_TOKEN` está definido nas variáveis de ambiente

### Erro: "Real-ESRGAN timeout"
**Solução:** Pode ser imagem grande ou servidor sobrecarregado. Tente:
- Reduzir escala (use 2x em vez de 4x)
- Comprimir imagem antes (< 2MB)
- Tentar novamente em alguns minutos

### Erro: "Failed to download processed image"
**Solução:** Problema temporário no Replicate. Tente novamente.

---

## 📊 Monitoramento

### Logs da Aplicação:

```bash
# Vercel logs (produção)
vercel logs

# Logs locais
npm run dev
# Veja os logs no console
```

### Métricas Replicate:

Vá para https://replicate.com/account/api-tokens para ver:
- Uso de créditos
- Histórico de processamentos
- Performance dos modelos

---

## ✨ Próximas Melhorias (Opcional)

1. **Cache de resultados** - armazenar imagens processadas
2. **Fila de processamento** - para muitos usuários simultâneos
3. **Métricas e analytics** - rastrear uso e custo
4. **Interface melhorada** - mostrar progresso do upscaling
5. **Múltiplos modelos** - oferecer Real-ESRGAN vs outros

---

## 📚 Recursos

- **Replicate Docs:** https://replicate.com/docs
- **Real-ESRGAN:** https://replicate.com/nightmareai/real-esrgan
- **GFPGAN:** https://replicate.com/tencentarc/gfpgan
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## ✅ Checklist para Produção

- [ ] Token Replicate obtido
- [ ] Variável de ambiente configurada na Vercel
- [ ] Build testada localmente (`npm run build`)
- [ ] Código feito push para main
- [ ] Deploy feito na Vercel
- [ ] Testada a rota em produção
- [ ] Monitoramento de créditos configurado

---

**Integração concluída com sucesso! 🎉**

Seu Topaz agora usa IA real com Replicate. Qualidade profissional, sem precisar montar seu próprio servidor.
