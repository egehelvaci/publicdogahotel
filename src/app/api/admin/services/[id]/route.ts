import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { ServiceItem } from '../route';

// GET - Belirli bir servisi ID'ye göre getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    const query = `
      SELECT 
        s.id,
        s.title_tr as "titleTR",
        s.title_en as "titleEN",
        s.description_tr as "descriptionTR",
        s.description_en as "descriptionEN",
        s.image_url as image,
        s.order_number as order,
        s.active,
        COALESCE(
          (SELECT json_agg(sg.image_url)
           FROM service_gallery sg
           WHERE sg.service_id = s.id
           ORDER BY sg.order_number ASC),
          '[]'::json
        ) as gallery
      FROM services s
      WHERE s.id = $1
    `;
    
    const result = await executeQuery(query, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Servis bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Servis verisi getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Servis verisi getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Servisi güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    if (!body) {
      return NextResponse.json(
        { error: 'Geçersiz veri' },
        { status: 400 }
      );
    }
    
    const { title, description, gallery, order_number, color } = body;
    
    // Transaction başlat
    const beginResult = await executeQuery('BEGIN');
    const client = beginResult.client as any;
    
    try {
      // Servisin var olup olmadığını kontrol et
      const checkQuery = `
        SELECT * FROM services 
        WHERE id = $1
      `;
      
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Güncellenecek servis bulunamadı' },
          { status: 404 }
        );
      }
      
      // Servisi güncelle
      const updateQuery = `
        UPDATE services 
        SET 
          title = $1, 
          description = $2, 
          order_number = $3,
          color = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      
      const updateValues = [title, description, order_number, color, id];
      const updateResult = await client.query(updateQuery, updateValues);
      
      // Mevcut galeri öğelerini sil
      await client.query('DELETE FROM service_gallery WHERE service_id = $1', [id]);
      
      // Yeni galeri öğelerini ekle
      if (gallery && gallery.length > 0) {
        for (let i = 0; i < gallery.length; i++) {
          const item = gallery[i];
          const insertGalleryQuery = `
            INSERT INTO service_gallery (
              service_id, image, video_url, title, description, order_number, type
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          
          const galleryValues = [
            id, 
            item.image || null, 
            item.videoUrl || null, 
            item.title || null, 
            item.description || null, 
            i + 1, 
            item.type || 'image'
          ];
          
          await client.query(insertGalleryQuery, galleryValues);
        }
      }
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Servis başarıyla güncellendi',
        service: updateResult.rows[0]
      });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Servis güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Servis güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Servisi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Transaction başlat
    const beginResult = await executeQuery('BEGIN');
    const client = beginResult.client as any;
    
    try {
      // Servisin var olup olmadığını kontrol et
      const checkQuery = `
        SELECT * FROM services 
        WHERE id = $1
      `;
      
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Silinecek servis bulunamadı' },
          { status: 404 }
        );
      }
      
      // Önce servise ait galeri öğelerini sil
      await client.query('DELETE FROM service_gallery WHERE service_id = $1', [id]);
      
      // Servisi sil
      await client.query('DELETE FROM services WHERE id = $1', [id]);
      
      // Sıra numaralarını güncelle
      const reorderQuery = `
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
          FROM services
        )
        UPDATE services
        SET order_number = ranked.new_order,
            updated_at = CURRENT_TIMESTAMP
        FROM ranked
        WHERE services.id = ranked.id
      `;
      
      await client.query(reorderQuery);
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      return NextResponse.json({ success: true, message: 'Servis başarıyla silindi' });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Servis silme hatası:', error);
    return NextResponse.json(
      { error: 'Servis silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 