/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" }, // monthly evidence uploads
  },
  // Supabase Storage signed URLs are fetched directly from the client; no images
  // domain config needed yet.
};

export default nextConfig;
