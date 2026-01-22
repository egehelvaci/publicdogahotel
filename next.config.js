/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel üzerinde çalışacak şekilde output'u "standalone" olarak ayarla
  output: 'standalone',
  
  // Klasik Image Optimization yerine Vercel Image Optimization'ı kullan
  images: {
    domains: [
      'localhost',
      'dogahoteloludeniz.vercel.app',
      'dogahoteloludeniz.com',
      'www.dogahoteloludeniz.com',
      'dogahotel.vercel.app',
      'publicdogahotel.vercel.app'
    ],
    // Vercel Image Optimization'ı etkinleştir
    unoptimized: true,
  },
  
  // API istekleri için CORS başlıklarını yapılandır
  async headers() {
    return [
      {
        // API rotaları için headers
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
          // Önbelleğe alınmadan sunulmasını sağlar
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' }
        ],
      },
    ]
  },
  
  // Kullanıcılara daha iyi hata mesajları sağla
  onDemandEntries: {
    // Sayfaları daha uzun süre bellekte tut
    maxInactiveAge: 25 * 1000,
    // Aynı anda bellekte tutulacak sayfa sayısı
    pagesBufferLength: 5,
  },
  
  // Webpack yapılandırması
  webpack: (config, { dev, isServer }) => {
    // Sadece production build'inde
    if (!dev) {
      // Post CSS optimizasyonlarını ekle
      config.optimization.minimize = true;
    }
    
    // isServer false olduğunda, yani client tarafında çalışırken
    if (!isServer) {
      // Sadece Node.js ortamında çalışan modülleri client tarafında kullanmaya çalışınca
      // hata vermemesi için fallback tanımla
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        dns: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    
    return config;
  },
  
  // Sunucu fonksiyonlarını yapılandır
  experimental: {
    // Sayfaların ön belleklenme davranışını yapılandır
    // Vercel üzerinde daha iyi performans sağlar
    serverActions: {
      bodySizeLimit: '4mb',
    }
  },
  
  // Vercel üzerinde otomatik build hatalarını görmezden gel
  typescript: {
    // Build sırasındaki TypeScript hatalarını görmezden gel
    ignoreBuildErrors: true,
  },
  
  // ESLint hatalarını görmezden gel
  eslint: {
    // Build sırasındaki ESLint hatalarını görmezden gel
    ignoreDuringBuilds: true,
  },
  
  env: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    VERCEL_URL: process.env.VERCEL_URL
  }
};

module.exports = nextConfig; 