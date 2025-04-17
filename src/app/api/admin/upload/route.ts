import { NextRequest, NextResponse } from 'next/server';
import { uploadToImageKit } from '@/lib/imagekitServer';

// Yüklenebilecek maksimum dosya boyutu (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// İzin verilen dosya tipleri
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    // İstek formunu al
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'services';

    // Dosya kontrolü
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya formatı. Sadece JPEG, PNG, WebP, JPG ve GIF formatları desteklenir.' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu 10MB\'ı geçemez' },
        { status: 400 }
      );
    }
    
    // Dosya içeriğini al
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Dosya adını oluştur
    const originalName = file.name;
    
    // ImageKit klasörünü belirle
    const imageKitFolder = `dogahotel/${folder}`;
    
    // ImageKit'e yükle
    const result = await uploadToImageKit(buffer, originalName, imageKitFolder);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Dosya yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }
    
    // Başarılı yanıt döndür
    return NextResponse.json({
      success: true,
      filePath: result.url,
      url: result.url,
      fileId: result.fileId,
      fileName: originalName,
      fileType: result.fileType
    });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 