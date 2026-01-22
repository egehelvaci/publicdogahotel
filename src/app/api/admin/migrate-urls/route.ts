import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';

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

export async function POST(request: NextRequest) {
  console.log('🚀 URL Migration başlatılıyor...');
  
  const logs: string[] = [];
  let totalUpdated = 0;
  
  try {
    logs.push('📊 Tebi URL\'lerini Bunny.net URL\'leriyle değiştirme işlemi başlatılıyor...\n');
    
    for (const { table, columns } of TABLES_TO_UPDATE) {
      logs.push(`\n📋 Tablo: ${table}`);
      
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
            logs.push(`   ✓ ${column}: Tebi URL'si bulunamadı`);
            continue;
          }
          
          logs.push(`   ⚠️  ${column}: ${recordsWithTebi} kayıt Tebi URL'si içeriyor`);
          
          // Eski URL'leri göster
          logs.push(`   📝 Güncellenecek kayıtlar:`);
          checkResult.rows.forEach((row: any, index: number) => {
            logs.push(`      ${index + 1}. ID: ${row.id}`);
            logs.push(`         ESKİ: ${row[column]}`);
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
            
            const updateResult = await executeQuery(updateQuery);
            const updated = updateResult.rowCount || 0;
            
            if (updated > 0) {
              logs.push(`   ✅ ${column}: ${updated} kayıt güncellendi (pattern: ${pattern})`);
              
              // Güncellenmiş URL'leri göster
              updateResult.rows.forEach((row: any, index: number) => {
                logs.push(`      ${index + 1}. ID: ${row.id}`);
                logs.push(`         YENİ: ${row[column]}`);
              });
              
              totalUpdated += updated;
            }
          }
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logs.push(`   ❌ Hata (${table}.${column}): ${errorMessage}`);
          console.error(`Hata (${table}.${column}):`, error);
        }
      }
    }
    
    logs.push(`\n✅ Migration tamamlandı!`);
    logs.push(`📊 Toplam güncellenen kayıt sayısı: ${totalUpdated}`);
    
    // Son kontrol
    logs.push(`\n🔍 Final kontrol yapılıyor...\n`);
    
    let allClean = true;
    const remainingUrls: any[] = [];
    
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
            allClean = false;
            logs.push(`❌ ${table}.${column}: ${count} Tebi URL'si hala mevcut`);
            
            // Detaylı bilgi topla
            const detailQuery = await executeQuery(`
              SELECT id, ${column} 
              FROM ${table} 
              WHERE ${column} LIKE '%tebi.io%'
              LIMIT 3
            `);
            
            detailQuery.rows.forEach((row: any) => {
              remainingUrls.push({
                table,
                column,
                id: row.id,
                url: row[column]
              });
            });
          } else {
            logs.push(`✅ ${table}.${column}: Temiz`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logs.push(`❌ Final kontrol hatası (${table}.${column}): ${errorMessage}`);
        }
      }
    }
    
    if (allClean) {
      logs.push(`\n🎉 Tüm Tebi URL'leri başarıyla Bunny.net URL'leriyle değiştirildi!`);
    } else {
      logs.push(`\n⚠️  Bazı URL'ler hala Tebi formatında. Manuel kontrol gerekebilir.`);
    }
    
    return NextResponse.json({
      success: true,
      totalUpdated,
      allClean,
      remainingUrls,
      logs: logs.join('\n'),
      message: allClean 
        ? `✅ ${totalUpdated} URL başarıyla güncellendi!` 
        : `⚠️  ${totalUpdated} URL güncellendi, ancak ${remainingUrls.length} URL hala Tebi formatında`
    });
    
  } catch (error) {
    console.error('Migration hatası:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      logs: logs.join('\n')
    }, { status: 500 });
  }
}

// GET - Migration durumunu kontrol et
export async function GET(request: NextRequest) {
  const logs: string[] = [];
  
  try {
    logs.push('🔍 Tebi URL\'leri kontrol ediliyor...\n');
    
    const tebiUrls: any[] = [];
    let totalTebiUrls = 0;
    
    for (const { table, columns } of TABLES_TO_UPDATE) {
      for (const column of columns) {
        try {
          const checkQuery = `
            SELECT id, ${column} 
            FROM ${table} 
            WHERE ${column} LIKE '%tebi.io%'
          `;
          
          const checkResult = await executeQuery(checkQuery);
          const count = checkResult.rows.length;
          
          if (count > 0) {
            logs.push(`⚠️  ${table}.${column}: ${count} Tebi URL'si bulundu`);
            totalTebiUrls += count;
            
            checkResult.rows.forEach((row: any) => {
              tebiUrls.push({
                table,
                column,
                id: row.id,
                url: row[column]
              });
            });
          } else {
            logs.push(`✅ ${table}.${column}: Temiz`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logs.push(`❌ Kontrol hatası (${table}.${column}): ${errorMessage}`);
        }
      }
    }
    
    if (totalTebiUrls === 0) {
      logs.push(`\n🎉 Hiç Tebi URL'si bulunamadı! Tüm URL'ler Bunny.net formatında.`);
    } else {
      logs.push(`\n⚠️  Toplam ${totalTebiUrls} Tebi URL'si bulundu.`);
      logs.push(`\n💡 Migration için POST request gönderin.`);
    }
    
    return NextResponse.json({
      success: true,
      totalTebiUrls,
      needsMigration: totalTebiUrls > 0,
      tebiUrls,
      logs: logs.join('\n')
    });
    
  } catch (error) {
    console.error('Kontrol hatası:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      logs: logs.join('\n')
    }, { status: 500 });
  }
}
