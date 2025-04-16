import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Yüklenebilecek maksimum dosya boyutu (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;
// İzin verilen dosya tipleri
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'slider';
    
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    // Dosya tipi kontrolü
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya formatı. Sadece JPG, PNG, WebP veya MP4, WebM, OGG formatları kabul edilir.' },
        { status: 400 }
      );
    }

    // Dosya boyutu kontrolü
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu 50MB\'ı geçemez' },
        { status: 400 }
      );
    }

    // Dosya içeriğini al
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosya türünü belirle
    const fileType = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'video';
    
    // Dosya adını oluştur
    const originalName = file.name;
    
    // Cloudinary klasörünü belirle
    const cloudinaryFolder = `dogahotel/${folder}`;
    
    // Cloudinary'ye yükle
    const fileUrl = await uploadToCloudinary(buffer, cloudinaryFolder);
    
    if (!fileUrl) {
      return NextResponse.json(
        { error: 'Dosya yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      fileUrl,
      originalName,
      fileType
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
