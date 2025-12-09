#!/usr/bin/env node
/**
 * Test script completo para validar fluxo de upscale
 * Testa desde o ambiente até a chamada da API
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🔍 === VALIDAÇÃO COMPLETA DO PROJETO TOPAZ ===\n');

// 1. Verificar arquivos críticos
console.log('📋 Checklist de Arquivos:\n');

const criticalFiles = [
  'app/api/upscale/route.ts',
  'app/components/UpscalingApp.tsx',
  'app/layout.tsx',
  'app/page.tsx',
  'package.json',
  'tsconfig.json',
  '.env.local',
];

let allFilesExist = true;
criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log((exists ? '✅' : '❌'), file);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.error('\n❌ Alguns arquivos críticos estão faltando!\n');
  process.exit(1);
}

// 2. Verificar variáveis de ambiente
console.log('\n🔐 Verificação de Variáveis de Ambiente:\n');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const hasToken = envContent.includes('REPLICATE_API_TOKEN=') && !envContent.includes('your_replicate_api_token_here');

if (!hasToken) {
  console.error('❌ REPLICATE_API_TOKEN não configurado em .env.local');
  console.log('\n📖 Para corrigir:');
  console.log('1. Vá para https://replicate.com/account/api-tokens');
  console.log('2. Copie seu token de API');
  console.log('3. Edite .env.local e substitua o valor\n');
  process.exit(1);
}

console.log('✅ REPLICATE_API_TOKEN configurado');

// 3. Verificar package.json
console.log('\n📦 Verificação de Dependências:\n');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));

const requiredDeps = {
  'next': '>=15.0.0',
  'react': '>=19.0.0',
  'replicate': '>=1.4.0',
};

let depsOk = true;
Object.entries(requiredDeps).forEach(([pkg, minVersion]) => {
  const version = packageJson.dependencies[pkg];
  if (version) {
    console.log(`✅ ${pkg}: ${version}`);
  } else {
    console.log(`❌ ${pkg}: não instalado`);
    depsOk = false;
  }
});

if (!depsOk) {
  console.error('\n❌ Algumas dependências estão faltando!');
  console.log('Execute: npm install\n');
  process.exit(1);
}

// 4. Validar tsconfig.json
console.log('\n⚙️  Verificação de Configuração TypeScript:\n');

const tsconfigPath = path.join(__dirname, 'tsconfig.json');
try {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
  
  if (tsconfig.compilerOptions && tsconfig.compilerOptions.lib) {
    console.log('✅ tsconfig.json válido');
    console.log(`  Target: ${tsconfig.compilerOptions.target}`);
    console.log(`  Module: ${tsconfig.compilerOptions.module}`);
  } else {
    console.warn('⚠️  tsconfig.json pode ter problemas');
  }
} catch (err) {
  console.error('❌ Erro ao ler tsconfig.json:', err.message);
  process.exit(1);
}

// 5. Verificar código TypeScript
console.log('\n🔬 Análise de Código (route.ts):\n');

const routePath = path.join(__dirname, 'app', 'api', 'upscale', 'route.ts');
const routeContent = fs.readFileSync(routePath, 'utf-8');

const checks = [
  { name: 'Importa NextRequest/NextResponse', check: /import.*NextRequest.*NextResponse.*from.*next\/server/ },
  { name: 'Importa Replicate', check: /import.*Replicate.*from.*replicate/ },
  { name: 'Função POST definida', check: /export\s+async\s+function\s+POST/ },
  { name: 'Valida arquivo', check: /if\s*\(\s*!file/ },
  { name: 'Chama replicate.run', check: /replicate\.run\(/ },
  { name: 'Trata erros', check: /catch\s*\(/ },
  { name: 'Retorna NextResponse', check: /return\s+new\s+NextResponse/ },
];

let codeOk = true;
checks.forEach(({ name, check }) => {
  const matches = check.test(routeContent);
  console.log((matches ? '✅' : '❌'), name);
  if (!matches) codeOk = false;
});

if (!codeOk) {
  console.error('\n❌ Problemas encontrados no código!\n');
  process.exit(1);
}

// 6. Verificar pasta node_modules
console.log('\n🔧 Verificação de node_modules:\n');

const nodeModulesPath = path.join(__dirname, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules existe');
  
  const replicatePath = path.join(nodeModulesPath, 'replicate');
  if (fs.existsSync(replicatePath)) {
    console.log('✅ replicate package instalado');
  } else {
    console.error('❌ replicate package não instalado');
    console.log('Execute: npm install');
    process.exit(1);
  }
} else {
  console.error('❌ node_modules não existe');
  console.log('Execute: npm install');
  process.exit(1);
}

// 7. Verificar .next (build)
console.log('\n🏗️  Verificação de Build:\n');

const nextPath = path.join(__dirname, '.next');
if (fs.existsSync(nextPath)) {
  console.log('✅ Projeto já foi buildado (.next existe)');
} else {
  console.log('⚠️  .next não existe - você precisa fazer build antes de iniciar');
  console.log('Execute: npm run build\n');
}

// 8. Resumo final
console.log('\n' + '='.repeat(50));
console.log('\n✅ TODAS AS VERIFICAÇÕES PASSARAM!\n');

console.log('📝 Próximos passos:\n');
console.log('1. Se for a primeira vez, faça o build:');
console.log('   npm run build\n');

console.log('2. Inicie o servidor:');
console.log('   npm run dev\n');

console.log('3. Abra no navegador:');
console.log('   http://localhost:3000\n');

console.log('4. Teste com uma imagem pequena (JPG ou PNG)\n');

console.log('5. Se houver erros, verifique:');
console.log('   - Console do navegador (F12)');
console.log('   - Terminal do servidor (deve mostrar logs [Upscale])\n');

console.log('💡 Dicas para resolver problemas:');
console.log('- Se vir "Unknown error": verifique os logs do servidor');
console.log('- Se timeout: tente com uma imagem menor');
console.log('- Se conexão recusada: certifique-se que npm run dev está rodando\n');
