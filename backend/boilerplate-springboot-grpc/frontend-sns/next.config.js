/** @type {import('next').NextConfig} */
const gatewayTarget =
  process.env.GATEWAY_PROXY_TARGET ||
  "http://api-gateway.boilerplate-random.svc.cluster.local:25429";

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/gateway/:path*",
        destination: `${gatewayTarget}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
