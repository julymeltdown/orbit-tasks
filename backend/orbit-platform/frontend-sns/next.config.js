/** @type {import('next').NextConfig} */
const gatewayTarget =
  process.env.GATEWAY_PROXY_TARGET ||
  "https://tasksapi.infinitefallcult.trade";

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
