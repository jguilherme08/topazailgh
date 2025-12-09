# 🆘 Guia de Troubleshooting - Topaz Upscaling

## Se você vê "Failed to upscale image: Unknown error"

### 🔍 Passo 1: Verificar o Console do Navegador

1. Pressione `F12` para abrir o Developer Tools
2. Vá para a aba `Console`
3. Procure por mensagens de erro específicas
4. Copie a mensagem exata

**Exemplos de erros e soluções:**

#### Erro: `Failed to upscale image: Real-ESRGAN: ...`
- **Causa:** Falha no processamento Replicate
- **Solução:** Tente com uma imagem menor (< 2MB)

#### Erro: `Failed to upscale image: Download timeout`
- **Causa:** Servidor levando muito tempo
- **Solução:** Aguarde mais tempo ou tente novamente

#### Erro: `Failed to upscale image: File exceeds 10MB limit`
- **Causa:** Arquivo muito grande
- **Solução:** Reduza o tamanho da imagem

---

## 🔍 Passo 2: Verificar os Logs do Servidor

1. Olhe o terminal onde rodou `npm run dev`
2. Procure por logs iniciados com `[Upscale]`

**Exemplo de log bem-sucedido:**
```
[Upscale] START: file=foto.jpg, size=1234567B, scale=2x, faceRestore=false
[Upscale] Converted to base64: 1645566B -> 2193417B
[Upscale] Calling Real-ESRGAN with scale=2...
[Upscale] Replicate.run started for Real-ESRGAN
[Upscale] Real-ESRGAN response type: string
[Upscale] Real-ESRGAN result: https://replicate.delivery/...
[Upscale] Real-ESRGAN success: https://...
[Upscale] Downloading final image from Replicate...
[Upscale] SUCCESS! Downloaded 5234566B in 34.2s
```

**Exemplo de log com erro:**
```
[Upscale] START: file=photo.jpg, size=1234567B, scale=2x
[Upscale] Calling Real-ESRGAN...
[Upscale] Real-ESRGAN failed: Request timeout
[Upscale] FAILED in real-esrgan-call after 123.4s: Real-ESRGAN failed: Request timeout
```

---

## ✅ Checklist de Resolução de Problemas

### Se o servidor não responde:

```bash
# 1. Verificar se a porta 3000 está em uso
netstat -ano | findstr :3000

# 2. Se estiver, parar o processo (obter PID da saída acima)
taskkill /PID <PID> /F

# 3. Tentar novamente
npm run dev
```

### Se aparecer erro de token:

```
❌ [Upscale] ERROR: REPLICATE_API_TOKEN not configured
```

**Solução:**
1. Abra `.env.local`
2. Verifique se tem: `REPLICATE_API_TOKEN=r8_CkKXq...`
3. Se não tiver, vá para: https://replicate.com/account/api-tokens
4. Copie seu token e adicione ao arquivo
5. Reinicie o servidor com `npm run dev`

### Se aparecer erro de compilação TypeScript:

```bash
# Limpar cache e rebuildar
rm -r .next
npm run build
npm run dev
```

### Se a imagem é rejeitada:

**Mensagem:** "File exceeds 10MB limit"
- Reduza o tamanho da imagem
- Use um compressor online

**Mensagem:** "File is empty"
- A imagem está corrompida
- Tente outra imagem

### Se o upscale fica muito lento:

1. **Tente com imagem menor:** Max 5MB para melhor performance
2. **Tente com scale menor:** 2x é mais rápido que 4x
3. **Verifique sua internet:** Upload para Replicate requer conexão
4. **Escolha um horário melhor:** Menos carga = mais rápido

---

## 🧪 Teste Simples de Diagnóstico

Abra seu navegador e acesse:

```
http://localhost:3000/api/upscale
```

**Resposta esperada:**
```
POST method required
```

Se não receber resposta, o servidor não está rodando.

---

## 📝 Validações Rápidas

### Verificar se o token existe:
```bash
cat .env.local | grep REPLICATE_API_TOKEN
```

Deve mostrar:
```
REPLICATE_API_TOKEN=r8_CkKXq...
```

### Verificar se o servidor está rodando:
```bash
curl http://localhost:3000
```

Deve retornar HTML (a página da aplicação).

### Verificar se a API responde:
```bash
curl -X POST http://localhost:3000/api/upscale
```

Deve retornar um erro (porque não enviamos arquivo), não recusa conexão.

---

## 🚨 Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| Connection refused | Servidor não rodando | `npm run dev` |
| Timeout | Muito lento | Imagem menor |
| Token not configured | `.env.local` vazio | Adicionar token |
| File exceeds limit | Arquivo > 10MB | Reduzir tamanho |
| HTTP 500 | Erro no servidor | Verificar logs |
| "Unknown error" | Erro genérico | Verificar console |

---

## 🎯 Se Nada Funcionar

Execute em ordem:

1. **Parar tudo:**
   ```bash
   # Ctrl+C no terminal
   ```

2. **Limpar caches:**
   ```bash
   rm -r node_modules .next
   npm cache clean --force
   ```

3. **Reinstalar tudo:**
   ```bash
   npm install
   npm run build
   npm run dev
   ```

4. **Validar ambiente:**
   ```bash
   node validate-project.js
   ```

5. **Verificar arquivo de log:**
   ```bash
   # Procure por erros no terminal
   ```

---

## 📞 Informações para Debug

Quando relatar um problema, inclua:

1. **Output completo do console do navegador (F12)**
2. **Output completo do terminal do servidor**
3. **Tamanho da imagem e formato**
4. **Scale escolhido (2x, 3x, 4x)**
5. **Resultado de: `node validate-project.js`**

---

## 🎓 Entender os Logs

### Status Code HTTP:

- `200` = ✅ Sucesso
- `400` = ❌ Arquivo inválido
- `413` = ❌ Arquivo muito grande
- `500` = ❌ Erro do servidor

### Contexto de Erro:

- `token-validation` = Problema com token API
- `form-parsing` = Problema ao ler arquivo
- `file-validation` = Problema com validação
- `image-conversion` = Problema ao converter
- `real-esrgan-call` = Problema com Replicate
- `image-download` = Problema ao baixar resultado

---

## 💡 Dicas Finais

1. **Sempre verifique os logs** - eles têm todas as respostas
2. **Comece com imagens pequenas** - mais fácil debugar
3. **Use o navegador DevTools** (F12) - mostra tudo
4. **Reinicie o servidor** depois de mudanças em `.env.local`
5. **Teste uma imagem conhecida** - descarta corrupção

---

**Sucesso! 🚀**

Se ainda tiver problemas, verifique:
- `ANALISE_ERRO_FINAL.md` - Análise técnica
- `CHANGELOG_CORRECTIONS.md` - O que foi corrigido
- `README.md` - Overview geral
