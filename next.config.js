/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    // FIXME: This allows production builds to complete even if there are type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  basePath: process.env.ROOT_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: process.env.ROOT_PATH,
  },
};

module.exports = nextConfig;
