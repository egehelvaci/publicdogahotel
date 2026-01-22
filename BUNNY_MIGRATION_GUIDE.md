# Tebi'den Bunny.net'e Geçiş Rehberi

## 📋 Genel Bakış

Tebi.io servisinin kapanması nedeniyle, proje dosya depolama ve CDN servisi olarak Bunny.net'e geçirilmiştir.

## ✅ Yapılan Değişiklikler

### 1. Yeni Kütüphane Eklendi
- ✅ `src/lib/bunny.ts` - Bunny.net entegrasyonu için yeni kütüphane oluşturuldu
- ✅ `uploadToBunny()` - Dosya yükleme fonksiyonu
- ✅ `deleteFromBunny()` - Dosya silme fonksiyonu

### 2. API Route'ları Güncellendi
Aşağıdaki dosyalarda Tebi importları Bunny ile değiştirildi:
- ✅ `src/app/api/upload/route.ts`
- ✅ `src/app/api/admin/upload/route.ts`
- ✅ `src/app/api/gallery/route.ts`
- ✅ `src/app/api/admin/gallery/upload/route.ts`
- ✅ `src/app/api/admin/services/[id]/gallery/upload/route.ts`
- ✅ `src/app/api/test/upload/route.ts`

### 3. Environment Variables
`vercel.json` dosyasındaki environment variables güncellendi:

**ESKİ (Tebi):**
```bash
TEBI_BUCKET=dogahotelfethiye
TEBI_API_KEY=alznfugnmS1jyhnS
TEBI_MASTER_KEY=mcjtH1bhF2mnIke7VB2MVuQnk5YaJdbTCisd7xhk
```

**YENİ (Bunny.net):**
```bash
BUNNY_STORAGE_ZONE_NAME=your_storage_zone_name
BUNNY_STORAGE_ZONE_REGION=de
BUNNY_ACCESS_KEY=your_bunny_access_key
BUNNY_PASSWORD=your_bunny_password
BUNNY_CDN_HOSTNAME=your-storage.b-cdn.net
```

### 4. Test Dosyaları Güncellendi
- ✅ `src/app/test/upload/page.tsx` - Bunny.net için güncellendi

### 5. Dokümantasyon
- ✅ `README.md` - Bunny.net bilgileri eklendi

## 🚀 Bunny.net Kurulum Adımları

