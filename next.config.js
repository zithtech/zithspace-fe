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

      // Playbooks moved out of QA Space into its own nav section, and out of
      // the /qa-workspace prefix with it. Every sub-route came along, so the
      // wildcard maps them one-for-one rather than dumping them on the index.
      {
        source: "/qa-workspace/playbooks",
        destination: "/playbooks",
        permanent: false,
      },
      {
        source: "/qa-workspace/playbooks/:path*",
        destination: "/playbooks/:path*",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
