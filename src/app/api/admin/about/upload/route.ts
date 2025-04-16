import { NextRequest, NextResponse } from 'next/server';
import { saveUploadedImage, readAboutData, updateAboutData } from '../../../../data/about';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const imageType = formData.get('type') as string; // heroImage veya mainImage
    
    if (!file || !imageType) {
      return NextResponse.json(
        { error: 'Resim dosyası veya resim tipi belirtilmedi' },
        { status: 400 }
      );
    }
    
    // Resmi base64'e dönüştür
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    // Resmi kaydet
    const imagePath = saveUploadedImage(base64Image, file.name);
    
    // Hakkımızda verisini oku ve güncelle
    const aboutData = readAboutData();
    
    // Resim tipine göre veriyi güncelle
    if (imageType === 'heroImage') {
      aboutData.heroImage = imagePath;
    } else if (imageType === 'mainImage') {
      aboutData.mainImage = imagePath;
    } else {
      return NextResponse.json(
        { error: 'Geçersiz resim tipi' },
        { status: 400 }
      );
    }
    
    // Verileri güncelle
    updateAboutData(aboutData);
    
    return NextResponse.json({
      success: true,
      data: {
        path: imagePath,
        type: imageType
      }
    });
  } catch (error) {
    console.error('Resim yükleme hatası:', error);
    return NextResponse.json(
      { error: 'Resim yüklenemedi' },
      { status: 500 }
    );
  }
} 