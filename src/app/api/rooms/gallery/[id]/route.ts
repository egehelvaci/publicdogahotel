import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { notifyRoomsUpdated, notifyGalleryUpdated } from '../../../websocket/route';

// Define a basic interface for Room items based on usage
interface RoomItem {
  id: string;
  image: string;
  gallery: string[];
  // Add other properties if needed based on roomsData.json structure
}

// Dosya yolu
const roomsFilePath = path.join(process.cwd(), 'src/app/data/json/admin/roomsData.json');

// JSON dosyasını okuma yardımcı fonksiyonu (Return type added)
const readRoomsData = (): RoomItem[] => {
  try {
    const fileData = fs.readFileSync(roomsFilePath, 'utf8');
    // Cast the parsed data to RoomItem[]
    return JSON.parse(fileData) as RoomItem[];
  } catch (error) {
    console.error('Oda verisi okuma hatası:', error);
    return [];
  }
};

// JSON dosyasına yazma yardımcı fonksiyonu (Use RoomItem type)
const writeRoomsData = (data: RoomItem[], roomId: string) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(roomsFilePath, jsonData, 'utf8');
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    notifyGalleryUpdated(); // Removed roomId argument

    return true;
  } catch (error) {
    console.error('Oda verisi yazma hatası:', error);
    return false;
  }
};

// GET - Odanın galeri görsellerini getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rooms: RoomItem[] = readRoomsData(); // Add type annotation
    // Add type for room in find callback
    const room = rooms.find((room: RoomItem) => room.id === params.id);

    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        mainImage: room.image,
        gallery: room.gallery || []
      }
    });
  } catch (error) {
    console.error('Galeri verisi çekme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri verisi alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - Odanın galeri görsellerini güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { gallery, mainImage } = body;

    const rooms: RoomItem[] = readRoomsData(); // Add type annotation
    // Add type for room in findIndex callback
    const roomIndex = rooms.findIndex((room: RoomItem) => room.id === params.id);

    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Galerinin dizi olduğundan emin ol
    if (!Array.isArray(gallery)) {
      return NextResponse.json(
        { success: false, message: 'Galeri bir dizi olmalıdır' },
        { status: 400 }
      );
    }
    
    // Ana görsel geçerliyse güncelle
    if (mainImage) {
      rooms[roomIndex].image = mainImage;
      
      // Ana görsel galeriye eklenmediyse ekle
      if (!gallery.includes(mainImage)) {
        rooms[roomIndex].gallery = [mainImage, ...gallery];
      } else {
        rooms[roomIndex].gallery = gallery;
      }
    } else {
      rooms[roomIndex].gallery = gallery;
    }
    
    // Verileri kaydet
    const success = writeRoomsData(rooms, params.id);
    
    if (success) {
      return NextResponse.json({
        success: true,
        data: {
          mainImage: rooms[roomIndex].image,
          gallery: rooms[roomIndex].gallery
        },
        message: 'Galeri başarıyla güncellendi'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Galeri güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Galeri güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST - Galeriye görsel ekle
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { imagePath } = body;
    
    if (!imagePath) {
      return NextResponse.json(
        { success: false, message: 'Görsel yolu gereklidir' },
        { status: 400 }
      );
    }

    const rooms: RoomItem[] = readRoomsData(); // Add type annotation
    // Add type for room in findIndex callback
    const roomIndex = rooms.findIndex((room: RoomItem) => room.id === params.id);

    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Görsel zaten galeriye eklenmiş mi kontrol et
    if (rooms[roomIndex].gallery.includes(imagePath)) {
      return NextResponse.json({
        success: false,
        message: 'Bu görsel zaten galeride mevcut'
      });
    }
    
    // Görseli galeriye ekle
    rooms[roomIndex].gallery = [...rooms[roomIndex].gallery, imagePath];
    
    // Verileri kaydet
    const success = writeRoomsData(rooms, params.id);
    
    if (success) {
      return NextResponse.json({
        success: true,
        data: {
          mainImage: rooms[roomIndex].image,
          gallery: rooms[roomIndex].gallery
        },
        message: 'Görsel galeriye eklendi'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Görsel eklenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Görsel ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görsel eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - Galeriden görsel çıkar
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // URL parametrelerini al
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('imagePath');
    
    if (!imagePath) {
      return NextResponse.json(
        { success: false, message: 'Görsel yolu gereklidir' },
        { status: 400 }
      );
    }

    const rooms: RoomItem[] = readRoomsData(); // Add type annotation
    // Add type for room in findIndex callback
    const roomIndex = rooms.findIndex((room: RoomItem) => room.id === params.id);

    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Ana görsel silinmeye çalışılıyorsa engelle
    if (rooms[roomIndex].image === imagePath) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Ana görsel kaldırılamaz. Önce başka bir görseli ana görsel yapın'
        },
        { status: 400 }
      );
    }
    
    // Görseli galeriden çıkar (Type for img is already string, no change needed here)
    rooms[roomIndex].gallery = rooms[roomIndex].gallery.filter(
      (img: string) => img !== imagePath
    );

    // Verileri kaydet
    const success = writeRoomsData(rooms, params.id);
    
    if (success) {
      return NextResponse.json({
        success: true,
        data: {
          mainImage: rooms[roomIndex].image,
          gallery: rooms[roomIndex].gallery
        },
        message: 'Görsel galeriden kaldırıldı'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Görsel kaldırılırken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Görsel kaldırma hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Görsel kaldırılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
