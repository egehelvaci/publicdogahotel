import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { notifyRoomsUpdated } from '../websocket/route';

// Define a basic interface for Room items based on usage (Add export)
export interface RoomItem {
  id: string;
  nameTR: string;
  nameEN: string;
  descriptionTR: string;
  descriptionEN: string;
  image: string;
  priceTR: string;
  priceEN: string;
  capacity: number;
  size: number;
  featuresTR: string[];
  featuresEN: string[];
  gallery: string[];
  type: string;
  active: boolean;
  order: number;
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
const writeRoomsData = (data: RoomItem[]) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(roomsFilePath, jsonData, 'utf8');
    
    // WebSocket bildirimi gönder
    notifyRoomsUpdated();
    
    return true;
  } catch (error) {
    console.error('Oda verisi yazma hatası:', error);
    return false;
  }
};

// GET - Tüm odaları getir
export async function GET() {
  try {
    const rooms: RoomItem[] = readRoomsData(); // Add type annotation
    return NextResponse.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Oda verisi çekme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Oda verileri alınamadı' },
      { status: 500 }
    );
  }
}

// POST - Yeni oda ekle
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Gerekli alanları kontrol et
    if (!body.nameTR || !body.nameEN || !body.descriptionTR || !body.descriptionEN || !body.image) {
      return NextResponse.json(
        { success: false, message: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    const rooms: RoomItem[] = readRoomsData(); // Add type annotation

    // Yeni ID oluştur
    const id = body.id || `${body.nameTR.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Yeni odayı ekle (Use RoomItem type)
    const newRoom: RoomItem = {
      id,
      nameTR: body.nameTR,
      nameEN: body.nameEN,
      descriptionTR: body.descriptionTR,
      descriptionEN: body.descriptionEN,
      image: body.image,
      priceTR: body.priceTR || '₺0',
      priceEN: body.priceEN || '€0',
      capacity: body.capacity || 2,
      size: body.size || 25,
      featuresTR: body.featuresTR || [],
      featuresEN: body.featuresEN || [],
      gallery: body.gallery || [body.image],
      type: body.type || 'standard',
      active: body.active !== undefined ? body.active : true,
      order: rooms.length + 1
    };
    
    rooms.push(newRoom);
    
    // Verileri kaydet
    const success = writeRoomsData(rooms);
    
    if (success) {
      return NextResponse.json(
        { success: true, data: newRoom, message: 'Oda başarıyla eklendi' },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: 'Oda eklenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Oda ekleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Oda eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
