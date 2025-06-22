/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase the limit to 10MB
    },
  },
  images: {
    domains: ['yeiegscduyabosanaest.supabase.co', 'supabase.co'],
  },
}

module.exports = nextConfig 