import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../../../../lib/db';
import { prisma } from '../../../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

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

// GET - Servisin galerisini getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = params.id;
    
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
    
    // Servisin galerisini getir
    const galleryQuery = `
      SELECT 
        id,
        service_id as "serviceId",
        image_url as "imageUrl",
        order_number as "order",
        created_at as "createdAt"
      FROM service_gallery
      WHERE service_id = $1
      ORDER BY order_number ASC
    `;
    
    const galleryResult = await executeQuery(galleryQuery, [serviceId]);
    
    return NextResponse.json(galleryResult.rows);
  } catch (error) {
    console.error('Servis galerisi getirilirken hata:', error);
    return NextResponse.json(
      { error: 'Servis galerisi getirilirken bir hata oluştu' },
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Next.js 14+ için params'ı asenkron olarak işle
    const serviceId = params.id;
    console.log("İşlenecek servis ID:", serviceId);
    
    let body;
    try {
      body = await request.json();
      console.log("İstek gövdesi:", body);
      
      console.log('Servis galeri güncelleme isteği:', { 
        serviceId, 
        mainImage: body.image,
        imagesCount: body.images?.length || 0 
      });
    } catch (err) {
      console.error('İstek gövdesi alınamadı:', err);
      return NextResponse.json(
        { error: 'İstek gövdesi alınamadı', success: false },
        { status: 400 }
      );
    }
    
    // İstek validasyonu
    if (!body) {
      return NextResponse.json(
        { error: 'Boş istek gövdesi', success: false },
        { status: 400 }
      );
    }
    
    if (!body.images) {
      return NextResponse.json(
        { error: 'Görsel listesi gereklidir', success: false },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(body.images)) {
      return NextResponse.json(
        { error: 'Görsel listesi bir dizi olmalıdır', success: false },
        { status: 400 }
      );
    }
    
    // Görsel listesini filtrele - boş string, null, undefined değerleri temizle
    const validImages = body.images
      .filter(url => url && typeof url === 'string' && url.trim() !== '')
      .map(url => url.trim());
    
    console.log(`Filtreden sonra ${validImages.length} adet geçerli görsel URL'si kaldı`);
    
    if (validImages.length === 0) {
      return NextResponse.json(
        { error: 'Geçerli bir görsel bulunamadı', success: false },
        { status: 400 }
      );
    }
    
    // Ana görsel seçenekleri
    const mainImage = body.image || validImages[0];
    console.log("Seçilen ana görsel:", mainImage);
    
    try {
      // Bu kısım SQL sorgularını içeriyordu, Prisma'ya çevirdik
      // Servisi kontrol et
      const service = await prisma.service.findUnique({
        where: { id: serviceId }
      });
      
      if (!service) {
        return NextResponse.json(
          { error: 'Servis bulunamadı', success: false },
          { status: 404 }
        );
      }
      
      console.log("İşlem başlıyor");
      
      try {
        // Tam bir transaction içinde tüm veritabanı işlemlerini yapalım
        const result = await prisma.$transaction(async (tx) => {
          // 1. Ana görsel güncelleme
          const updatedService = await tx.service.update({
            where: { id: serviceId },
            data: {
              ...{
                "mainImageUrl": mainImage
              },
              updatedAt: new Date()
            }
          });
          
          console.log("Ana görsel güncellendi", updatedService);
          
          // 2. Eski galeri kayıtlarını silme
          await tx.serviceGallery.deleteMany({
            where: { serviceId }
          });
          
          console.log("Eski galeri kayıtları temizlendi");
          
          // 3. Yeni görselleri ekleme
          const galleryItems = [];
          
          for (let i = 0; i < validImages.length; i++) {
            const newItem = await tx.serviceGallery.create({
              data: {
                id: uuidv4(),
                serviceId,
                imageUrl: validImages[i],
                orderNumber: i + 1
              }
            });
            
            galleryItems.push(newItem);
          }
          
          console.log(`${galleryItems.length} adet yeni galeri öğesi eklendi`);
          
          return {
            service: updatedService,
            galleryItems: galleryItems
          };
        });
        
        console.log("İşlem başarıyla tamamlandı");
        
        // Başarılı yanıt
        return NextResponse.json({
          success: true,
          message: 'Servis galerisi başarıyla güncellendi',
          imageCount: validImages.length,
          mainImage,
          serviceId
        });
      } catch (error) {
        console.error("Prisma transaction hatası:", error);
        
        let errorDetail = error instanceof Error ? error.message : String(error);
        
        return NextResponse.json(
          { 
            error: 'Veritabanı güncellenirken bir hata oluştu', 
            detail: errorDetail,
            success: false 
          },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error("Genel veritabanı hatası:", error);
      
      return NextResponse.json(
        { 
          error: 'Servis galerisi güncellenirken bir hata oluştu', 
          detail: error instanceof Error ? error.message : String(error),
          success: false 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Genel hata:", error);
    
    return NextResponse.json(
      { 
        error: 'Beklenmeyen bir hata oluştu',
        detail: error instanceof Error ? error.message : String(error),
        success: false 
      },
      { status: 500 }
    );
  }
}
