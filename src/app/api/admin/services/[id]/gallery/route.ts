import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ServiceItem } from '@/app/data/admin/servicesData'; // Import ServiceItem

// Veri dosyasının yolu
const dataFilePath = path.join(process.cwd(), 'src/app/data/json/servicesData.json');

// Servis verilerini oku (Return type added)
const readServicesData = (): ServiceItem[] => {
  try {
    // Dosya yoksa boş bir dizi döndür
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }

    const data = fs.readFileSync(dataFilePath, 'utf8');
    // Cast the parsed data to ServiceItem[]
    return JSON.parse(data) as ServiceItem[];
  } catch (error) {
    console.error('Servis verileri okunurken hata:', error);
    return [];
  }
};

// Servis verilerini yaz (Use ServiceItem type)
const writeServicesData = (data: ServiceItem[]) => {
  try {
    // Dizini oluştur (eğer yoksa)
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Servis verileri yazılırken hata:', error);
    return false;
  }
};

// ID'ye göre servis galerisini getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const servicesData: ServiceItem[] = readServicesData(); // Explicit type
    // Add type for item in find callback
    const service = servicesData.find((item: ServiceItem) => item.id === id);

    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Servis bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      gallery: {
        image: service.image,
        images: service.images
      }
    });
  } catch (error) {
    console.error('Servis galerisi getirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Servis galerisi getirilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Servis galerisini güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const services: ServiceItem[] = readServicesData(); // Explicit type
    // Add type for s in findIndex callback
    const serviceIndex = services.findIndex((s: ServiceItem) => s.id === id);

    if (serviceIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Belirtilen ID ile servis bulunamadı' },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    const galleryData = await request.json();
    
    // Galeri verilerini kontrol et
    if (!Array.isArray(galleryData.images)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz galeri formatı' },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Servis nesnesini güncelle
    services[serviceIndex] = {
      ...services[serviceIndex],
      image: galleryData.image || '',
      images: galleryData.images || []
      // Removed lastUpdated: lastUpdated: new Date().toISOString()
    };

    // Verileri kaydet
    if (writeServicesData(services)) {
      return NextResponse.json(
        {
          success: true,
          message: 'Galeri başarıyla güncellendi',
          item: services[serviceIndex] // Güncellenmiş veriyi yanıtta gönder
        },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Galeri güncellenirken bir hata oluştu' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
  } catch (error) {
    console.error('Galeri güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri güncellenirken bir hata oluştu' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
