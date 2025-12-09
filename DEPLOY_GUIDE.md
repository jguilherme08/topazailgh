# 🚀 Guia Deploy GitHub + Vercel

## Pré-Requisitos

- Conta GitHub (gratuita)
- Conta Vercel (gratuita, integrada com GitHub)
- Git instalado localmente
- Node.js 18+ instalado

## Passo 1: Criar Repositório GitHub

### 1.1 Criar novo repositório

1. Acesse [github.com/new](https://github.com/new)
2. Nome: `topaz-upscaling`
3. Descrição: `Professional Image Upscaling Techniques - Manual Upscaling without AI`
4. Escolha **Public** (para deploy gratuito no Vercel)
5. Clique "Create repository"

### 1.2 Configurar Git Localmente

```bash
# Acesse a pasta do projeto
cd c:\Users\User\OneDrive\Documentos\topaz

# Inicialize git (se não está já inicializado)
git init

# Configure suas credenciais
git config user.name "Seu Nome"
git config user.email "seu.email@gmail.com"

# Adicione todos os arquivos
git add .

# Faça o primeiro commit
git commit -m "Initial commit: Topaz Upscaling with 6 techniques"

# Renomeie branch para main (se estiver em master)
git branch -M main

# Adicione o repositório remoto
git remote add origin https://github.com/SEU_USUARIO/topaz-upscaling.git

# Faça push
git push -u origin main
```

## Passo 2: Deploy no Vercel

### 2.1 Método 1: Automático (Recomendado)

1. **Acesse Vercel**
   - Vá para [vercel.com](https://vercel.com)
   - Clique "Sign Up"
   - Escolha "Continue with GitHub"

2. **Autorize Vercel**
   - Vercel pedirá permissão para acessar GitHub
   - Clique "Authorize Vercel"

3. **Importar Projeto**
   - Clique "New Project"
   - Selecione "Import Git Repository"
   - Busque por `topaz-upscaling`
   - Clique "Import"

4. **Configurações**
   - Framework: **Next.js** (detectado automaticamente)
   - Root Directory: `.` (raiz)
   - Build Command: `npm install && npm run build` (padrão)
   - Output Directory: `.next` (padrão)

5. **Environment Variables** (Opcional)
   - Deixe vazio por enquanto
   - Clique "Deploy"

6. **Aguardar Deploy**
   - Vercel compila automaticamente
   - Em 3-5 minutos estará online
   - URL gerada: `seu-projeto.vercel.app`

### 2.2 Método 2: CLI Vercel

```bash
# Instale Vercel CLI
npm install -g vercel

# Faça login
vercel login

# Na pasta do projeto
cd c:\Users\User\OneDrive\Documentos\topaz

# Deploy
vercel

# Siga as instruções no terminal
# Resultado: https://topaz-upscaling.vercel.app
```

## Passo 3: Continuous Deployment (Automático)

Após o primeiro deploy, **todo push** para `main` causa deploy automático:

```bash
# Faça mudanças no código
# ...

# Commit e push
git add .
git commit -m "Melhoria no upscaling"
git push origin main

# Vercel detecta automaticamente e faz deploy!
# Status em: vercel.com/dashboard
```

## Passo 4: Configurações Avançadas

### 4.1 Domínio Personalizado

1. No dashboard Vercel do seu projeto
2. Settings → Domains
3. Adicione seu domínio
4. Configure DNS conforme instruções

### 4.2 Variáveis de Ambiente

Se necessário adicionar variáveis:

1. Settings → Environment Variables
2. Adicione chave/valor
3. Redeploy

Exemplo:
```
NEXT_PUBLIC_API_URL = https://api.exemplo.com
```

### 4.3 Builds Automáticos

Já está configurado em `.github/workflows/deploy.yml`:

```yaml
- Testa o build em cada push
- Executa linter
- Só faz deploy se tudo passar
```

## Passo 5: Monitorar Deploy

### 5.1 Dashboard Vercel

1. Vá para [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Abas disponíveis:
   - **Deployments**: Histórico de deploys
   - **Settings**: Configurações
   - **Analytics**: Performance
   - **Logs**: Erros e logs

### 5.2 Logs em Tempo Real

```bash
# Ver logs do último deploy
vercel logs

# Segue logs em tempo real
vercel logs --follow
```

## Troubleshooting

### Problema: Deploy falha

**Verificar logs:**
1. Dashboard Vercel → Deployments
2. Clique no deploy com falha
3. Veja "Logs"

**Causas comuns:**
- Erro de build (TypeScript)
- Dependências faltando
- Sintaxe inválida

**Solução:**
```bash
# Build local para testar
npm run build

# Se falhar, veja o erro
npm run lint
```

### Problema: Imagem não carrega

**Causas:**
- Arquivo muito grande (> 5MB)
- Formato não suportado
- Canvas module issue

**Solução:**
```bash
# Verifique canvas está instalado
npm list canvas

# Se não, instale
npm install canvas
```

### Problema: Processamento lento

**Causas:**
- Imagem muito grande
- Técnica pesada (Frequency)

**Solução:**
- Usar técnica mais rápida (Bicubic)
- Reduzir escala
- Otimizar imagem

## Segurança

### 2.1 Proteger Secrets

**Nunca commite:**
- Senhas
- API keys
- Tokens
- Credenciais

**Use variáveis de ambiente:**
```bash
# .env.local (não versionado)
PRIVATE_KEY=seu-valor

# .gitignore já tem .env*
```

### 2.2 Branch Protection

1. GitHub → Settings → Branches
2. "Add rule"
3. Pattern: `main`
4. Requer PR antes de merge

## Monitoramento

### 3.1 Analytics Vercel

- Dashboard → Analytics
- Veja visitantes, performance
- Identifique problemas

### 3.2 Logs

```bash
# Logs recentes
vercel logs --limit 50

# Apenas erros
vercel logs --error
```

## Manutenção

### 4.1 Atualizar Dependências

```bash
# Verificar atualizações
npm outdated

# Atualizar seguras
npm update

# Atualizar tudo (cuidado!)
npm install -g npm-check-updates
ncu -u
npm install
```

### 4.2 Performance

- Monitorar Core Web Vitals
- Otimizar imagens
- Usar caching

## Rollback

Se algo deu errado:

```bash
# Ver histórico de deploys
vercel list

# Fazer rollback para versão anterior
vercel rollback
```

## Próximas Etapas

1. ✅ Criar repo GitHub
2. ✅ Deploy em Vercel
3. ✅ Domínio personalizado (opcional)
4. ✅ Monitorar performance
5. ⏳ Adicionar mais técnicas
6. ⏳ Integração com APIs externas

## Links Rápidos

- 📊 [Vercel Dashboard](https://vercel.com/dashboard)
- 🐙 [GitHub Repositório](https://github.com/seu-usuario/topaz-upscaling)
- 📖 [Docs Vercel](https://vercel.com/docs)
- 🚀 [Docs Next.js](https://nextjs.org/docs)

## Exemplo Completo

```bash
# 1. Clone (se em outro PC)
git clone https://github.com/seu-usuario/topaz-upscaling.git
cd topaz-upscaling

# 2. Instale
npm install

# 3. Teste
npm run dev

# 4. Build
npm run build

# 5. Commit
git add .
git commit -m "Novo update"
git push origin main

# 6. Vercel faz deploy automático!
# Acesse: https://seu-projeto.vercel.app
```

---

## ✅ Checklist Final

- [ ] GitHub repo criado
- [ ] Código pusheado
- [ ] Vercel conectado
- [ ] Deploy bem-sucedido
- [ ] App acessível em URL pública
- [ ] Técnicas funcionando
- [ ] Documentação atualizada

**Parabéns! Seu app está online! 🎉**
