/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
    };

    if (isServer) {
      config.externals = [...(config.externals || []), "canvas"];
    }

    return config;
  },

  experimental: {
    modern: true,
    scrollRestoration: true,
  },

  // Minimal Turbopack config to avoid Turbopack vs webpack build error
  turbopack: {},

  async rewrites() {
    return [
      { source: "/alerts", destination: "/next-voters-line" },
      { source: "/alerts/interests", destination: "/next-voters-line/interests" },
      { source: "/alerts/referral", destination: "/next-voters-line/referral" },
    ];
  },

  images: {
    domains: ["example.com"],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