### 1. Bunny.net Hesabı Oluşturun
1. [Bunny.net](https://bunny.net) adresine gidin
2. Yeni bir hesap oluşturun
3. Dashboard'a giriş yapın

### 2. Storage Zone Oluşturun
1. Sol menüden **Storage** sekmesine tıklayın
2. **Add Storage Zone** butonuna tıklayın
3. Storage Zone adı girin (örn: `dogahotel`)
4. Bölge seçin:
   - `de` - Almanya (Falkenstein) - Avrupa için önerilir
   - `uk` - İngiltere (London)
   - `ny` - New York
   - `la` - Los Angeles
   - `sg` - Singapur
   - `syd` - Sidney
5. Replication özelliklerini istediğiniz gibi ayarlayın
6. **Add Storage Zone** butonuna tıklayın

### 3. Access Credentials Alın
1. Oluşturduğunuz Storage Zone'a tıklayın
2. Sağ üst köşedeki **FTP & API Access** sekmesine gidin
3. Aşağıdaki bilgileri not edin:
   - **Storage Zone Name** (örn: `dogahotel`)
   - **Access Key** (Password sekmesinde gösterilir)
   - **Password** (Yeni password oluşturmanız gerekebilir)

### 4. CDN Hostname
1. Storage Zone ayarlarında **CDN** sekmesine gidin
2. CDN hostname'inizi not edin (örn: `dogahotel.b-cdn.net`)
3. İsterseniz özel domain ekleyebilirsiniz

### 5. Environment Variables'ı Güncelleyin

#### Vercel'de:
1. Vercel Dashboard'a gidin
2. Projenizi seçin
3. **Settings** > **Environment Variables** sekmesine gidin
4. Eski Tebi değişkenlerini silin
5. Yeni Bunny.net değişkenlerini ekleyin:

```bash
BUNNY_STORAGE_ZONE_NAME=dogahotel
BUNNY_STORAGE_ZONE_REGION=de
BUNNY_ACCESS_KEY=your_actual_access_key_here
BUNNY_PASSWORD=your_actual_password_here
BUNNY_CDN_HOSTNAME=dogahotel.b-cdn.net
```

#### Lokal Geliştirme için (.env.local):
`.env.local` dosyası oluşturun (varsa güncelleyin):

```bash
# Bunny.net Storage Configuration
BUNNY_STORAGE_ZONE_NAME=dogahotel
BUNNY_STORAGE_ZONE_REGION=de
BUNNY_ACCESS_KEY=your_actual_access_key_here
BUNNY_PASSWORD=your_actual_password_here
BUNNY_CDN_HOSTNAME=dogahotel.b-cdn.net

# Database
DATABASE_URL=your_database_url_here

# ImageKit (varsa)
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=your_imagekit_key_here
```

## 📦 Mevcut Dosyaların Taşınması

### Otomatik Taşıma (Önerilir)
Bunny.net, Storage Zone'lar arasında otomatik senkronizasyon özelliği sunar. Ancak Tebi'den Bunny'ye otomatik taşıma olmadığı için manuel taşıma yapmanız gerekecek.

### Manuel Taşıma Adımları

#### 1. Yöntem: Web Interface ile
1. Tebi'den dosyalarınızı bilgisayarınıza indirin
2. Bunny.net Dashboard'da Storage Zone'unuza girin
3. **File Manager** sekmesine gidin
4. Dosyalarınızı sürükle-bırak ile yükleyin

#### 2. Yöntem: FTP/FTPS ile
1. FileZilla veya benzeri bir FTP istemcisi kullanın
2. Tebi FTP bilgilerinizle bağlanıp dosyaları indirin
3. Bunny.net FTP bilgilerinizle bağlanıp dosyaları yükleyin

Bunny.net FTP Bilgileri:
```
Host: storage.bunnycdn.com
Username: [storage_zone_name]
Password: [your_storage_zone_password]
Port: 21 (FTP) veya 990 (FTPS)
```

#### 3. Yöntem: API ile (Gelişmiş)
Node.js script kullanarak otomatik taşıma yapabilirsiniz. Örnek bir script:

```javascript
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Tebi'den dosyaları listele ve indir
// Bunny'ye yükle
// ...implementasyon detayları...
```

## 🔍 URL Değişiklikleri

### Eski Tebi URL Formatı:
```
https://dogahotelfethiye.s3.tebi.io/dogahotel/gallery/image.jpg
veya
https://s3.tebi.io/dogahotelfethiye/dogahotel/gallery/image.jpg
```

### Yeni Bunny CDN URL Formatı:
```
https://dogahotel.b-cdn.net/dogahotel/gallery/image.jpg
```

## 🗄️ Veritabanı URL Güncellemesi

Eğer veritabanınızda dosya URL'leri kayıtlıysa, bunları güncellemeniz gerekebilir:

```sql
-- Örnek SQL güncelleme sorgusu
UPDATE gallery 
SET image_url = REPLACE(image_url, 'dogahotelfethiye.s3.tebi.io', 'dogahotel.b-cdn.net')
WHERE image_url LIKE '%tebi.io%';

UPDATE gallery 
SET video_url = REPLACE(video_url, 'dogahotelfethiye.s3.tebi.io', 'dogahotel.b-cdn.net')
WHERE video_url LIKE '%tebi.io%';

-- Diğer tablolar için de benzer sorgular çalıştırın
UPDATE services 
SET image_url = REPLACE(image_url, 'dogahotelfethiye.s3.tebi.io', 'dogahotel.b-cdn.net')
WHERE image_url LIKE '%tebi.io%';
```

## 🧪 Test Etme

1. Projeyi lokalinizde çalıştırın:
```bash
npm run dev
```

2. Test sayfasına gidin:
```
http://localhost:3000/test/upload
```

3. Bir dosya yükleyin ve URL'in Bunny.net formatında olduğunu doğrulayın

4. Admin panelinden galeri yükleme testleri yapın

## ⚠️ Önemli Notlar

1. **Tebi dosyaları hemen silmeyin**: Önce tüm dosyaların Bunny'ye başarıyla taşındığından ve URL'lerin güncellendiğinden emin olun.

2. **Cache temizliği**: Bunny.net'te dosyaları güncellerseniz, CDN cache'ini temizlemeniz gerekebilir:
   - Storage Zone > Purge Cache butonunu kullanın

3. **CORS ayarları**: Bunny.net Storage Zone ayarlarında CORS'u yapılandırmanız gerekebilir.

4. **Bandwidth ve Storage limitleri**: Bunny.net'in fiyatlandırma planlarını kontrol edin.

## 📞 Destek

Sorun yaşarsanız:
- Bunny.net Dokümantasyon: https://docs.bunny.net/
- Bunny.net Destek: https://support.bunny.net/
- AWS S3 API Dokümantasyonu: https://docs.aws.amazon.com/s3/

## 📊 Bunny.net Avantajları

- ✅ Global CDN ağı (93+ lokasyon)
- ✅ Düşük latency
- ✅ Uygun fiyatlandırma
- ✅ S3-compatible API
- ✅ Kolay kullanım
- ✅ DDoS koruması
- ✅ SSL/TLS desteği
- ✅ Video optimizasyonu
- ✅ Resim optimizasyonu (Bunny Optimizer)

## 🗑️ Tebi Temizliği (Geçiş Tamamlandıktan Sonra)

Geçiş tamamlandıktan ve her şeyin düzgün çalıştığından emin olduktan sonra:

1. Tebi dosyalarını silin (veya backup olarak saklayın)
2. Tebi hesabınızı kapatın
3. `src/lib/tebi.ts` dosyasını silin (zaten kullanılmıyor)
4. Environment variables'tan Tebi değişkenlerini tamamen kaldırın
