# Doğa Hotel Ölüdeniz

Doğa Hotel Ölüdeniz resmi web sitesi.

## Vercel Deployment Adımları

Bu proje Vercel üzerinde deploy edilmesi için hazırlanmıştır. Sorunsuz bir deployment için şu adımları takip edin:

1. **Vercel hesabınızda yeni bir proje oluşturun**
   - GitHub, GitLab veya Bitbucket reponuzu bağlayın veya bu kodu yükleyin

2. **Çevresel Değişkenleri Ayarlayın**
   - Aşağıdaki çevresel değişkenleri Vercel projenize ekleyin:
   ```
   NEXT_PUBLIC_SITE_URL=https://dogahoteloludeniz.com
   NEXT_PUBLIC_API_URL=https://dogahoteloludeniz.com/api
   NEXT_PUBLIC_FRONTEND_URL=https://dogahoteloludeniz.com
   ```

3. **Build Ayarları**
   - Framework Preset: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`
   - Node.js Version: 18.x (veya daha yeni)

4. **Özel Domain Bağlama (İsteğe Bağlı)**
   - Vercel dashboardında "Domains" sekmesinden özel domaininizi ekleyin
   - DNS ayarlarınızı Vercel'in yönlendirmelerine göre güncelleyin

## API Sorunlarını Çözme

Projenin API çağrıları ile ilgili 404 sorunları yaşaması durumunda:

1. Uygulama statik verilere geri dönecek şekilde tasarlanmıştır
2. API çağrıları başarısız olduğunda otomatik olarak statik veriler kullanılır
3. `/src/app/data/rooms.ts` dosyasındaki statik veriler her zaman yedek olarak mevcuttur

## Yerel Geliştirme

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Ya da production build alın ve başlatın
npm run build
npm start
```

## Notlar

- Bu uygulama hem sunucu hem de istemci tarafında doğru URL'leri oluşturacak şekilde tasarlanmıştır
- Vercel ortamında API endpoint URL'leri otomatik olarak ayarlanır
- Statik içerik ve API yanıtları arasında sorunsuz geçiş için hata işleme mekanizmaları eklenmiştir
