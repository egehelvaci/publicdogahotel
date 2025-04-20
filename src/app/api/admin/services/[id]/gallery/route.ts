import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../../../../lib/db';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

// Client arayüzü tanımlaması
interface DbClient {
  query: (query: string, params?: unknown[]) => Promise<unknown>;
  release: () => void;
}

interface ExecuteQueryResult {
  rows?: unknown[];
  rowCount?: number;
  client?: DbClient;
}

export const dynamic = 'force-dynamic';

// GET - Servisin galerisini getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const service = await prisma.service.findUnique({
      where: { id: params.id },
      include: { gallery: true }
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Hizmet bulunamadı' },
        { status: 404 }
      );
    }

    const gallery = service.gallery || [];

    return NextResponse.json(
      { success: true, data: gallery },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gallery verisi alınırken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri verileri alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Servis galerisine görsel ekle
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    const body = await request.json();
    
    if (!body.imageUrl) {
      return NextResponse.json(
        { error: 'Görsel URL\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Servisin var olup olmadığını kontrol et
    const serviceQuery = `
      SELECT * FROM services 
      WHERE id = $1
    `;
    
    const serviceResult = await executeQuery(serviceQuery, [serviceId]);
    
    if (serviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Servis bulunamadı' },
        { status: 404 }
      );
    }
    
    // Sıra numarasını belirle
    const orderQuery = `
      SELECT COALESCE(MAX(order_number), 0) + 1 as next_order
      FROM service_gallery
      WHERE service_id = $1
    `;
    
    const orderResult = await executeQuery(orderQuery, [serviceId]);
    const orderNumber = orderResult.rows[0].next_order;
    
    // Görseli ekle
    const insertQuery = `
      INSERT INTO service_gallery (
        id,
        service_id,
        image_url,
        order_number,
        created_at
      ) VALUES (
        $1, $2, $3, $4, CURRENT_TIMESTAMP
      ) RETURNING 
        id,
        service_id as "serviceId",
        image_url as "imageUrl",
        order_number as "order",
        created_at as "createdAt"
    `;
    
    const insertResult = await executeQuery(insertQuery, [
      uuidv4(), // Benzersiz bir UUID oluştur
      serviceId,
      body.imageUrl,
      body.order || orderNumber
    ]);
    
    return NextResponse.json(insertResult.rows[0], { status: 201 });
  } catch (error) {
    console.error('Servis galerisine görsel eklenirken hata:', error);
    return NextResponse.json(
      { error: 'Servis galerisine görsel eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Servis galerisinden görsel sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');
    
    if (!imageId) {
      return NextResponse.json(
        { error: 'Silinecek görselin ID\'si gereklidir' },
        { status: 400 }
      );
    }
    
    // Transaction başlat
    const beginResult = await executeQuery('BEGIN') as ExecuteQueryResult;
    const client = beginResult.client as DbClient;
    
    try {
      // Görselin var olup olmadığını kontrol et
      const checkQuery = `
        SELECT * FROM service_gallery
        WHERE id = $1 AND service_id = $2
      `;
      
      const checkResult = await client.query(checkQuery, [imageId, serviceId]);
      
      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { error: 'Silinecek görsel bulunamadı' },
          { status: 404 }
        );
      }
      
      // Görseli sil
      const deleteQuery = `
        DELETE FROM service_gallery
        WHERE id = $1
      `;
      
      await client.query(deleteQuery, [imageId]);
      
      // Sıra numaralarını güncelle
      const reorderQuery = `
        WITH ranked AS (
          SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
          FROM service_gallery
          WHERE service_id = $1
        )
        UPDATE service_gallery
        SET order_number = ranked.new_order
        FROM ranked
        WHERE service_gallery.id = ranked.id
      `;
      
      await client.query(reorderQuery, [serviceId]);
      
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
    console.error('Servis galerisinden görsel silinirken hata:', error);
    return NextResponse.json(
      { error: 'Servis galerisinden görsel silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT - Servis galerisini güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { gallery } = data;

    if (!Array.isArray(gallery)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz galeri verisi' },
        { status: 400 }
      );
    }

    const updatedService = await prisma.service.update({
      where: { id: params.id },
      data: {
        gallery: {
          deleteMany: {},
          create: gallery.map((imageUrl: string) => ({
            imageUrl
          }))
        }
      },
      include: { gallery: true }
    });

    return NextResponse.json(
      { success: true, data: updatedService.gallery },
      { status: 200 }
    );
  } catch (error) {
    console.error('Gallery güncellenirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri güncellenemedi' },
      { status: 500 }
    );
  }
}
