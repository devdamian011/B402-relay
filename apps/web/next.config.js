/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@b402-relay/ui", "@b402-relay/types"]
};

module.exports = nextConfig;
