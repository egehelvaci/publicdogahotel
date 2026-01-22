const { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const { Client } = require('pg');

// Tebi yapılandırması
const TEBI_CONFIG = {
  endpoint: 'https://s3.tebi.io',
  region: 'auto',
  credentials: {
    accessKeyId: 'alznfugnmS1jyhnS',
    secretAccessKey: 'mcjtH1bhF2mnIke7VB2MVuQnk5YaJdbTCisd7xhk'
  },
  bucket: 'dogahotelfethiye'
};

// Bunny yapılandırması
const BUNNY_CONFIG = {
  endpoint: 'https://storage.bunnycdn.com',
  region: 'de',
  credentials: {
    accessKeyId: 'dogahoteloludeniz',
    secretAccessKey: '3ee304b4-bb1a-4b9e-8148dcd99b32-5af0-4ac2'
  },
  storageZone: 'dogahoteloludeniz'
};

// Database
const DATABASE_URL = 'postgresql://neondb_owner:npg_Z9MCcdwu3YGb@ep-icy-bird-a2ty8aid-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';

// Tebi S3 Client
const tebiClient = new S3Client({
  endpoint: TEBI_CONFIG.endpoint,
  region: TEBI_CONFIG.region,
  credentials: TEBI_CONFIG.credentials,
  forcePathStyle: true
});

// Bunny S3 Client
const bunnyClient = new S3Client({
  endpoint: BUNNY_CONFIG.endpoint,
  region: BUNNY_CONFIG.region,
  credentials: BUNNY_CONFIG.credentials,
  forcePathStyle: false
});

// Veritabanından tüm URL'leri al
async function getAllUrls() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  
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

  for (const query of queries) {
    const result = await client.query(query);
    result.rows.forEach(row => {
      const url = Object.values(row)[0];
      if (url) urls.add(url);
    });
  }

  await client.end();
  
  return Array.from(urls);
}

// URL'den dosya yolunu çıkar
function extractFilePath(url) {
  // https://oludenizdogahotel.b-cdn.net/dogahotel/gallery/image.jpg
  // -> dogahotel/gallery/image.jpg
  
  const patterns = [
    'oludenizdogahotel.b-cdn.net/',
    'dogahotelfethiye.s3.tebi.io/',
    's3.tebi.io/dogahotelfethiye/'
  ];
  
  for (const pattern of patterns) {
    if (url.includes(pattern)) {
      return url.split(pattern)[1];
    }
  }
  
  return null;
}

// Stream'i buffer'a dönüştür
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// Tek bir dosyayı taşı
async function migrateFile(filePath, index, total) {
  try {
    console.log(`\n[${index}/${total}] 📁 ${filePath}`);
    
    // 1. Tebi'den dosyayı indir
    console.log('   ⬇️  Tebi\'den indiriliyor...');
    
    const getCommand = new GetObjectCommand({
      Bucket: TEBI_CONFIG.bucket,
      Key: filePath
    });
    
    const tebiResponse = await tebiClient.send(getCommand);
    const fileBuffer = await streamToBuffer(tebiResponse.Body);
    
    console.log(`   ✓ İndirildi (${(fileBuffer.length / 1024).toFixed(2)} KB)`);
    
    // 2. Bunny'ye yükle
    console.log('   ⬆️  Bunny\'ye yükleniyor...');
    
    const putCommand = new PutObjectCommand({
      Bucket: BUNNY_CONFIG.storageZone,
      Key: filePath,
      Body: fileBuffer,
      ContentType: tebiResponse.ContentType || 'application/octet-stream'
    });
    
    await bunnyClient.send(putCommand);
    
    console.log('   ✅ Başarıyla yüklendi!');
    
    return { success: true, filePath, size: fileBuffer.length };
    
  } catch (error) {
    console.error(`   ❌ Hata: ${error.message}`);
    
    // Eğer dosya Tebi'de yoksa, zaten Bunny'de olabilir
    if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
      console.log('   ℹ️  Dosya Tebi\'de bulunamadı (zaten taşınmış olabilir)');
      return { success: false, filePath, error: 'NotFoundInTebi', skipped: true };
    }
    
    return { success: false, filePath, error: error.message };
  }
}

// Ana fonksiyon
async function main() {
  console.log('🚀 Tebi\'den Bunny.net\'e Dosya Migration Başlıyor...\n');
  
  // 1. Veritabanından tüm URL'leri al
  console.log('📊 Veritabanından URL\'ler alınıyor...');
  const urls = await getAllUrls();
  console.log(`✅ ${urls.length} adet URL bulundu\n`);
  
  // 2. URL'lerden dosya yollarını çıkar
  const filePaths = urls
    .map(url => extractFilePath(url))
    .filter(path => path !== null);
  
  const uniquePaths = [...new Set(filePaths)];
  console.log(`📁 ${uniquePaths.length} adet benzersiz dosya taşınacak\n`);
  
  console.log('Örnek dosyalar:');
  uniquePaths.slice(0, 5).forEach(path => console.log(`  - ${path}`));
  console.log('');
  
  // 3. Dosyaları taşı
  const results = {
    success: [],
    failed: [],
    skipped: []
  };
  
  let index = 0;
  for (const filePath of uniquePaths) {
    index++;
    const result = await migrateFile(filePath, index, uniquePaths.length);
    
    if (result.success) {
      results.success.push(result);
    } else if (result.skipped) {
      results.skipped.push(result);
    } else {
      results.failed.push(result);
    }
    
    // Her 10 dosyada bir özet
    if (index % 10 === 0) {
      console.log(`\n📊 İlerleme: ${index}/${uniquePaths.length}`);
      console.log(`   ✅ Başarılı: ${results.success.length}`);
      console.log(`   ⏭️  Atlanan: ${results.skipped.length}`);
      console.log(`   ❌ Başarısız: ${results.failed.length}\n`);
    }
  }
  
  // 4. Özet
  console.log('\n' + '='.repeat(60));
  console.log('🎉 MIGRATION TAMAMLANDI!\n');
  
  console.log('📊 ÖZET:');
  console.log(`   Toplam Dosya: ${uniquePaths.length}`);
  console.log(`   ✅ Başarılı: ${results.success.length}`);
  console.log(`   ⏭️  Atlanan: ${results.skipped.length} (Tebi'de bulunamadı)`);
  console.log(`   ❌ Başarısız: ${results.failed.length}`);
  
  const totalSize = results.success.reduce((sum, r) => sum + r.size, 0);
  console.log(`   📦 Toplam Boyut: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ BAŞARISIZ DOSYALAR:');
    results.failed.forEach(r => {
      console.log(`   - ${r.filePath}`);
      console.log(`     Hata: ${r.error}`);
    });
  }
  
  if (results.skipped.length > 0) {
    console.log('\n⏭️  ATLANAN DOSYALAR (Tebi\'de bulunamadı):');
    results.skipped.slice(0, 10).forEach(r => {
      console.log(`   - ${r.filePath}`);
    });
    if (results.skipped.length > 10) {
      console.log(`   ... ve ${results.skipped.length - 10} dosya daha`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length === 0) {
    console.log('\n✅ Tüm dosyalar başarıyla taşındı!');
    console.log('🌐 Artık siteniz Bunny.net CDN kullanıyor!');
  } else {
    console.log('\n⚠️  Bazı dosyalar taşınamadı. Lütfen yukarıdaki hataları kontrol edin.');
  }
}

main().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
