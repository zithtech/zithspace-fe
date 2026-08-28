/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Yapiez became API Hub, and its flow/execution/environment pages were
  // retired — everything the module still does lives at /api-hub. Old links
  // and bookmarks land there rather than on a 404.
  async redirects() {
    return [
      { source: "/yapiez", destination: "/api-hub", permanent: false },
      { source: "/yapiez/:path*", destination: "/api-hub", permanent: false },
    ];
  },
};

module.exports = nextConfig;
