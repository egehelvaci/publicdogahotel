import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // İstek formunu al
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'services';

    // Dosya kontrolü
    if (!file) {
      return NextResponse.json(
        { error: 'Dosya yüklenemedi' },
        { status: 400 }
      );
    }

    // Buffer olarak dosya içeriğini al
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Güvenli dosya adı oluştur
    const originalName = file.name;
    const fileExtension = originalName.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

    // Dosya uzantısını kontrol et
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya formatı. Sadece jpg, jpeg, png, gif ve webp formatları desteklenir.' },
        { status: 400 }
      );
    }

    // Benzersiz dosya adı oluşturma
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    
    // Klasör yolunu belirle
    const uploadDir = join(process.cwd(), 'public', 'images', folder);
    
    // Klasör yoksa oluştur
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Dosya yolunu oluştur
    const filePath = join(uploadDir, uniqueFileName);
    
    // Dosyayı kaydet
    await writeFile(filePath, buffer);
    
    // Başarılı yanıt döndür
    return NextResponse.json({
      success: true,
      filePath: `/images/${folder}/${uniqueFileName}`
    });
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 