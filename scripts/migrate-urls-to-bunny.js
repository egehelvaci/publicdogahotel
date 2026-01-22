/**
 * Tebi URL'lerini Bunny.net URL'leriyle değiştirme scripti
 * 
 * Bu script veritabanındaki tüm Tebi URL'lerini Bunny.net URL'leriyle değiştirir.
 * 
 * Kullanım:
 * node scripts/migrate-urls-to-bunny.js
 */

const { Client } = require('pg');

// Database bağlantısı
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Z9MCcdwu3YGb@ep-icy-bird-a2ty8aid-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';

// Eski ve yeni URL formatları
const OLD_TEBI_PATTERNS = [
  'dogahotelfethiye.s3.tebi.io',
  's3.tebi.io/dogahotelfethiye',
  'tebi.io'
];

const NEW_BUNNY_CDN = 'dogahotelolududeniz.b-cdn.net';

// Güncellenecek tablolar ve sütunlar
const TABLES_TO_UPDATE = [
  { table: 'about', columns: ['image_url'] },
  { table: 'about_sections', columns: ['image_url'] },
  { table: 'slider', columns: ['image_url', 'video_url'] },
  { table: 'gallery', columns: ['image_url', 'video_url'] },
  { table: 'services', columns: ['main_image_url'] },
  { table: 'service_gallery', columns: ['image_url'] },
  { table: 'rooms', columns: ['main_image_url'] },
  { table: 'room_gallery', columns: ['image_url'] },
];

async function executeQuery(client, query, params = []) {
  try {
    const result = await client.query(query, params);
    return result;
  } catch (error) {
    console.error('Query hatası:', error.message);
    throw error;
  }
}

async function migrateUrls() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Veritabanına bağlanıldı\n');
    
    console.log('🚀 Tebi URL\'lerini Bunny.net URL\'leriyle değiştirme işlemi başlatılıyor...\n');

    let totalUpdated = 0;

    for (const { table, columns } of TABLES_TO_UPDATE) {
      console.log(`📋 Tablo: ${table}`);
      
      for (const column of columns) {
        try {
          // Önce mevcut Tebi URL'lerini kontrol et
          const checkQuery = `
            SELECT id, ${column} 
            FROM ${table} 
            WHERE ${column} LIKE '%tebi.io%'
          `;
          
          const checkResult = await executeQuery(client, checkQuery);
          const recordsWithTebi = checkResult.rows.length;
          
          if (recordsWithTebi === 0) {
            console.log(`   ✓ ${column}: Tebi URL'si bulunamadı`);
            continue;
          }
          
          console.log(`   ⚠️  ${column}: ${recordsWithTebi} kayıt Tebi URL'si içeriyor`);
          
          // Önce kayıtları göster
          console.log(`   📝 Güncellenecek kayıtlar:`);
          checkResult.rows.forEach((row, index) => {
            console.log(`      ${index + 1}. ID: ${row.id}`);
            console.log(`         ESKİ: ${row[column]}`);
          });
          
          // URL'leri güncelle - her Tebi pattern'i için
          for (const pattern of OLD_TEBI_PATTERNS) {
            const updateQuery = `
              UPDATE ${table}
              SET ${column} = REPLACE(
                REPLACE(
                  REPLACE(${column}, 'https://${pattern}', 'https://${NEW_BUNNY_CDN}'),
                  'http://${pattern}', 'https://${NEW_BUNNY_CDN}'
                ),
                '${pattern}', '${NEW_BUNNY_CDN}'
              )
              WHERE ${column} LIKE '%${pattern}%'
              RETURNING id, ${column}
            `;
            
            const updateResult = await executeQuery(client, updateQuery);
            const updated = updateResult.rowCount || 0;
            
            if (updated > 0) {
              console.log(`   ✅ ${column}: ${updated} kayıt güncellendi (pattern: ${pattern})`);
              
              // Güncellenmiş URL'leri göster
              updateResult.rows.forEach((row, index) => {
                console.log(`      ${index + 1}. ID: ${row.id}`);
                console.log(`         YENİ: ${row[column]}`);
              });
              
              totalUpdated += updated;
            }
          }
          
          // Güncelleme sonrası kontrol
          const verifyQuery = `
            SELECT id, ${column} 
            FROM ${table} 
            WHERE ${column} LIKE '%tebi.io%'
          `;
          
          const verifyResult = await executeQuery(client, verifyQuery);
          const remainingTebi = verifyResult.rows.length;
          
          if (remainingTebi > 0) {
            console.log(`   ⚠️  UYARI: ${column}'da hala ${remainingTebi} Tebi URL'si var!`);
            console.log(`   Kalan URL'ler:`);
            verifyResult.rows.forEach((row) => {
              console.log(`      - ID: ${row.id}, URL: ${row[column]}`);
            });
          }
          
        } catch (error) {
          console.error(`   ❌ Hata (${table}.${column}):`, error.message);
        }
      }
      
      console.log('');
    }
    
    console.log('\n✅ Migration tamamlandı!');
    console.log(`📊 Toplam güncellenen kayıt sayısı: ${totalUpdated}`);
    
    // Son kontrol - tüm veritabanında kalan Tebi URL'lerini ara
    console.log('\n🔍 Final kontrol yapılıyor...\n');
    
    let allClean = true;
    
    for (const { table, columns } of TABLES_TO_UPDATE) {
      for (const column of columns) {
        try {
          const finalCheck = await executeQuery(client, `
            SELECT COUNT(*) as count 
            FROM ${table} 
            WHERE ${column} LIKE '%tebi.io%'
          `);
          
          const count = parseInt(finalCheck.rows[0]?.count || '0');
          
          if (count > 0) {
            allClean = false;
            console.log(`❌ ${table}.${column}: ${count} Tebi URL'si hala mevcut`);
            
            // Detaylı bilgi göster
            const detailQuery = await executeQuery(client, `
              SELECT id, ${column} 
              FROM ${table} 
              WHERE ${column} LIKE '%tebi.io%'
              LIMIT 5
            `);
            
            console.log('   Örnek URL\'ler:');
            detailQuery.rows.forEach((row) => {
              console.log(`   - ID: ${row.id}, URL: ${row[column]}`);
            });
          } else {
            console.log(`✅ ${table}.${column}: Temiz`);
          }
        } catch (error) {
          console.error(`❌ Final kontrol hatası (${table}.${column}):`, error.message);
        }
      }
    }
    
    if (allClean) {
      console.log('\n🎉 Tüm Tebi URL\'leri başarıyla Bunny.net URL\'leriyle değiştirildi!');
    } else {
      console.log('\n⚠️  Bazı URL\'ler hala Tebi formatında. Manuel kontrol gerekebilir.');
    }
    
  } catch (error) {
    console.error('\n❌ Script hatası:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n✅ Veritabanı bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
console.log('🚀 URL Migration Script Başlatılıyor...\n');
console.log(`📊 Veritabanı: ${DATABASE_URL.substring(0, 50)}...`);
console.log(`🔄 Eski URL Pattern: ${OLD_TEBI_PATTERNS.join(', ')}`);
console.log(`✨ Yeni CDN: ${NEW_BUNNY_CDN}\n`);

migrateUrls()
  .then(() => {
    console.log('\n✅ Script başarıyla tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script hatası:', error);
    process.exit(1);
  });
