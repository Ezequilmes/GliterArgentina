/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración para Firebase Hosting con App Hosting
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  }
}

export default nextConfig