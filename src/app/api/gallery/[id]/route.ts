import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { notifyGalleryUpdated } from '../../websocket/route';
import { GalleryItem } from '@/app/data/gallery'; // Import GalleryItem

// Dosya yolu
const galleryFilePath = path.join(process.cwd(), 'src/app/data/json/admin/galleryData.json');

// JSON dosyasını okuma yardımcı fonksiyonu (Return type added)
const readGalleryData = (): GalleryItem[] => {
  try {
    const fileData = fs.readFileSync(galleryFilePath, 'utf8');
    // Cast the parsed data to GalleryItem[]
    return JSON.parse(fileData) as GalleryItem[];
  } catch (error) {
    console.error('Galeri verisi okuma hatası:', error);
    return [];
  }
};

// JSON dosyasına yazma yardımcı fonksiyonu (Use GalleryItem type)
const writeGalleryData = (data: GalleryItem[]) => {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(galleryFilePath, jsonData, 'utf8');
    
    // WebSocket bildirimi gönder
    notifyGalleryUpdated();
    
    return true;
  } catch (error) {
    console.error('Galeri verisi yazma hatası:', error);
    return false;
  }
};

// GET - ID'ye göre galeri öğesi getir
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // params nesnesini varsayalım
    const id = params.id;
    const gallery: GalleryItem[] = readGalleryData(); // Add type annotation
    // Add type for item in find callback
    const item = gallery.find((item: GalleryItem) => item.id === id);

    if (!item) {
      return NextResponse.json(
        { success: false, message: 'Galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error('Galeri öğesi çekme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğesi alınamadı' },
      { status: 500 }
    );
  }
}

// PUT - ID'ye göre galeri öğesini güncelle
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // params nesnesini varsayalım
    const id = params.id;
    const body = await request.json();
    const gallery: GalleryItem[] = readGalleryData(); // Add type annotation

    // Add type for item in findIndex callback
    const itemIndex = gallery.findIndex((item: GalleryItem) => item.id === id);

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // Mevcut öğeyi al
    const existingItem = gallery[itemIndex];
    
    // Güncelleme
    const updatedItem = {
      ...existingItem,
      ...body,
      id: id // ID değiştirilmesin
    };
    
    // Öğeyi güncelle
    gallery[itemIndex] = updatedItem;
    
    // Verileri kaydet
    const success = writeGalleryData(gallery);
    
    if (success) {
      return NextResponse.json({
        success: true,
        data: updatedItem,
        message: 'Galeri öğesi başarıyla güncellendi'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Galeri öğesi güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Galeri öğesi güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğesi güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE - ID'ye göre galeri öğesini sil
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // params nesnesini varsayalım
    const id = params.id;
    const gallery: GalleryItem[] = readGalleryData(); // Add type annotation
    // Add type for item in findIndex callback
    const itemIndex = gallery.findIndex((item: GalleryItem) => item.id === id);

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, message: 'Galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // Öğeyi sil
    const deletedItem = gallery.splice(itemIndex, 1)[0];

    // Kalan öğelerin sırasını güncelle (Add type for item)
    const updatedGallery = gallery.map((item: GalleryItem, index: number) => ({
      ...item,
      order: index + 1 // Note: Order starts from 1, not 0? Check consistency.
    }));

    // Verileri kaydet
    const success = writeGalleryData(updatedGallery);
    
    if (success) {
      return NextResponse.json({
        success: true,
        data: deletedItem,
        message: 'Galeri öğesi başarıyla silindi'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Galeri öğesi silinirken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Galeri öğesi silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğesi silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
