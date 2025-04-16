import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ServiceItem } from '@/app/data/admin/servicesData'; // Import ServiceItem

// Veri dosyasının yolu
const dataFilePath = path.join(process.cwd(), "src/app/data/json/servicesData.json");

// Servis verilerini oku (Return type added)
const readServicesData = (): ServiceItem[] => {
  try {
    // Dosya yoksa boş bir dizi döndür
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }

    const data = fs.readFileSync(dataFilePath, "utf8");
    // Cast the parsed data to ServiceItem[]
    return JSON.parse(data) as ServiceItem[];
  } catch (error) {
    console.error("Servis verileri okunurken hata:", error);
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
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Servis verileri yazılırken hata:", error);
    return false;
  }
};

export const revalidate = 0; // Sayfayı her istekte yeniden oluştur

// Tüm servisleri getir
export async function GET() {
  try {
    const services: ServiceItem[] = readServicesData(); // Explicit type

    // Hizmetleri sıralama numarasına göre sırala (Add types)
    const sortedServices = services.sort((a: ServiceItem, b: ServiceItem) => a.order - b.order);

    // Cache önleme başlıkları ile tüm hizmetleri döndür
    return NextResponse.json(
      { success: true, items: sortedServices },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Servis verileri getirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Servis verileri getirilirken bir hata oluştu' },
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

// Yeni servis ekle
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Gerekli alanları kontrol et
    if (!data.titleTR || !data.titleEN || !data.icon) {
      return NextResponse.json(
        { success: false, message: 'Eksik bilgiler: başlık ve ikon gerekli' },
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

    // Mevcut servisleri oku
    const services: ServiceItem[] = readServicesData(); // Explicit type

    // Benzersiz ID oluştur (eğer yoksa)
    const newService = {
      ...data,
      id: data.id || generateId(data.titleEN),
      order: services.length + 1, // Son sıraya ekle
      active: data.active !== undefined ? data.active : true, // Varsayılan olarak aktif
      createdAt: new Date().toISOString(), // Oluşturulma zamanı
      lastUpdated: new Date().toISOString() // Son güncelleme zamanı
    };
    
    // Yeni servisi ekle
    services.push(newService);
    
    // Değişiklikleri kaydet
    if (writeServicesData(services)) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Servis başarıyla eklendi',
          item: newService 
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
        { success: false, message: 'Servis eklenirken bir hata oluştu' },
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
    console.error('Servis ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Servis eklenirken bir hata oluştu' },
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

// Yardımcı fonksiyon: İngilizce başlıktan ID oluştur
function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Alfanümerik olmayan karakterleri tire ile değiştir
    .replace(/^-+|-+$/g, ''); // Baştaki ve sondaki tireleri kaldır
}

// Servisi güncelle
export async function PUT(request: NextRequest) {
  try {
    const updatedService = await request.json();
    
    // Gerekli alanların kontrolü
    if (!updatedService.id) {
      return NextResponse.json(
        { success: false, message: "ID alanı gereklidir" },
        { status: 400 }
      );
    }

    const servicesData: ServiceItem[] = readServicesData(); // Explicit type
    // Add type for item in findIndex
    const index = servicesData.findIndex((item: ServiceItem) => item.id === updatedService.id);

    // Servisin var olup olmadığını kontrol et
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Güncellenecek servis bulunamadı" },
        { status: 404 }
      );
    }
    
    // Servisi güncelle
    servicesData[index] = {
      ...servicesData[index],
      ...updatedService
    };
    
    // Verileri kaydet
    if (writeServicesData(servicesData)) {
      return NextResponse.json({
        success: true,
        message: "Servis başarıyla güncellendi",
        item: servicesData[index]
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Servis güncellenirken bir hata oluştu" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Servis güncellenirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Servis güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// Servisi sil
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID parametresi gereklidir" },
        { status: 400 }
      );
    }

    const servicesData: ServiceItem[] = readServicesData(); // Explicit type
    // Add type for item in findIndex
    const index = servicesData.findIndex((item: ServiceItem) => item.id === id);

    // Servisin var olup olmadığını kontrol et
    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Silinecek servis bulunamadı" },
        { status: 404 }
      );
    }
    
    // Servisi sil
    const deletedService = servicesData.splice(index, 1)[0];

    // Sıralamayı güncelle (Remove unused 'i', add type for 'item')
    servicesData.forEach((item: ServiceItem) => {
      if (item.order > deletedService.order) {
        item.order -= 1;
      }
    });

    // Verileri kaydet
    if (writeServicesData(servicesData)) {
      return NextResponse.json({
        success: true,
        message: "Servis başarıyla silindi",
        item: deletedService
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Servis silinirken bir hata oluştu" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Servis silinirken hata:", error);
    return NextResponse.json(
      { success: false, message: "Servis silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
