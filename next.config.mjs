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
  // Exclude non-essential files from output file tracing
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'scripts/**/*',
      ],
    },
  },
}

export default nextConfig
