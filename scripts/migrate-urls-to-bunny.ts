/**
 * Tebi URL'lerini Bunny.net URL'leriyle değiştirme scripti
 * 
 * Bu script veritabanındaki tüm Tebi URL'lerini Bunny.net URL'leriyle değiştirir.
 * 
 * Kullanım:
 * npx ts-node scripts/migrate-urls-to-bunny.ts
 */

import { executeQuery } from '../src/lib/db';

// Eski ve yeni URL formatları
const OLD_TEBI_PATTERNS = [
  'dogahotelfethiye.s3.tebi.io',
  's3.tebi.io/dogahotelfethiye',
  'tebi.io'
];

const NEW_BUNNY_CDN = 'oludenizdogahotel.b-cdn.net';

interface TableInfo {
  table: string;
  columns: string[];
}

// Güncellenecek tablolar ve sütunlar
const TABLES_TO_UPDATE: TableInfo[] = [
  { table: 'about', columns: ['image_url'] },
  { table: 'about_sections', columns: ['image_url'] },
  { table: 'slider', columns: ['image_url', 'video_url'] },
  { table: 'gallery', columns: ['image_url', 'video_url'] },
  { table: 'services', columns: ['main_image_url'] },
  { table: 'service_gallery', columns: ['image_url'] },
  { table: 'rooms', columns: ['main_image_url'] },
  { table: 'room_gallery', columns: ['image_url'] },
];

async function migrateUrls() {
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
        
        const checkResult = await executeQuery(checkQuery);
        const recordsWithTebi = checkResult.rows.length;
        
        if (recordsWithTebi === 0) {
          console.log(`   ✓ ${column}: Tebi URL'si bulunamadı`);
          continue;
        }
        
        console.log(`   ⚠️  ${column}: ${recordsWithTebi} kayıt Tebi URL'si içeriyor`);
        
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
          `;
          
          const updateResult = await executeQuery(updateQuery);
          const updated = updateResult.rowCount || 0;
          
          if (updated > 0) {
            console.log(`   ✅ ${column}: ${updated} kayıt güncellendi (pattern: ${pattern})`);
            totalUpdated += updated;
          }
        }
        
        // Güncelleme sonrası kontrol
        const verifyQuery = `
          SELECT id, ${column} 
          FROM ${table} 
          WHERE ${column} LIKE '%tebi.io%'
        `;
        
        const verifyResult = await executeQuery(verifyQuery);
        const remainingTebi = verifyResult.rows.length;
        
        if (remainingTebi > 0) {
          console.log(`   ⚠️  UYARI: ${column}'da hala ${remainingTebi} Tebi URL'si var!`);
          console.log(`   Kalan URL'ler:`, verifyResult.rows);
        }
        
      } catch (error) {
        console.error(`   ❌ Hata (${table}.${column}):`, error);
      }
    }
    
    console.log('');
  }
  
  console.log('\n✅ Migration tamamlandı!');
  console.log(`📊 Toplam güncellenen kayıt sayısı: ${totalUpdated}`);
  
  // Son kontrol - tüm veritabanında kalan Tebi URL'lerini ara
  console.log('\n🔍 Final kontrol yapılıyor...\n');
  
  for (const { table, columns } of TABLES_TO_UPDATE) {
    for (const column of columns) {
      try {
        const finalCheck = await executeQuery(`
          SELECT COUNT(*) as count 
          FROM ${table} 
          WHERE ${column} LIKE '%tebi.io%'
        `);
        
        const count = parseInt(finalCheck.rows[0]?.count || '0');
        
        if (count > 0) {
          console.log(`❌ ${table}.${column}: ${count} Tebi URL'si hala mevcut`);
          
          // Detaylı bilgi göster
          const detailQuery = await executeQuery(`
            SELECT id, ${column} 
            FROM ${table} 
            WHERE ${column} LIKE '%tebi.io%'
            LIMIT 5
          `);
          
          console.log('   Örnek URL\'ler:');
          detailQuery.rows.forEach((row: any) => {
            console.log(`   - ID: ${row.id}, URL: ${row[column]}`);
          });
        } else {
          console.log(`✅ ${table}.${column}: Temiz`);
        }
      } catch (error) {
        console.error(`❌ Final kontrol hatası (${table}.${column}):`, error);
      }
    }
  }
  
  console.log('\n🎉 İşlem tamamlandı!');
}

// Script'i çalıştır
migrateUrls()
  .then(() => {
    console.log('\n✅ Script başarıyla tamamlandı');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script hatası:', error);
    process.exit(1);
  });
