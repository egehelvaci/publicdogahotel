import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { notifyGalleryUpdated } from '../../websocket/route';
import { v4 as uuidv4 } from 'uuid';

// Dynamic API route
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET - Tüm galeri öğelerini getir (admin için)
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/gallery - Admin galeri öğeleri getiriliyor');
    
    // URL parametrelerini kontrol et
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';
    
    let whereClause = '';
    if (onlyActive) {
      whereClause = 'WHERE active = true';
    }
    
    const query = `
      SELECT 
        id, 
        image_url as "imageUrl", 
        video_url as "videoUrl", 
        title_tr as "titleTR", 
        title_en as "titleEN", 
        description_tr as "descriptionTR", 
        description_en as "descriptionEN", 
        order_number as "orderNumber", 
        type,
        active,
        category
      FROM gallery 
      ${whereClause}
      ORDER BY order_number ASC
    `;
    
    const result = await executeQuery(query);
    
    // Cache'lenmeyi engellemek için başlıklar
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return NextResponse.json(
      { success: true, items: result.rows },
      { headers }
    );
  } catch (error) {
    console.error('Admin galeri öğeleri alınırken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğeleri alınamadı' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

// POST - Yeni galeri öğesi ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if ((!body.imageUrl && !body.videoUrl) || !body.type) {
      return NextResponse.json(
        { success: false, message: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }
    
    // Sıra numarasını belirle
    const orderQuery = `
      SELECT COALESCE(MAX(order_number), 0) + 1 as next_order
      FROM gallery
    `;
    
    const orderResult = await executeQuery(orderQuery);
    const orderNumber = orderResult.rows[0].next_order;
    
    // Yeni ID oluştur
    const id = body.id || uuidv4();
    
    // Galeri öğesini ekle
    const insertQuery = `
      INSERT INTO gallery (
        id, 
        image_url, 
        video_url, 
        title_tr, 
        title_en, 
        description_tr, 
        description_en, 
        order_number, 
        type,
        active,
        category,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *
    `;
    
    const insertValues = [
      id,
      body.imageUrl || null,
      body.videoUrl || null,
      body.titleTR || '',
      body.titleEN || '',
      body.descriptionTR || '',
      body.descriptionEN || '',
      body.orderNumber || orderNumber,
      body.type,
      body.active !== undefined ? body.active : true,
      body.category || ''
    ];
    
    const result = await executeQuery(insertQuery, insertValues);
    
    // WebSocket bildirimi gönder
    notifyGalleryUpdated();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Galeri öğesi başarıyla eklendi', 
        item: result.rows[0] 
      },
      { 
        status: 201,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Galeri öğesi eklenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğesi eklenirken bir hata oluştu' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

// Sıralama işlemini yönetir
async function handleReorder(body: { items: Array<{ id: string; orderNumber: number }> }) {
  try {
    // Transaction başlat
    const client = await (await executeQuery('BEGIN') as any).client;
    
    try {
      // Her bir öğeyi sırayla güncelle
      for (const item of body.items) {
        const updateQuery = `
          UPDATE gallery
          SET order_number = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;
        
        await client.query(updateQuery, [item.orderNumber, item.id]);
      }
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      // WebSocket bildirimi gönder
      notifyGalleryUpdated();
      
      // Cache'lenmeyi engellemek için başlıklar
      const headers = new Headers({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      return NextResponse.json(
        { success: true, message: 'Sıralama başarıyla güncellendi' },
        { headers }
      );
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Sıralama güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Sıralama güncellenirken bir hata oluştu' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

// Bir sonraki sıra numarasını belirler
async function getNextOrderNumber(): Promise<number> {
  const query = `
    SELECT COALESCE(MAX(order_number), 0) + 1 as next_order
    FROM gallery
  `;
  
  const result = await executeQuery(query);
  return result.rows[0].next_order;
}

// Note: We will need POST, PUT, DELETE handlers here later
// to fully replace the fs logic from gallery.ts
