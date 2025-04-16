import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ServiceItem } from '@/app/data/admin/servicesData'; // Import the ServiceItem type

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

// Servisleri yeniden sırala
export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    
    // Gerekli alanların kontrolü
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, message: 'Geçerli bir sıralama listesi gereklidir' },
        { status: 400 }
      );
    }
    
    const servicesData: ServiceItem[] = readServicesData(); // Explicit type for clarity

    // Her bir öğe için sıralamayı güncelle
    items.forEach(item => {
      // Add type for 's' in findIndex callback
      const serviceIndex = servicesData.findIndex((s: ServiceItem) => s.id === item.id);
      if (serviceIndex !== -1) {
        servicesData[serviceIndex].order = item.order;
      }
    });

    // Sıralamaya göre yeniden dizme (Add types for 'a' and 'b')
    servicesData.sort((a: ServiceItem, b: ServiceItem) => a.order - b.order);

    // Verileri kaydet
    if (writeServicesData(servicesData)) {
      return NextResponse.json({
        success: true,
        message: 'Servisler başarıyla yeniden sıralandı'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Servisler sıralanırken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Servisler sıralanırken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Servisler sıralanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
