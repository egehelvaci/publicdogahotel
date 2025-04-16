import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { notifyRoomsUpdated, notifyRoomUpdated } from '../../websocket/route';
import { RoomItem } from '../route'; // Import RoomItem from the main route file

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
const writeRoomsData = (data: RoomItem[], roomId?: string) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(roomsFilePath, jsonData, 'utf8');
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    
    // Belirli bir oda için bildirim
    if (roomId) {
      notifyRoomUpdated(roomId);
    }
    
    return true;
  } catch (error) {
    console.error('Oda verisi yazma hatası:', error);
    return false;
  }
};

// GET - ID'ye göre oda getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // params nesnesini varsayalım
    const id = params.id;
    const rooms: RoomItem[] = readRoomsData(); // Add type annotation
    // Add type for room in find callback
    const room = rooms.find((room: RoomItem) => room.id === id);

    if (!room) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: room });
  } catch (error) {
    console.error('Oda verisi çekme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Oda verisi alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - ID'ye göre odayı güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // params nesnesini varsayalım
    const id = params.id;
    const body = await request.json();
    const rooms: RoomItem[] = readRoomsData(); // Add type annotation

    // Add type for room in findIndex callback
    const roomIndex = rooms.findIndex((room: RoomItem) => room.id === id);

    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Mevcut odayı al
    const existingRoom: RoomItem = rooms[roomIndex]; // Add type annotation

    // Güncelleme (Use RoomItem type)
    const updatedRoom: RoomItem = {
      ...existingRoom,
      ...body,
      id: id // ID değiştirilmesin
    };
    
    // Galeri yönetimi
    if (body.image && !updatedRoom.gallery.includes(body.image)) {
      // Ana görsel galeriye eklenmediyse ekle
      updatedRoom.gallery = [body.image, ...updatedRoom.gallery];
    }
    
    // Odayı güncelle
    rooms[roomIndex] = updatedRoom;
    
    // Verileri kaydet
    const success = writeRoomsData(rooms, id);
    
    if (success) {
      return NextResponse.json({
        success: true,
        data: updatedRoom,
        message: 'Oda başarıyla güncellendi'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Oda güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Oda güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Oda güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - ID'ye göre odayı sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // params nesnesini varsayalım
    const id = params.id;
    const rooms: RoomItem[] = readRoomsData(); // Add type annotation
    // Add type for room in findIndex callback
    const roomIndex = rooms.findIndex((room: RoomItem) => room.id === id);

    if (roomIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Oda bulunamadı' },
        { status: 404 }
      );
    }
    
    // Odayı sil
    const deletedRoom = rooms.splice(roomIndex, 1)[0];

    // Kalan odaların sırasını güncelle (Add type for room)
    const updatedRooms = rooms.map((room: RoomItem, index: number) => ({
      ...room,
      order: index + 1 // Note: Order starts from 1? Check consistency.
    }));

    // Verileri kaydet
    const success = writeRoomsData(updatedRooms);
    
    if (success) {
      return NextResponse.json({
        success: true,
        data: deletedRoom,
        message: 'Oda başarıyla silindi'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Oda silinirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Oda silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Oda silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
