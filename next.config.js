/** @type {import('next').NextConfig} */
const nextConfig = {
  // Otimizações para reduzir uso de memória
  swcMinify: true,
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
  
  // Build otimizado
  webpack: (config, { isServer }) => {
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
        },
      },
    };
    return config;
  },
};

export default nextConfig;
