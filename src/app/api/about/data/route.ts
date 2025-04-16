import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Statik JSON yanıtı döndüren basit endpoint
export async function GET() { // Removed unused 'request' parameter
  try {
    console.log('API: Alternatif GET /api/about/data isteği alındı');
    
    // JSON dosyasının yolu
    const dataFilePath = path.join(process.cwd(), 'src', 'app', 'data', 'json', 'aboutData.json');
    console.log('API: Alternatif dosya yolu:', dataFilePath);
    
    // Dosya var mı kontrol et
    if (!fs.existsSync(dataFilePath)) {
      console.error('API: Alternatif dosya bulunamadı');
      return NextResponse.json(
        { error: 'aboutData.json dosyası bulunamadı' },
        { status: 404 }
      );
    }
    
    // Dosyayı oku
    const fileContent = fs.readFileSync(dataFilePath, 'utf8');
    console.log('API: Alternatif dosya okundu, içerik uzunluğu:', fileContent.length);

    // JSON olarak parse et (Removed unused jsonData variable)
    // const jsonData = JSON.parse(fileContent);
    // console.log('API: Alternatif JSON başarıyla işlendi');

    // JSON yanıtı döndür (Return the raw file content directly)
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate'
      }
    });
  } catch (error: unknown) { // Changed 'any' to 'unknown'
    console.error('API: Alternatif veri getirme hatası:', error);
    let errorMessage = 'Veri getirilemedi.';
    if (error instanceof Error) {
      errorMessage = `Veri getirilemedi: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
