/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // BGG-hosted images and YouTube thumbnails need to be allowed here
    // so <Image> can optimize them instead of throwing an error.
    remotePatterns: [
      { protocol: "https", hostname: "cf.geekdo-images.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

module.exports = nextConfig;
