import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { notifyGalleryUpdated } from '../../websocket/route';

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

// GET - Tüm galeri öğelerini getir (admin için)
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/admin/gallery - Admin galeri öğeleri getiriliyor');
    
    // URL parametrelerini kontrol et
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';
    
    // Galeri öğelerini getir
    const galleryItems = await prisma.gallery.findMany({
      orderBy: {
        orderNumber: 'asc'
      },
      select: {
        id: true,
        imageUrl: true,
        videoUrl: true,
        titleTR: true,
        titleEN: true,
        descriptionTR: true,
        descriptionEN: true,
        orderNumber: true,
        type: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log('Galeri öğeleri başarıyla alındı:', galleryItems.length);
    
    return NextResponse.json(
      { 
        success: true, 
        items: galleryItems 
      },
      { 
        headers: {
          ...corsHeaders,
          ...cacheHeaders
        }
      }
    );
  } catch (error) {
    console.error('Admin galeri öğeleri alınırken hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Galeri öğeleri alınamadı',
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

// POST - Yeni galeri öğesi ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.imageUrl && !body.videoUrl) {
      return NextResponse.json(
        { success: false, message: 'En az bir görsel veya video URL\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Yeni galeri öğesi oluştur
    const newItem = await prisma.gallery.create({
      data: {
        imageUrl: body.imageUrl,
        videoUrl: body.videoUrl,
        titleTR: body.titleTR,
        titleEN: body.titleEN,
        descriptionTR: body.descriptionTR,
        descriptionEN: body.descriptionEN,
        orderNumber: body.orderNumber || 0,
        type: body.type || 'image'
      }
    });
    
    // WebSocket bildirimi gönder
    notifyGalleryUpdated();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Galeri öğesi başarıyla eklendi',
        item: newItem
      },
      { 
        status: 201,
        headers: {
          ...corsHeaders,
          ...cacheHeaders
        }
      }
    );
  } catch (error) {
    console.error('Galeri öğesi eklenirken hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Galeri öğesi eklenemedi',
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
