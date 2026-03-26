/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  output: 'export',
  distDir: 'public',
};

module.exports = nextConfig;
