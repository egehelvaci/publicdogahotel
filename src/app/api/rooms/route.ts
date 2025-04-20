import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyRoomsUpdated } from '../websocket/route';
import { v4 as uuidv4 } from 'uuid';

// Define a basic interface for Room items based on usage (Add export)
export interface RoomItem {
  id: string;
  nameTR: string;
  nameEN: string;
  descriptionTR: string;
  descriptionEN: string;
  image: string;
  priceTR: string;
  priceEN: string;
  capacity: number;
  size: number;
  featuresTR: string[];
  featuresEN: string[];
  gallery: string[];
  type: string;
  roomTypeId?: string;
  active: boolean;
  order: number;
}

// Veritabanı sorgu sonucu için yardımcı tip
interface QueryResult<T> {
  rows: T[];
  rowCount: number;
  client: any;
  release: () => void;
}

// Dynamic API route
export const dynamic = 'force-dynamic';

// CORS ve cache ayarları
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const cacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// GET - Tüm aktif odaları getir
export async function GET(request: Request) {
  try {
    console.log('API: Tüm odaları getirme isteği alındı');
    
    // Prisma ile odaları getir
    const rooms = await prisma.room.findMany({
      where: {
        active: true
      },
      include: {
        gallery: {
          orderBy: {
            orderNumber: 'asc'
          }
        }
      },
      orderBy: {
        orderNumber: 'asc'
      }
    });

    // Galeri URL'lerini dönüştür
    const processedRooms = rooms.map(room => ({
      id: room.id,
      nameTR: room.nameTR,
      nameEN: room.nameEN,
      descriptionTR: room.descriptionTR,
      descriptionEN: room.descriptionEN,
      mainImageUrl: room.mainImageUrl,
      image: room.mainImageUrl,
      priceTR: room.priceTR,
      priceEN: room.priceEN,
      capacity: room.capacity,
      size: room.size,
      featuresTR: room.featuresTR,
      featuresEN: room.featuresEN,
      type: room.type,
      gallery: room.gallery.map(g => g.imageUrl),
      active: room.active,
      orderNumber: room.orderNumber
    }));
    
    console.log(`API: ${processedRooms.length} oda verisi döndürülüyor`);
    
    return NextResponse.json(
      { success: true, data: processedRooms },
      { 
        headers: {
          ...corsHeaders,
          ...cacheHeaders
        }
      }
    );
  } catch (error) {
    console.error('Odalar getirilirken hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Odalar getirilemedi',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          ...cacheHeaders
        }
      }
    );
  }
}

// POST - Yeni oda ekle
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.nameTR || !body.nameEN || !body.descriptionTR || !body.descriptionEN || !body.image) {
      return NextResponse.json(
        { success: false, message: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Sıra numarasını belirle
    const orderQuery = `
      SELECT COALESCE(MAX(order_number), 0) + 1 as next_order
      FROM rooms
    `;
    
    const orderResult = await executeQuery(orderQuery) as any;
    const orderNumber = orderResult.rows[0].next_order as number;

    // Yeni ID oluştur
    const id = body.id || uuidv4();

    // Transaction başlat
    const client = await (await executeQuery('BEGIN') as any).client;
    
    try {
      // Odayı ekle
      const insertQuery = `
        INSERT INTO rooms (
          id, 
          name_tr, 
          name_en, 
          description_tr, 
          description_en, 
          main_image_url, 
          price_tr, 
          price_en, 
          capacity, 
          size, 
          features_tr, 
          features_en, 
          type, 
          room_type_id,
          order_number,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;
      
      const featuresTR = Array.isArray(body.featuresTR) ? body.featuresTR : [];
      const featuresEN = Array.isArray(body.featuresEN) ? body.featuresEN : [];
      
      const insertValues = [
        id,
        body.nameTR,
        body.nameEN,
        body.descriptionTR,
        body.descriptionEN,
        body.image,
        body.priceTR || '₺0',
        body.priceEN || '€0',
        body.capacity || 2,
        body.size || 25,
        JSON.stringify(featuresTR),
        JSON.stringify(featuresEN),
        body.type || 'standard',
        body.roomTypeId || null,
        body.order || orderNumber
      ];
      
      const roomResult = await client.query(insertQuery, insertValues);
      const newRoom = roomResult.rows[0];
      
      // Galeri görsellerini ekle
      if (Array.isArray(body.gallery) && body.gallery.length > 0) {
        for (let i = 0; i < body.gallery.length; i++) {
          const galleryQuery = `
            INSERT INTO room_gallery (room_id, image_url, order_number)
            VALUES ($1, $2, $3)
          `;
          
          await client.query(galleryQuery, [id, body.gallery[i], i + 1]);
        }
      } else if (body.image) {
        // Ana görsel galeri öğesi olarak da ekle
        const galleryQuery = `
          INSERT INTO room_gallery (room_id, image_url, order_number)
          VALUES ($1, $2, $3)
        `;
        
        await client.query(galleryQuery, [id, body.image, 1]);
      }
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      // WebSocket bildirimi gönder
      notifyRoomsUpdated();
      
      // Eklenen odayı galeri bilgisiyle birlikte getir
      const getQuery = `
        SELECT 
          r.id, 
          r.name_tr as "nameTR", 
          r.name_en as "nameEN", 
          r.description_tr as "descriptionTR", 
          r.description_en as "descriptionEN", 
          r.main_image_url as image, 
          r.price_tr as "priceTR", 
          r.price_en as "priceEN", 
          r.capacity, 
          r.size, 
          r.features_tr as "featuresTR", 
          r.features_en as "featuresEN", 
          r.type, 
          r.room_type_id as "roomTypeId",
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
      
      const finalResult = await executeQuery(getQuery, [id]) as any;
      
      return NextResponse.json(
        { success: true, data: finalResult.rows[0], message: 'Oda başarıyla eklendi' },
        { status: 201 }
      );
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Oda eklerken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Oda eklenemedi', error: String(error) },
      { status: 500 }
    );
  }
}
