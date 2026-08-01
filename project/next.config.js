/** @type {import('next').NextConfig} */
const resolveApiBackendUrl = () => {
  const explicitBackend = process.env.API_BACKEND_URL;
  if (explicitBackend) return explicitBackend;

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicApiUrl && /^https?:\/\//.test(publicApiUrl)) {
    return publicApiUrl;
  }

  return 'http://localhost:3000/api';
};

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async rewrites() {
    const apiBase = resolveApiBackendUrl();

    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
