import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../../../lib/db';
import { uploadToBunny } from '../../../lib/bunny';
import { notifyGalleryUpdated } from '../websocket/route';

// Galeri öğesi arayüzü
export interface GalleryItem {
  id: string;
  image?: string;
  image_url?: string;
  video_url?: string;
  videoUrl?: string; 
  title?: string;
  title_tr?: string;
  description?: string;
  description_tr?: string;
  order?: number;
  order_number?: number;
  type: 'image' | 'video';
}

// Dinamik API rotası - içeriğin önbelleğe alınmamasını sağlar
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET - Tüm galeri öğelerini getir
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/gallery - Galeri öğeleri getiriliyor');
    
    // Parametreleri kontrol et
    console.log('Parametreler: Yok');
    
    // Aktif medya içeriklerini getir
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
        type
      FROM gallery 
      ORDER BY order_number ASC
    `;
    
    console.log('SQL sorgusu çalıştırılıyor:', query);
    const result = await executeQuery(query);
    
    console.log(`${result.rows.length} galeri öğesi bulundu`);
    
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
    console.error('Galeri verisi çekilirken hata:', error);
    console.error('Detaylı hata:', (error as Error).message);
    console.error('SQL sorgusu hatası:', error);
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

// POST: Yeni galeri öğesi ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Gallery API POST: Yeni galeri öğesi ekleniyor', body);
    
    // Gerekli alanları kontrol et
    if (!body.image && !body.image_url && !body.videoUrl && !body.video_url) {
      return NextResponse.json(
        { error: 'Görsel veya video URL alanı gereklidir' },
        { status: 400 }
      );
    }

    // Öğe türünü belirle
    const isVideo = body.videoUrl || body.video_url ? true : false;
    const itemType = isVideo ? 'video' : 'image';
    
    // ID hazırla
    const id = body.id || uuidv4();
    
    // Mevcut sıra numaralarını kontrol et
    const orderResult = await executeQuery(`
      SELECT COALESCE(MAX(order_number), 0) + 1 as next_order FROM gallery
    `) as any;
    
    const nextOrder = body.order !== undefined ? body.order : 
                     (orderResult.rows && orderResult.rows[0] ? orderResult.rows[0].next_order : 1);
    
    // Yeni galeri öğesini ekle
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
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      ) RETURNING *
    `;
    
    const imageUrl = body.image || body.image_url || null;
    const videoUrl = body.videoUrl || body.video_url || null;
    
    const insertResult = await executeQuery(insertQuery, [
      id,
      isVideo ? null : imageUrl,
      isVideo ? videoUrl || imageUrl : null,
      body.title || body.title_tr || '',
      body.title_en || '',
      body.description || body.description_tr || '',
      body.description_en || '',
      nextOrder,
      body.type || itemType
    ]) as any;
    
    if (!insertResult || !insertResult.rows || insertResult.rows.length === 0) {
      throw new Error('Galeri öğesi eklenemedi');
    }
    
    const newItem = insertResult.rows[0];
    console.log('Gallery API: Galeri öğesi başarıyla eklendi', newItem);
    
    // Cache'i yenile
    revalidatePath('/gallery');
    revalidatePath('/admin/gallery');
    
    // API yanıt formatı için mapleme
    const formattedItem = {
      id: newItem.id,
      image: newItem.image_url,
      image_url: newItem.image_url,
      videoUrl: newItem.video_url,
      video_url: newItem.video_url,
      title: newItem.title_tr,
      title_tr: newItem.title_tr,
      title_en: newItem.title_en,
      description: newItem.description_tr,
      description_tr: newItem.description_tr,
      description_en: newItem.description_en,
      order: newItem.order_number,
      order_number: newItem.order_number,
      type: newItem.type,
      created_at: newItem.created_at,
      updated_at: newItem.updated_at
    };
    
    return NextResponse.json(formattedItem, { status: 201 });
  } catch (error) {
    console.error('Galeri öğesi eklenirken hata:', error);
    return NextResponse.json(
      { error: 'Galeri öğesi eklenirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
}

// DELETE: Galeri öğesini sil
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Silinecek galeri öğesinin ID'si gereklidir" },
        { status: 400 }
      );
    }
    
    // Silinecek öğeyi kontrol et
    const checkQuery = `SELECT * FROM gallery WHERE id = $1`;
    const checkResult = await executeQuery(checkQuery, [id]) as any;
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Silinecek galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // Öğeyi sil
    const deleteQuery = `DELETE FROM gallery WHERE id = $1 RETURNING *`;
    const deleteResult = await executeQuery(deleteQuery, [id]) as any;
    
    if (!deleteResult.rows || deleteResult.rows.length === 0) {
      throw new Error('Galeri öğesi silinemedi');
    }
    
    // Cache'i yenile
    revalidatePath('/gallery');
    revalidatePath('/admin/gallery');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Galeri öğesi başarıyla silindi',
      id
    });
  } catch (error) {
    console.error('Galeri öğesi silinirken hata:', error);
    return NextResponse.json(
      { error: 'Galeri öğesi silinirken bir hata oluştu: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata') },
      { status: 500 }
    );
  }
}
