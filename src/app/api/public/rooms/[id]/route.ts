import { NextResponse } from 'next/server';
import { executeQuery } from '../../../../../lib/db';

// Tüm API isteklerini dinamik olarak yap
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET - Belirli bir odayı ID'ye göre getir (sadece aktif odalar)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log('Oda detay API çağrıldı, ID:', id);
    
    // ID boş, null veya tanımsız ise hata dön
    if (!id) {
      console.error('Geçersiz ID:', id);
      return NextResponse.json(
        { success: false, message: 'Geçersiz oda ID' },
        { status: 400 }
      );
    }
    
    const query = `
      SELECT 
        r.id, 
        r.name_tr as "nameTR", 
        r.name_en as "nameEN", 
        r.description_tr as "descriptionTR", 
        r.description_en as "descriptionEN", 
        r.main_image_url as image, 
        r.main_image_url as "mainImageUrl",
        r.price_tr as "priceTR", 
        r.price_en as "priceEN", 
        r.capacity, 
        r.size, 
        r.features_tr as "featuresTR", 
        r.features_en as "featuresEN", 
        r.type, 
        r.room_type_id as "roomTypeId",
        r.order_number as "orderNumber",
        r.order_number as order,
        COALESCE(
          (SELECT json_agg(image_url ORDER BY order_number ASC)
           FROM room_gallery
           WHERE room_id = r.id), 
          '[]'::json
        ) as gallery
      FROM rooms r
      WHERE r.id = $1
    `;
    
    console.log('Oda verisi çekiliyor, ID:', id);
    const result = await executeQuery(query, [id]);
    
    if (!result.rows || result.rows.length === 0) {
      console.error('Oda bulunamadı, ID:', id);
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
          }
        }
      );
    }
    
    // SQL'den dönen sonuçları doğru formata çevir
    const room = result.rows[0];
    
    // features_tr ve features_en alanlarının dizi olduğundan emin ol
    // PostgreSQL'den gelen diziler {} formatında olabilir
    if (room.featuresTR && !Array.isArray(room.featuresTR)) {
      console.log('featuresTR diziye dönüştürülüyor:', room.featuresTR);
      try {
        if (typeof room.featuresTR === 'string') {
          // PostgreSQL'den gelen dizi formatını işle: {item1,item2}
          room.featuresTR = room.featuresTR.replace(/^\{|\}$/g, '').split(',');
        }
      } catch (error) {
        console.error('featuresTR dönüştürme hatası:', error);
        room.featuresTR = [];
      }
    }
    
    if (room.featuresEN && !Array.isArray(room.featuresEN)) {
      console.log('featuresEN diziye dönüştürülüyor:', room.featuresEN);
      try {
        if (typeof room.featuresEN === 'string') {
          // PostgreSQL'den gelen dizi formatını işle: {item1,item2}
          room.featuresEN = room.featuresEN.replace(/^\{|\}$/g, '').split(',');
        }
      } catch (error) {
        console.error('featuresEN dönüştürme hatası:', error);
        room.featuresEN = [];
      }
    }
    
    console.log('İşlenmiş oda verisi:', {
      ...room,
      featuresTR: room.featuresTR,
      featuresEN: room.featuresEN
    });
    
    // API yanıtı için önbellekleme önleyici başlıklar ekle
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    return NextResponse.json(
      { success: true, data: room },
      { headers }
    );
  } catch (error) {
    console.error('Oda verisi çekme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Oda verisi alınamadı' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );
  }
}
