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
        type,
        active,
        category
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
    
    // Güncellenecek verileri hazırla
    const updateData = {
      titleTR: body.titleTR,
      titleEN: body.titleEN,
      descriptionTR: body.descriptionTR,
      descriptionEN: body.descriptionEN,
      type: body.type,
    };
    
    // İsteğe bağlı alanları kontrol et
    if (body.imageUrl) {
      updateData['imageUrl'] = body.imageUrl;
    }
    
    if (body.videoUrl !== undefined) {
      updateData['videoUrl'] = body.videoUrl;
    }
    
    // Galeri öğesini güncelle
    const updatedItem = await prisma.gallery.update({
      where: { id },
      data: updateData,
    });
    
    // Bildirim gönder
    notifyGalleryUpdated();
    
    return NextResponse.json({
      success: true,
      message: 'Galeri öğesi başarıyla güncellendi',
      item: updatedItem,
    });
  } catch (error) {
    console.error('Galeri öğesi güncellenirken hata:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Galeri öğesi güncellenirken bir hata oluştu',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
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
    
    // Belirtilen ID'ye sahip galeri öğesini sil
    await prisma.gallery.delete({
      where: { id },
    });
    
    // Bildirim gönder
    notifyGalleryUpdated();
    
    return NextResponse.json({
      success: true,
      message: 'Galeri öğesi başarıyla silindi',
    });
  } catch (error) {
    console.error('Galeri öğesi silinirken hata:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Galeri öğesi silinirken bir hata oluştu',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
