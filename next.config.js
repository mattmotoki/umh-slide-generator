/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // Since we're serving local images
  },
  experimental: {
    serverComponentsExternalPackages: ['jsdom'],
  },
}

module.exports = nextConfig