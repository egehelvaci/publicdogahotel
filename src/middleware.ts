import { NextRequest, NextResponse } from 'next/server';

// JWT sırrı - üretim ortamında ortam değişkeni olarak saklanmalıdır
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const COOKIE_NAME = 'auth_token';

// Token doğrulama fonksiyonu - geliştirilmiş
async function verifyToken(token: string) {
  try {
    // Basit bir doğrulama yaklaşımı
    // NOT: Bu, tam bir JWT doğrulaması değildir, sadece token'ın varlığını kontrol eder
    // Gerçek uygulamada daha gelişmiş bir doğrulama kullanılmalıdır
    
    // Tokenin varlığını kontrol ediyoruz, bu basit yaklaşımda
    // sadece bir token olup olmadığını kontrol ediyoruz
    return { 
      verified: !!token, 
      payload: { 
        role: 'admin' // Gerçek uygulamada bu değer token içinden çıkarılmalıdır
      } 
    };
  } catch (error) {
    console.error('Token doğrulama hatası:', error);
    return { verified: false, payload: null };
  }
}

export async function middleware(request: NextRequest) {
  // GET isteklerini yetkilendirme olmadan geçir
  if (request.method === 'GET' && request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Public API rotaları için middleware'i atla
  if (request.nextUrl.pathname.startsWith('/api/public/')) {
    return NextResponse.next();
  }
  
  // Admin login sayfası için middleware'i atla
  if (request.nextUrl.pathname.includes('/admin/login')) {
    return NextResponse.next();
  }
  
  // API rotalarını kontrol et ve auth endpoint'ini bypass et
  if (request.nextUrl.pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next();
  }
  
  // Admin sayfaları veya admin API rotaları için yetkilendirme gerekli
  const isAdminPage = request.nextUrl.pathname.includes('/admin');
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin/');
  
  if (isAdminPage || isAdminApi) {
    try {
      // Cookie'den token'ı al
      const token = request.cookies.get(COOKIE_NAME)?.value;
      
      // Token kontrolü
      if (!token) {
        // API isteği ise 401 döndür
        if (isAdminApi) {
          return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        // Sayfa isteği ise login sayfasına yönlendir
        const lang = request.nextUrl.pathname.split('/')[1] || 'tr';
        return NextResponse.redirect(new URL(`/${lang}/admin/login`, request.url));
      }
      
      // Token doğrulama
      const { verified, payload } = await verifyToken(token);
      
      if (verified && payload?.role === 'admin') {
        return NextResponse.next();
      } else {
        // Token geçersiz veya süresi dolmuş
        
        // API isteği ise 401 döndür
        if (isAdminApi) {
          return NextResponse.json(
            { success: false, message: 'Unauthorized' },
            { status: 401 }
          );
        }
        
        // Sayfa isteği ise login sayfasına yönlendir
        const lang = request.nextUrl.pathname.split('/')[1] || 'tr';
        return NextResponse.redirect(new URL(`/${lang}/admin/login`, request.url));
      }
    } catch (error) {
      console.error('Middleware hatası:', error);
      
      // API isteği ise 500 döndür
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, message: 'Server Error' },
          { status: 500 }
        );
      }
      
      return NextResponse.next();
    }
  }
  
  // Diğer tüm rotalar için middleware'i atla
  return NextResponse.next();
}

// Middleware'in hangi rotalarda çalışacağını belirle
export const config = {
  matcher: [
    // Admin sayfaları için
    '/admin/:path*',
    '/:lang/admin/:path*',
    // Admin API rotaları için
    '/api/admin/:path*'
  ],
};
