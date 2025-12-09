#!/usr/bin/env node
/**
 * Test script para validar a API de upscale
 */

const fs = require('fs');
const path = require('path');

// Verificar variáveis de ambiente
console.log('=== VERIFICAÇÃO DE AMBIENTE ===\n');

const token = process.env.REPLICATE_API_TOKEN;
if (!token) {
  console.error('❌ REPLICATE_API_TOKEN não configurado!');
  console.log('\nPasso 1: Configure o token no .env.local');
  console.log('Passo 2: Reinicie o servidor Next.js\n');
  process.exit(1);
}

console.log('✅ REPLICATE_API_TOKEN encontrado (primeiros 10 chars):', token.substring(0, 10) + '...');

// Verificar se o arquivo de rota existe
const routePath = path.join(__dirname, 'app', 'api', 'upscale', 'route.ts');
if (fs.existsSync(routePath)) {
  console.log('✅ Arquivo route.ts encontrado');
} else {
  console.error('❌ Arquivo route.ts NÃO encontrado:', routePath);
  process.exit(1);
}

// Verificar se next.config.js está configurado
const nextConfigPath = path.join(__dirname, 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  console.log('✅ next.config.js encontrado');
} else {
  console.error('❌ next.config.js NÃO encontrado');
  process.exit(1);
}

// Verificar se package.json tem as dependências corretas
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
console.log('\n✅ Versões de dependências:');
console.log('  - next:', packageJson.dependencies.next);
console.log('  - replicate:', packageJson.dependencies.replicate);

console.log('\n=== CHECKLIST DE CONFIGURAÇÃO ===\n');

const checklist = [
  { name: 'REPLICATE_API_TOKEN configurado', ok: !!token },
  { name: 'route.ts existe', ok: fs.existsSync(routePath) },
  { name: 'next.config.js existe', ok: fs.existsSync(nextConfigPath) },
  { name: 'package.json válido', ok: !!packageJson.dependencies.replicate },
];

let allOk = true;
checklist.forEach(item => {
  console.log((item.ok ? '✅' : '❌'), item.name);
  if (!item.ok) allOk = false;
});

if (allOk) {
  console.log('\n✅ Todas as verificações passaram!');
  console.log('\nProximas etapas:');
  console.log('1. Execute: npm run dev');
  console.log('2. Abra: http://localhost:3000');
  console.log('3. Faça upload de uma imagem e teste o upscale');
  console.log('\nSe ainda houver erros, verificaremos os logs do servidor.\n');
} else {
  console.log('\n❌ Algumas verificações falharam. Corrija os problemas acima.\n');
  process.exit(1);
}
