import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// JSON dosya yolu
const dataFilePath = path.join(process.cwd(), 'src/app/data/json/sliderData.json');

// Yardımcı fonksiyonlar
function readSliderData() {
  try {
    console.log('JSON dosya yolu:', dataFilePath);
    
    // Dosya yoksa oluştur
    if (!fs.existsSync(dataFilePath)) {
      console.log('Slider veri dosyası bulunamadı, yeni oluşturuluyor');
      
      // Dizin yoksa oluştur
      const dir = path.dirname(dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(dataFilePath, '[]', 'utf8');
      return [];
    }
    
    console.log('Slider veri dosyası okunuyor');
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const parsedData = JSON.parse(data);
    console.log(`${parsedData.length} slider öğesi yüklendi`);
    
    return parsedData;
  } catch (error) {
    console.error('Slider verileri okunurken hata oluştu:', error);
    return [];
  }
}

function writeSliderData(data) {
  try {
    console.log('Slider verileri yazılıyor, toplam öğe sayısı:', data.length);
    
    // Dizin yoksa oluştur
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Slider verileri başarıyla kaydedildi');
    return true;
  } catch (error) {
    console.error('Slider verileri yazılırken hata oluştu:', error);
    return false;
  }
}

// Tüm slider öğelerini getir
export async function GET() {
  try {
    console.log('Tüm slider öğeleri için GET isteği alındı');
    const data = readSliderData();
    console.log('Toplam slider öğesi:', data.length);
    
    return NextResponse.json(data, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Slider verileri alınırken bir hata oluştu:', error);
    return NextResponse.json(
      { error: 'Slider verileri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Yeni slider öğesi ekle
export async function POST(request) {
  try {
    console.log('Yeni slider öğesi için POST isteği alındı');
    const body = await request.json();
    console.log('Gönderilen veri:', body);
    
    // Gerekli alanları kontrol et
    if ((!body.image && !body.videoUrl) || !body.titleTR || !body.titleEN) {
      console.error('Eksik alanlar:', { 
        mediaCheck: !(body.image || body.videoUrl), 
        titleTR: !body.titleTR, 
        titleEN: !body.titleEN 
      });
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik: En az bir görsel veya video ve başlıklar gereklidir' },
        { status: 400 }
      );
    }
    
    const data = readSliderData();
    
    // Yeni item oluştur
    const newItem = {
      id: body.id || uuidv4(),
      image: body.image || '',
      videoUrl: body.videoUrl || '',
      titleTR: body.titleTR,
      titleEN: body.titleEN,
      subtitleTR: body.subtitleTR || '',
      subtitleEN: body.subtitleEN || '',
      descriptionTR: body.descriptionTR || '',
      descriptionEN: body.descriptionEN || '',
      order: body.order || data.length + 1,
      active: body.active !== undefined ? body.active : true
    };
    
    console.log('Yeni öğe oluşturuldu:', newItem);
    data.push(newItem);
    
    if (writeSliderData(data)) {
      return NextResponse.json(newItem, { status: 201 });
    } else {
      return NextResponse.json(
        { error: 'Slider verisi kaydedilemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Slider verisi eklenirken bir hata oluştu:', error);
    return NextResponse.json(
      { error: 'Slider verisi eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Slider öğesini güncelle
export async function PUT(request) {
  try {
    const body = await request.json();
    
    // ID kontrol et
    if (!body.id) {
      return NextResponse.json(
        { error: "Güncellenecek slider öğesinin ID'si gereklidir" },
        { status: 400 }
      );
    }
    
    const data = readSliderData();
    const index = data.findIndex(item => item.id === body.id);
    
    if (index === -1) {
      return NextResponse.json(
        { error: 'Güncellenecek slider öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // Mevcut öğeyi güncelle
    data[index] = {
      ...data[index],
      ...body
    };
    
    if (writeSliderData(data)) {
      return NextResponse.json(data[index], { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Slider verisi güncellenemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Slider verisi güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Slider verisi güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Slider öğesini sil
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Silinecek slider öğesinin ID'si gereklidir" },
        { status: 400 }
      );
    }
    
    const data = readSliderData();
    const filteredData = data.filter(item => item.id !== id);
    
    // Hiçbir öğe silinmediyse
    if (filteredData.length === data.length) {
      return NextResponse.json(
        { error: 'Silinecek slider öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // Sıra numaralarını güncelle
    const updatedData = filteredData.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    if (writeSliderData(updatedData)) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Slider verisi silinemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Slider verisi silinirken hata:', error);
    return NextResponse.json(
      { error: 'Slider verisi silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 