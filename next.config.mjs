/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable output file tracing to avoid micromatch stack overflow
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/**/*',
        '.next/**/*',
        'scripts/**/*',
      ],
    },
  },
}

export default nextConfig
