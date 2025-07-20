/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  ...(process.env.NODE_ENV === 'devenv' && { assetPrefix: '/marketing-web' }),
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    config.resolve.fallback = {
      ...config.resolve.fallback, // if you miss it, all the other options in fallback, specified
      // by next.js will be dropped. Doesn't make much sense, but how it is
      fs: false, // the solution
    };

    return config;
  },
  async redirects() {
    // Redirects for old pages
    const redirects = require('./redirects.json').filter((redirect) => !/^[/](?:schedule)/i.test(redirect.source));

    return [
      {
        source: '/schedule/foodapp',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/scheduling/foodapp-link`,
        permanent: true,
        basePath: false
      },
      {
        source: '/schedule/provider/foodapp',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/provider/foodapp-link`,
        permanent: true,
        basePath: false
      },
      // {
      //   source: "/schedule/legal/privacy",
      //   destination: "https://foodsmart.com/privacy-policy",
      //   permanent: false
      // },
      ...redirects,
    ]
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
