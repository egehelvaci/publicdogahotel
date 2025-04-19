import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../lib/db';
import { notifyGalleryUpdated } from '../../websocket/route';

// Dinamik API rotası
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// GET - ID'ye göre galeri öğesi getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`GET /api/gallery/${id} - Galeri öğesi getiriliyor`);
    
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
      WHERE id = $1
    `;
    
    const result = await executeQuery(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Galeri öğesi bulunamadı' },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Cache'lenmeyi engellemek için başlıklar
    const headers = new Headers({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return NextResponse.json(
      { success: true, item: result.rows[0] },
      { headers }
    );
  } catch (error) {
    console.error('Galeri öğesi getirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğesi getirilirken bir hata oluştu' },
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

// PUT: ID'ye göre galeri öğesi güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log(`PUT /api/gallery/${id} - Galeri öğesi güncelleniyor`);
    
    // Güncellenecek alanları belirle
    const updateFields = [];
    const updateValues = [];
    let paramCounter = 1;
    
    if (body.imageUrl !== undefined) {
      updateFields.push(`image_url = $${paramCounter++}`);
      updateValues.push(body.imageUrl);
    }
    
    if (body.videoUrl !== undefined) {
      updateFields.push(`video_url = $${paramCounter++}`);
      updateValues.push(body.videoUrl);
    }
    
    if (body.titleTR !== undefined) {
      updateFields.push(`title_tr = $${paramCounter++}`);
      updateValues.push(body.titleTR);
    }
    
    if (body.titleEN !== undefined) {
      updateFields.push(`title_en = $${paramCounter++}`);
      updateValues.push(body.titleEN);
    }
    
    if (body.descriptionTR !== undefined) {
      updateFields.push(`description_tr = $${paramCounter++}`);
      updateValues.push(body.descriptionTR);
    }
    
    if (body.descriptionEN !== undefined) {
      updateFields.push(`description_en = $${paramCounter++}`);
      updateValues.push(body.descriptionEN);
    }
    
    if (body.type !== undefined) {
      updateFields.push(`type = $${paramCounter++}`);
      updateValues.push(body.type);
    }
    
    if (body.orderNumber !== undefined) {
      updateFields.push(`order_number = $${paramCounter++}`);
      updateValues.push(body.orderNumber);
    }
    
    // Güncellenecek alan yoksa hata döndür
    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Güncellenecek alan bulunamadı' },
        { status: 400 }
      );
    }
    
    // Sorgu oluştur
    updateValues.push(id); // ID değerini ekle - son parametre olarak
    const query = `
      UPDATE gallery 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCounter}
      RETURNING *
    `;
    
    const result = await executeQuery(query, updateValues);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // WebSocket bildirimi gönder
    notifyGalleryUpdated();
    
    return NextResponse.json(
      { success: true, item: result.rows[0] },
      { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Galeri öğesi güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğesi güncellenirken bir hata oluştu' },
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

// DELETE: ID'ye göre galeri öğesi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log(`DELETE /api/gallery/${id} - Galeri öğesi siliniyor`);
    
    // Önce galeri öğesini kontrol et
    const checkQuery = `SELECT * FROM gallery WHERE id = $1`;
    const checkResult = await executeQuery(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // Galeri öğesini sil
    const deleteQuery = `DELETE FROM gallery WHERE id = $1 RETURNING *`;
    const result = await executeQuery(deleteQuery, [id]);
    
    // WebSocket bildirimi gönder
    notifyGalleryUpdated();
    
    return NextResponse.json(
      { success: true, message: 'Galeri öğesi başarıyla silindi', item: result.rows[0] },
      { 
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Galeri öğesi silinirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğesi silinirken bir hata oluştu' },
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
