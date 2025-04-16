/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Statik dışa aktarma devre dışı bırakıldı
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig 