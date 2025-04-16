import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ServiceItem } from '@/app/types/serviceTypes';

// Servis verilerini oku
const readServicesData = (): ServiceItem[] => {
  try {
    const filePath = path.join(process.cwd(), 'src/app/data/json/servicesData.json');
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileData);
    }
    return [];
  } catch (error) {
    console.error('Servis verileri okuma hatası:', error);
    return [];
  }
};

// Servis verilerini yaz
const writeServicesData = (data: ServiceItem[]): boolean => {
  try {
    const dirPath = path.join(process.cwd(), 'src/app/data/json');
    const filePath = path.join(dirPath, 'servicesData.json');
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Servis verileri yazma hatası:', error);
    return false;
  }
};

// ID'ye göre servis getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const servicesData = readServicesData();
    const service = servicesData.find(item => item.id === id);
    
    if (!service) {
      return NextResponse.json(
        { success: false, message: 'Servis bulunamadı' },
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
    
    return NextResponse.json(
      { success: true, item: service },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Servis getirme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Servis getirilirken bir hata oluştu' },
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

// Servisi güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const updateData = await request.json();
    
    const services = readServicesData();
    const serviceIndex = services.findIndex(s => s.id === id);
    
    if (serviceIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Servis bulunamadı' },
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
    
    // Geçerli servisi güncelle ama ID'yi değiştirmeye izin verme
    services[serviceIndex] = {
      ...services[serviceIndex],
      ...updateData,
      id: id, // ID değişmemeli
      lastUpdated: new Date().toISOString() // Son güncelleme zaman damgası
    };
    
    if (writeServicesData(services)) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Servis başarıyla güncellendi',
          item: services[serviceIndex] // Güncellenmiş veriyi döndür
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
        { success: false, message: 'Servis güncellenirken bir hata oluştu' },
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
    console.error('Servis güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Servis güncellenirken bir hata oluştu' },
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

// Servisi sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const services = readServicesData();
    const updatedServices = services.filter(s => s.id !== id);
    
    if (services.length === updatedServices.length) {
      // Hiçbir şey silinmedi, ID bulunamadı
      return NextResponse.json(
        { success: false, message: 'Servis bulunamadı' },
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
    
    if (writeServicesData(updatedServices)) {
      return NextResponse.json(
        { success: true, message: 'Servis başarıyla silindi' },
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
        { success: false, message: 'Servis silinirken bir hata oluştu' },
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
    console.error('Servis silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Servis silinirken bir hata oluştu' },
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