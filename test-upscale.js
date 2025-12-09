#!/usr/bin/env node

/**
 * Script de teste para a rota /api/upscale com Replicate
 * Uso: node test-upscale.js <caminho-da-imagem>
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('❌ Uso: node test-upscale.js <caminho-da-imagem> [scale] [faceRestore]');
  console.error('   Exemplo: node test-upscale.js ./test-image.jpg 2 false');
  process.exit(1);
}

const imagePath = args[0];
const scale = parseInt(args[1] || '2');
const faceRestore = args[2] === 'true' || false;

if (!fs.existsSync(imagePath)) {
  console.error(`❌ Arquivo não encontrado: ${imagePath}`);
  process.exit(1);
}

const fileSize = fs.statSync(imagePath).size;
const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);

console.log('\n📤 Teste de Upscaling - Replicate');
console.log('==================================');
console.log(`📁 Arquivo: ${path.basename(imagePath)}`);
console.log(`📊 Tamanho: ${fileSizeMB} MB`);
console.log(`🔍 Escala: ${scale}x`);
console.log(`😊 Face Restore: ${faceRestore ? 'Ativado' : 'Desativado'}`);
console.log('==================================\n');

const form = new FormData();
form.append('file', fs.createReadStream(imagePath));
form.append('scale', scale.toString());
form.append('faceRestore', faceRestore.toString());

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/upscale',
  method: 'POST',
  headers: form.getHeaders(),
};

const req = require('http').request(options, (res) => {
  console.log(`⏳ Processando... (Status: ${res.statusCode})`);

  if (res.statusCode !== 200) {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.error(`❌ Erro: ${data}`);
      process.exit(1);
    });
    return;
  }

  const outputPath = `upscaled_${Date.now()}.png`;
  const fileStream = fs.createWriteStream(outputPath);

  res.on('data', (chunk) => {
    process.stdout.write('.');
  });

  res.pipe(fileStream);

  fileStream.on('finish', () => {
    const outputSize = fs.statSync(outputPath).size;
    const outputSizeMB = (outputSize / (1024 * 1024)).toFixed(2);
    console.log(`\n\n✅ Sucesso!`);
    console.log(`📥 Arquivo salvo: ${outputPath}`);
    console.log(`📊 Tamanho da saída: ${outputSizeMB} MB`);
    console.log(`⏱️  Tempo total: ${((Date.now() - startTime) / 1000).toFixed(2)}s\n`);
  });
});

const startTime = Date.now();

req.on('error', (e) => {
  console.error(`❌ Erro de conexão: ${e.message}`);
  console.error('Certifique-se de que o servidor está rodando em http://localhost:3000');
  process.exit(1);
});

form.pipe(req);
