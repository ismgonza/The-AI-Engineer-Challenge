/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fix the cross-origin warning by explicitly allowing dev origins
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
