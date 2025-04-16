import { NextRequest, NextResponse } from 'next/server';
// Removed unused import: import { readAboutData, updateAboutData } from '../../../data/about';
import { updateAboutData } from '../../../data/about'; // Keep updateAboutData
import path from 'path';
import fs from 'fs';

// Verileri getir
export async function GET() { // Removed unused 'request' parameter
  try {
    console.log('API: GET /api/admin/about isteği alındı');
    
    // Manuel olarak dosyayı okumayı deneyelim
    try {
      const dataFilePath = path.join(process.cwd(), 'src', 'app', 'data', 'json', 'aboutData.json');
      console.log('API: Dosya yolu:', dataFilePath);
      console.log('API: Dosya var mı?', fs.existsSync(dataFilePath));
      
      if (fs.existsSync(dataFilePath)) {
        const fileContent = fs.readFileSync(dataFilePath, 'utf8');
        console.log('API: Dosya okundu, içerik uzunluğu:', fileContent.length);
        
        const jsonData = JSON.parse(fileContent);
        console.log('API: JSON başarıyla işlendi');
        
        return NextResponse.json(jsonData, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, must-revalidate'
          }
        });
      } else {
        throw new Error('aboutData.json dosyası bulunamadı');
      }
    } catch (fileError) {
      console.error('API: Dosya okuma hatası:', fileError);
      throw fileError;
    }
  } catch (error: unknown) { // Changed 'any' to 'unknown'
    console.error('API: Hakkımızda verisi getirme hatası:', error);
    let errorMessage = 'Hakkımızda verisi getirilemedi.';
    if (error instanceof Error) {
      errorMessage = `Hakkımızda verisi getirilemedi: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}

// Verileri güncelle
export async function PUT(request: NextRequest) {
  try {
    console.log('API: PUT /api/admin/about isteği alındı');
    const updateData = await request.json();
    
    const updatedData = updateAboutData(updateData);
    console.log('API: Veriler güncellendi');
    
    return NextResponse.json(
      {
        success: true,
        data: updatedData
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error: unknown) { // Changed 'any' to 'unknown'
    console.error('API: Hakkımızda güncelleme hatası:', error);
    let errorMessage = 'Hakkımızda bilgileri güncellenemedi.';
    if (error instanceof Error) {
      errorMessage = `Hakkımızda bilgileri güncellenemedi: ${error.message}`;
    }
    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json' 
        }
      }
    );
  }
}
