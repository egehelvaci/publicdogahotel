import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// JSON dosya yolu
const dataFilePath = path.join(process.cwd(), 'src/app/data/json/sliderData.json');

// Slider verilerini okuma fonksiyonu
function readSliderData() {
  try {
    console.log('Reorder: JSON dosya yolu:', dataFilePath);
    
    if (!fs.existsSync(dataFilePath)) {
      console.warn('Reorder: Slider veri dosyası bulunamadı, boş dizi döndürülüyor');
      return [];
    }
    
    console.log('Reorder: Slider veri dosyası okunuyor');
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const parsedData = JSON.parse(data);
    console.log(`Reorder: ${parsedData.length} slider öğesi yüklendi`);
    
    return parsedData;
  } catch (error) {
    console.error('Reorder: Slider verileri okunurken hata oluştu:', error);
    return [];
  }
}

// Slider verilerini yazma fonksiyonu
function writeSliderData(data) {
  try {
    console.log('Reorder: Slider verileri yazılıyor, yeni sıralama uygulanıyor:', data.length, 'öğe');
    
    // Dizin yoksa oluştur
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Reorder: Slider verileri başarıyla kaydedildi, yeni sıralama uygulandı');
    return true;
  } catch (error) {
    console.error('Reorder: Slider verileri yazılırken hata oluştu:', error);
    return false;
  }
}

// Slider öğelerini yeniden sıralama
export async function POST(request) {
  try {
    console.log('Reorder: Yeni sıralama için POST isteği alındı');
    const body = await request.json();
    console.log('Reorder: Gönderilen sıralama verileri:', body);
    
    if (!Array.isArray(body) || body.length === 0) {
      console.error('Reorder: Geçersiz sıralama verisi');
      return NextResponse.json(
        { error: 'Geçersiz sıralama verisi' },
        { status: 400 }
      );
    }
    
    const data = readSliderData();
    
    // Her bir öğenin yeni sıra numarasını güncelle
    const updatedData = data.map(item => {
      const orderItem = body.find(o => o.id === item.id);
      if (orderItem) {
        return { ...item, order: orderItem.order };
      }
      return item;
    });
    
    // Sıra numarasına göre verileri sırala
    const sortedData = [...updatedData].sort((a, b) => a.order - b.order);
    
    if (writeSliderData(sortedData)) {
      return NextResponse.json(sortedData, { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } else {
      return NextResponse.json(
        { error: 'Slider verileri sıralanamadı' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Reorder: Slider verileri sıralanırken bir hata oluştu:', error);
    return NextResponse.json(
      { error: 'Slider verileri sıralanırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 