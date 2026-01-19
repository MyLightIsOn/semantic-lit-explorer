/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server actions
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Allow larger PDFs to be uploaded
    },
  },
}

module.exports = nextConfig
