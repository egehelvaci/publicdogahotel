const { Client } = require('pg');

const DATABASE_URL = 'postgresql://neondb_owner:npg_Z9MCcdwu3YGb@ep-icy-bird-a2ty8aid-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const OLD_TEBI_PATTERNS = [
  'dogahotelfethiye.s3.tebi.io',
  's3.tebi.io/dogahotelfethiye',
];

const NEW_BUNNY_CDN = 'oludenizdogahotel.b-cdn.net';

const TABLES_TO_UPDATE = [
  { table: 'about', column: 'image_url' },
  { table: 'about_sections', column: 'image_url' },
  { table: 'slider', column: 'image_url' },
  { table: 'slider', column: 'video_url' },
  { table: 'gallery', column: 'image_url' },
  { table: 'gallery', column: 'video_url' },
  { table: 'services', column: 'main_image_url' },
  { table: 'service_gallery', column: 'image_url' },
  { table: 'rooms', column: 'main_image_url' },
  { table: 'room_gallery', column: 'image_url' },
];

async function main() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Veritabanına bağlanılıyor...\n');
    await client.connect();
    console.log('✅ Bağlantı başarılı!\n');

    let totalUpdated = 0;

    for (const { table, column } of TABLES_TO_UPDATE) {
      console.log(`📋 ${table}.${column} kontrol ediliyor...`);
      
      // Önce kaç tane var kontrol et
      const checkResult = await client.query(
        `SELECT COUNT(*) as count FROM ${table} WHERE ${column} LIKE '%tebi.io%'`
      );
      
      const count = parseInt(checkResult.rows[0].count);
      
      if (count === 0) {
        console.log(`   ✓ Tebi URL'si yok\n`);
        continue;
      }
      
      console.log(`   ⚠️  ${count} adet Tebi URL'si bulundu`);
      
      // Örnekleri göster
      const examples = await client.query(
        `SELECT id, ${column} FROM ${table} WHERE ${column} LIKE '%tebi.io%' LIMIT 2`
      );
      
      examples.rows.forEach(row => {
        console.log(`      ESKİ: ${row[column]}`);
      });
      
      // Güncelle
      const updateQuery = `
        UPDATE ${table}
        SET ${column} = REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(${column}, 'https://dogahotelfethiye.s3.tebi.io', 'https://${NEW_BUNNY_CDN}'),
              'http://dogahotelfethiye.s3.tebi.io', 'https://${NEW_BUNNY_CDN}'
            ),
            'https://s3.tebi.io/dogahotelfethiye', 'https://${NEW_BUNNY_CDN}'
          ),
          'dogahotelfethiye.s3.tebi.io', '${NEW_BUNNY_CDN}'
        )
        WHERE ${column} LIKE '%tebi.io%'
      `;
      
      const result = await client.query(updateQuery);
      console.log(`   ✅ ${result.rowCount} kayıt güncellendi`);
      
      // Yeni URL'leri göster
      const updated = await client.query(
        `SELECT id, ${column} FROM ${table} WHERE ${column} LIKE '%${NEW_BUNNY_CDN}%' LIMIT 2`
      );
      
      updated.rows.forEach(row => {
        console.log(`      YENİ: ${row[column]}`);
      });
      
      totalUpdated += result.rowCount;
      console.log('');
    }

    console.log(`\n🎉 Migration tamamlandı!`);
    console.log(`📊 Toplam ${totalUpdated} URL güncellendi\n`);

    // Final kontrol
    console.log('🔍 Final kontrol...\n');
    
    for (const { table, column } of TABLES_TO_UPDATE) {
      const check = await client.query(
        `SELECT COUNT(*) as count FROM ${table} WHERE ${column} LIKE '%tebi.io%'`
      );
      
      const remaining = parseInt(check.rows[0].count);
      
      if (remaining > 0) {
        console.log(`❌ ${table}.${column}: ${remaining} Tebi URL'si kaldı!`);
      } else {
        console.log(`✅ ${table}.${column}: Temiz`);
      }
    }

    console.log('\n✅ İşlem tamamlandı!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Bağlantı kapatıldı');
  }
}

main().catch(console.error);
