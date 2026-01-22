const https = require('https');
const { Client } = require('pg');

// ========== YAPILANDIRMA ==========
const TEBI_BUCKET = 'dogahotelfethiye';
const BUNNY_STORAGE_ZONE = 'dogahoteloludeniz';
const BUNNY_API_KEY = '65ee41ba-4eb8-4866-81a6f201a8fb-f71d-4d01';
const DATABASE_URL = 'postgresql://neondb_owner:npg_Z9MCcdwu3YGb@ep-icy-bird-a2ty8aid-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';

// ========== YARDIMCI FONKSİYONLAR ==========

// Tebi'den dosya indir
function downloadFromTebi(filePath) {
  return new Promise((resolve, reject) => {
    const url = `https://${TEBI_BUCKET}.s3.tebi.io/${filePath}`;
    console.log(`   Tebi URL: ${url}`);
    
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Redirect varsa takip et
        https.get(res.headers.location, (res2) => {
          const chunks = [];
          res2.on('data', chunk => chunks.push(chunk));
          res2.on('end', () => resolve({
            buffer: Buffer.concat(chunks),
            contentType: res2.headers['content-type']
          }));
          res2.on('error', reject);
        }).on('error', reject);
      } else if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve({
          buffer: Buffer.concat(chunks),
          contentType: res.headers['content-type']
        }));
        res.on('error', reject);
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    }).on('error', reject);
  });
}

// Bunny'ye dosya yükle
function uploadToBunny(filePath, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'storage.bunnycdn.com',
      port: 443,
      path: `/${BUNNY_STORAGE_ZONE}/${filePath}`,
      method: 'PUT',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Length': buffer.length
      }
    };
    
    console.log(`   Bunny URL: https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${filePath}`);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          resolve({ success: true });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// URL'den dosya yolunu çıkar
function extractPath(url) {
  // https://oludenizdogahotel.b-cdn.net/dogahotel/gallery/image.jpg -> dogahotel/gallery/image.jpg
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

// ========== ANA FONKSİYON ==========
async function main() {
  console.log('🚀 TEBİ -> BUNNY DOSYA MIGRATION\n');
  
  // 1. Veritabanından URL'leri al
  console.log('📊 Veritabanına bağlanılıyor...');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  
  const urls = new Set();
  const queries = [
    { q: 'SELECT image_url FROM about WHERE image_url IS NOT NULL', col: 'image_url' },
    { q: 'SELECT image_url FROM about_sections WHERE image_url IS NOT NULL', col: 'image_url' },
    { q: 'SELECT image_url FROM slider WHERE image_url IS NOT NULL', col: 'image_url' },
    { q: 'SELECT video_url FROM slider WHERE video_url IS NOT NULL', col: 'video_url' },
    { q: 'SELECT image_url FROM gallery WHERE image_url IS NOT NULL', col: 'image_url' },
    { q: 'SELECT video_url FROM gallery WHERE video_url IS NOT NULL', col: 'video_url' },
    { q: 'SELECT main_image_url FROM services WHERE main_image_url IS NOT NULL', col: 'main_image_url' },
    { q: 'SELECT image_url FROM service_gallery WHERE image_url IS NOT NULL', col: 'image_url' },
    { q: 'SELECT main_image_url FROM rooms WHERE main_image_url IS NOT NULL', col: 'main_image_url' },
    { q: 'SELECT image_url FROM room_gallery WHERE image_url IS NOT NULL', col: 'image_url' }
  ];

  for (const { q, col } of queries) {
    const result = await client.query(q);
    result.rows.forEach(row => {
      if (row[col]) urls.add(row[col]);
    });
  }
  await client.end();
  
  // Dosya yollarını çıkar
  const filePaths = [...urls].map(extractPath).filter(p => p);
  const uniquePaths = [...new Set(filePaths)];
  
  console.log(`✅ ${uniquePaths.length} dosya bulundu\n`);
  
  // 2. Dosyaları taşı
  let success = 0, failed = 0;
  
  for (let i = 0; i < uniquePaths.length; i++) {
    const path = uniquePaths[i];
    console.log(`\n[${i+1}/${uniquePaths.length}] 📁 ${path}`);
    
    try {
      // Tebi'den indir
      console.log('   ⬇️  İndiriliyor...');
      const { buffer, contentType } = await downloadFromTebi(path);
      console.log(`   ✓ ${(buffer.length / 1024).toFixed(1)} KB indirildi`);
      
      // Bunny'ye yükle
      console.log('   ⬆️  Yükleniyor...');
      await uploadToBunny(path, buffer, contentType);
      console.log('   ✅ Başarılı!');
      success++;
      
    } catch (err) {
      console.log(`   ❌ HATA: ${err.message}`);
      failed++;
    }
  }
  
  // 3. Özet
  console.log('\n' + '='.repeat(50));
  console.log('📊 SONUÇ');
  console.log(`   ✅ Başarılı: ${success}`);
  console.log(`   ❌ Başarısız: ${failed}`);
  console.log(`   📦 Toplam: ${uniquePaths.length}`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('\n🎉 TÜM DOSYALAR BAŞARIYLA TAŞINDI!');
    console.log('🌐 CDN: https://oludenizdogahotel.b-cdn.net');
  }
}

main().catch(err => {
  console.error('HATA:', err);
  process.exit(1);
});
