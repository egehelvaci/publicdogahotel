/**
 * Tebi.io → Bunny.net Migrasyon Scripti
 */

const { Client } = require('pg');
const fetch = require('node-fetch');

// Yapılandırma
const CONFIG = {
  // Tebi
  TEBI_BUCKET: 'dogahotelfethiye',
  
  // Bunny
  BUNNY_STORAGE_ZONE: 'dogahoteloludeniz',
  BUNNY_STORAGE_PASSWORD: '65ee41ba-4eb8-4866-81a6f201a8fb-f71d-4d01',
  BUNNY_CDN_HOSTNAME: 'oludenizdogahotel.b-cdn.net',
  BUNNY_STORAGE_URL: 'https://storage.bunnycdn.com',
  
  // Database
  DATABASE_URL: 'postgresql://neondb_owner:npg_Z9MCcdwu3YGb@ep-icy-bird-a2ty8aid-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require'
};

const stats = { total: 0, success: 0, failed: 0 };

/**
 * URL'den dosya yolunu çıkar
 */
function extractKey(url) {
  if (!url) return null;
  
  // https://oludenizdogahotel.b-cdn.net/dogahotel/gallery/image.jpg
  // https://dogahotelfethiye.s3.tebi.io/dogahotel/gallery/image.jpg
  
  const patterns = [
    /oludenizdogahotel\.b-cdn\.net\/(.+)/,
    /dogahotelfethiye\.s3\.tebi\.io\/(.+)/,
    /s3\.tebi\.io\/dogahotelfethiye\/(.+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Dosyayı Tebi'den indirip Bunny'ye yükle
 */
async function migrateFile(tebiUrl) {
  const key = extractKey(tebiUrl);
  if (!key) {
    console.log(`  ❌ Key çıkarılamadı: ${tebiUrl}`);
    return null;
  }

  try {
    // 1. Tebi'den indir
    const downloadUrl = `https://${CONFIG.TEBI_BUCKET}.s3.tebi.io/${key}`;
    console.log(`  ⬇️  İndiriliyor: ${downloadUrl}`);
    
    const downloadRes = await fetch(downloadUrl);
    if (!downloadRes.ok) {
      console.log(`  ❌ İndirme hatası: ${downloadRes.status}`);
      return null;
    }
    
    const contentType = downloadRes.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await downloadRes.arrayBuffer());
    console.log(`  ✓ İndirildi: ${(buffer.length / 1024).toFixed(1)} KB`);

    // 2. Bunny'ye yükle
    const uploadUrl = `${CONFIG.BUNNY_STORAGE_URL}/${CONFIG.BUNNY_STORAGE_ZONE}/${key}`;
    console.log(`  ⬆️  Yükleniyor: ${uploadUrl}`);
    
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': CONFIG.BUNNY_STORAGE_PASSWORD,
        'Content-Type': contentType,
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.log(`  ❌ Yükleme hatası (${uploadRes.status}): ${errorText}`);
      return null;
    }

    const newUrl = `https://${CONFIG.BUNNY_CDN_HOSTNAME}/${key}`;
    console.log(`  ✅ Başarılı: ${newUrl}`);
    return newUrl;
    
  } catch (error) {
    console.log(`  ❌ Hata: ${error.message}`);
    return null;
  }
}

/**
 * Veritabanından URL'leri al
 */
async function getUrls(client) {
  const urls = new Set();
  
  const queries = [
    'SELECT image_url FROM about WHERE image_url IS NOT NULL',
    'SELECT image_url FROM about_sections WHERE image_url IS NOT NULL',
    'SELECT image_url FROM slider WHERE image_url IS NOT NULL',
    'SELECT video_url FROM slider WHERE video_url IS NOT NULL',
    'SELECT image_url FROM gallery WHERE image_url IS NOT NULL',
    'SELECT video_url FROM gallery WHERE video_url IS NOT NULL',
    'SELECT main_image_url FROM services WHERE main_image_url IS NOT NULL',
    'SELECT image_url FROM service_gallery WHERE image_url IS NOT NULL',
    'SELECT main_image_url FROM rooms WHERE main_image_url IS NOT NULL',
    'SELECT image_url FROM room_gallery WHERE image_url IS NOT NULL'
  ];

  for (const q of queries) {
    const result = await client.query(q);
    result.rows.forEach(row => {
      const url = Object.values(row)[0];
      if (url) urls.add(url);
    });
  }
  
  return [...urls];
}

/**
 * Bunny bağlantı testi
 */
async function testBunnyConnection() {
  console.log('\n🧪 Bunny.net bağlantı testi...');
  
  try {
    const testUrl = `${CONFIG.BUNNY_STORAGE_URL}/${CONFIG.BUNNY_STORAGE_ZONE}/`;
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: { 'AccessKey': CONFIG.BUNNY_STORAGE_PASSWORD }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('   ❌ Yetkilendirme hatası! Password kontrol edin.');
      return false;
    }
    
    console.log('   ✅ Bağlantı başarılı!');
    return true;
  } catch (error) {
    console.log(`   ❌ Bağlantı hatası: ${error.message}`);
    return false;
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  console.log('\n🚀 Tebi.io → Bunny.net Migrasyon');
  console.log('='.repeat(50));
  console.log(`Storage Zone: ${CONFIG.BUNNY_STORAGE_ZONE}`);
  console.log(`CDN: ${CONFIG.BUNNY_CDN_HOSTNAME}`);
  console.log('='.repeat(50));
  
  // Bunny testi
  const bunnyOk = await testBunnyConnection();
  if (!bunnyOk) {
    console.log('\n❌ Bunny bağlantısı başarısız. Çıkılıyor...');
    process.exit(1);
  }
  
  // Database bağlantısı
  console.log('\n📊 Veritabanına bağlanılıyor...');
  const client = new Client({
    connectionString: CONFIG.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('   ✅ Bağlantı başarılı!');
  
  // URL'leri al
  console.log('\n📋 URL\'ler alınıyor...');
  const urls = await getUrls(client);
  const uniqueKeys = [...new Set(urls.map(extractKey).filter(k => k))];
  console.log(`   ${uniqueKeys.length} dosya bulundu`);
  
  // Dosyaları taşı
  console.log('\n📦 Dosyalar taşınıyor...\n');
  
  for (let i = 0; i < uniqueKeys.length; i++) {
    const key = uniqueKeys[i];
    console.log(`[${i + 1}/${uniqueKeys.length}] ${key}`);
    
    const tebiUrl = `https://${CONFIG.TEBI_BUCKET}.s3.tebi.io/${key}`;
    const result = await migrateFile(tebiUrl);
    
    stats.total++;
    if (result) {
      stats.success++;
    } else {
      stats.failed++;
    }
    console.log('');
  }
  
  await client.end();
  
  // Sonuç
  console.log('='.repeat(50));
  console.log('📊 SONUÇ');
  console.log(`   Toplam: ${stats.total}`);
  console.log(`   Başarılı: ${stats.success} ✅`);
  console.log(`   Başarısız: ${stats.failed} ❌`);
  console.log('='.repeat(50));
}

main().catch(console.error);
