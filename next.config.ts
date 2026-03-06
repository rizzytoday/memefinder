import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.redd.it" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "media.tenor.com" },
      { protocol: "https", hostname: "media1.tenor.com" },
      { protocol: "https", hostname: "media.giphy.com" },
      { protocol: "https", hostname: "i.imgflip.com" },
      { protocol: "https", hostname: "external-preview.redd.it" },
    ],
  },
};

export default nextConfig;
