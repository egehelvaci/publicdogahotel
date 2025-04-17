import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export interface ServiceItem {
  id: string;
  titleTR: string;
  titleEN: string;
  descriptionTR: string;
  descriptionEN: string;
  image: string;
  order: number;
  active: boolean;
  gallery?: string[];
}

// Tüm servisleri getir
export async function GET() {
  try {
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
      ORDER BY s.order_number ASC
    `;
    
    const result = await executeQuery(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Servis verileri getirilirken hata:", error);
    return NextResponse.json(
      { error: "Servis verileri getirilirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Yeni servis ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.titleTR || !body.titleEN || !body.descriptionTR || !body.descriptionEN || !body.image) {
      return NextResponse.json(
        { error: "Gerekli alanlar eksik" },
        { status: 400 }
      );
    }
    
    // Yeni ID oluştur
    const id = body.id || uuidv4();
    
    // Sıra numarasını belirle
    const orderQuery = `
      SELECT COALESCE(MAX(order_number), 0) + 1 as next_order
      FROM services
    `;
    
    const orderResult = await executeQuery(orderQuery);
    const orderNumber = orderResult.rows[0].next_order;
    
    // Transaction başlat
    const client = await (await executeQuery('BEGIN')).client;
    
    try {
      // Servisi ekle
      const insertQuery = `
        INSERT INTO services (
          id,
          title_tr,
          title_en,
          description_tr,
          description_en,
          image_url,
          order_number,
          active,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        ) RETURNING *
      `;
      
      const insertValues = [
        id,
        body.titleTR,
        body.titleEN,
        body.descriptionTR,
        body.descriptionEN,
        body.image,
        body.order || orderNumber,
        body.active !== undefined ? body.active : true
      ];
      
      const serviceResult = await client.query(insertQuery, insertValues);
      const newService = serviceResult.rows[0];
      
      // Galeri görsellerini ekle (eğer varsa)
      if (Array.isArray(body.gallery) && body.gallery.length > 0) {
        for (let i = 0; i < body.gallery.length; i++) {
          const galleryQuery = `
            INSERT INTO service_gallery (service_id, image_url, order_number)
            VALUES ($1, $2, $3)
          `;
          
          await client.query(galleryQuery, [id, body.gallery[i], i + 1]);
        }
      }
      
      // Transaction'ı tamamla
      await client.query('COMMIT');
      
      // Eklenen servisi galeri bilgisiyle birlikte getir
      const getQuery = `
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
      
      const finalResult = await executeQuery(getQuery, [id]);
      
      return NextResponse.json(finalResult.rows[0], { status: 201 });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Servis eklenirken hata:", error);
    return NextResponse.json(
      { error: "Servis eklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Servis sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Silinecek servisin ID'si gereklidir" },
        { status: 400 }
      );
    }

    // Transaction başlat
    const client = await (await executeQuery('BEGIN')).client;

    try {
    // Servisin var olup olmadığını kontrol et
      const checkQuery = `SELECT * FROM services WHERE id = $1`;
      const checkResult = await client.query(checkQuery, [id]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
      return NextResponse.json(
          { error: "Silinecek servis bulunamadı" },
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
      
      return NextResponse.json({ success: true });
    } catch (error) {
      // Hata durumunda geri al
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Servis silinirken hata:", error);
    return NextResponse.json(
      { error: "Servis silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
