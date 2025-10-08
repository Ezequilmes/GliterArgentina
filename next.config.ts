import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Explicitly set root for output file tracing to silence workspace root warning
  outputFileTracingRoot: path.join(__dirname),
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9199',
        pathname: '/**',
      },
    ],
  },
  // Optimizaciones para producción
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Configuración de headers para mejor rendimiento
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
