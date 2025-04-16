import { NextRequest, NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Medya yükleme başlatıldı');
    
    // Formdata'yı al
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file) {
      console.error('Dosya bulunamadı');
      return NextResponse.json(
        { success: false, message: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    console.log(`Yüklenen dosya: ${file.name}, Boyut: ${file.size} bytes, Tip: ${file.type}`);

    // Dosya uzantısını doğrula - sadece görsel formatları kabul et
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    
    if (!allowedImageTypes.includes(file.type)) {
      console.error(`Desteklenmeyen dosya formatı: ${file.type}`);
      return NextResponse.json(
        { success: false, message: 'Geçersiz dosya formatı. Yalnızca JPEG, PNG, WebP formatları desteklenir.' },
        { status: 400 }
      );
    }

    // Dosya boyutunu kontrol et (görsel için 25MB)
    const maxSizeImage = 25 * 1024 * 1024; // 25MB
    
    if (file.size > maxSizeImage) {
      console.error(`Dosya boyutu çok büyük: ${file.size} bytes`);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Dosya boyutu çok büyük. Maksimum 25MB desteklenir.'
        },
        { status: 400 }
      );
    }

    // Dosya içeriğini al
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Cloudinary'ye yükle
    const fileUrl = await uploadToCloudinary(fileBuffer, 'dogahotel/gallery');
    
    if (!fileUrl) {
      return NextResponse.json(
        { success: false, message: 'Cloudinary\'ye dosya yükleme başarısız' },
        { status: 500 }
      );
    }
    
    console.log(`Cloudinary'ye yüklendi. URL: ${fileUrl}`);

    // Veritabanına ekle
    const insertQuery = `
      INSERT INTO gallery (
        title_tr, title_en, description_tr, description_en, image_url, order_number
      ) VALUES (
        $1, $2, $3, $4, $5, 
        (SELECT COALESCE(MAX(order_number), 0) + 1 FROM gallery)
      ) RETURNING *;
    `;
    
    const result = await executeQuery(insertQuery, [
      title || '', // title_tr
      title || '', // title_en
      description || '', // description_tr
      description || '', // description_en
      fileUrl // image_url
    ]);
    
    const newItem = result.rows[0];
    console.log('Medya yükleme işlemi tamamlandı');
    
    return NextResponse.json({ 
      success: true,
      item: newItem,
      message: 'Görsel başarıyla yüklendi'
    });
  } catch (error) {
    console.error('Medya yükleme hatası:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Dosya yüklenirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 