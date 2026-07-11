import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/binary-heavy packages out of the edge bundler
  serverExternalPackages: ["unpdf", "mammoth", "pg"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.clerk.dev" },
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "ufs.sh" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "seawaters.ufs.sh" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/interviews/:id/session",
        destination: "/interview-session/:id",
        permanent: true,
      },
      {
        source: "/interviews/session/:id",
        destination: "/interview-session/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
