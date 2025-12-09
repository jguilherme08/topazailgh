#!/usr/bin/env node
/**
 * Script para testar a API de upscale
 * Cria uma imagem de teste e faz upload
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const FormData = require('form-data');

console.log('🧪 === TESTE DE UPSCALE ===\n');

// Verificar se o servidor está rodando
const checkServer = () => {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200);
      res.resume();
    }).on('error', () => {
      resolve(false);
    });
  });
};

// Criar imagem de teste (PNG pequeno)
function createTestImage() {
  // Criar um PNG válido de 10x10 pixels
  // PNG header + IHDR chunk + IDAT chunk + IEND chunk
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk (13 bytes data + 12 bytes chunk overhead)
  const ihdr = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x0D]), // chunk length
    Buffer.from('IHDR'),
    Buffer.from([0x00, 0x00, 0x00, 0x0A]), // width: 10
    Buffer.from([0x00, 0x00, 0x00, 0x0A]), // height: 10
    Buffer.from([0x08, 0x02, 0x00, 0x00, 0x00]), // bit depth, color type, compression, filter, interlace
    Buffer.from([0xCB, 0x2B, 0xB4, 0x6F]) // CRC (dummy)
  ]);

  // IDAT chunk (minimal compressed data)
  const idat = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x24]), // chunk length
    Buffer.from('IDAT'),
    Buffer.from([0x08, 0xD7, 0x01, 0x02, 0x00, 0xFD, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]), // minimal deflate data
    Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]), // padding
    Buffer.from([0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]),
    Buffer.from([0x00, 0x00, 0x00, 0x00]),
    Buffer.from([0xF9, 0x4D, 0x91, 0xC7]) // CRC (dummy)
  ]);

  // IEND chunk
  const iend = Buffer.concat([
    Buffer.from([0x00, 0x00, 0x00, 0x00]), // chunk length
    Buffer.from('IEND'),
    Buffer.from([0xAE, 0x42, 0x60, 0x82]) // CRC
  ]);

  return Buffer.concat([pngHeader, ihdr, idat, iend]);
}

(async () => {
  try {
    console.log('🔍 Verificando se o servidor está rodando...\n');
    const serverRunning = await checkServer();
    
    if (!serverRunning) {
      console.error('❌ Servidor não está respondendo em http://localhost:3000');
      console.log('\nInicie o servidor com: npm run dev\n');
      process.exit(1);
    }

    console.log('✅ Servidor está rodando!\n');

    console.log('📝 Criando imagem de teste...');
    const testImageBuffer = createTestImage();
    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, testImageBuffer);
    console.log(`✅ Imagem criada: ${testImagePath} (${testImageBuffer.length} bytes)\n`);

    console.log('📤 Enviando requisição de upscale...');
    console.log('  - Scale: 2x');
    console.log('  - Face Restore: false');
    console.log('  - Arquivo: test-image.png\n');

    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath), 'test-image.png');
    form.append('scale', '2');
    form.append('faceRestore', 'false');

    const request = http.request('http://localhost:3000/api/upscale', {
      method: 'POST',
      headers: form.getHeaders(),
      timeout: 120000, // 2 minutos de timeout
    }, (res) => {
      let data = Buffer.alloc(0);

      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
        process.stdout.write(`  Recebendo: ${data.length} bytes\r`);
      });

      res.on('end', () => {
        fs.unlinkSync(testImagePath);
        console.log(`\n`);

        if (res.statusCode === 200) {
          const outputPath = path.join(__dirname, 'upscaled-test.png');
          fs.writeFileSync(outputPath, data);
          console.log('✅ SUCESSO!\n');
          console.log(`📊 Resultado:`);
          console.log(`  - Status: ${res.statusCode}`);
          console.log(`  - Tamanho recebido: ${data.length} bytes`);
          console.log(`  - Arquivo salvo: ${outputPath}\n`);
        } else {
          let errorMsg = res.statusCode.toString();
          try {
            const jsonData = JSON.parse(data.toString());
            errorMsg = jsonData.details || jsonData.error || errorMsg;
          } catch (e) {
            errorMsg = data.toString().substring(0, 200);
          }

          console.error(`❌ ERRO HTTP ${res.statusCode}\n`);
          console.error(`📋 Detalhes do erro:`);
          console.error(`  ${errorMsg}\n`);
          console.log('💡 Dicas:');
          console.log('  1. Verifique os logs do servidor (console)');
          console.log('  2. Certifique-se que REPLICATE_API_TOKEN está configurado');
          console.log('  3. Tente com uma imagem real em vez de teste\n');
        }
      });
    });

    request.on('error', (err) => {
      console.error(`❌ ERRO DE CONEXÃO: ${err.message}\n`);
      console.log('Certifique-se que o servidor está rodando com: npm run dev\n');
      fs.unlinkSync(testImagePath);
      process.exit(1);
    });

    request.on('timeout', () => {
      console.error(`❌ TIMEOUT: Requisição demorou mais de 2 minutos\n`);
      request.destroy();
      fs.unlinkSync(testImagePath);
      process.exit(1);
    });

    form.pipe(request);
  } catch (err) {
    console.error(`❌ ERRO: ${err.message}\n`);
    process.exit(1);
  }
})();
