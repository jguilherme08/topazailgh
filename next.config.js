/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para reduzir uso de memória
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // Configuração de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
