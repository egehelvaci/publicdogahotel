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

// Define interface for order items
interface OrderItem {
  id: string;
  order: number;
}

// PUT - Galeri öğelerinin sırasını güncelle
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Items kontrolü
    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veri formatı' },
        { status: 400 }
      );
    }

    const items: OrderItem[] = body.items; // Add type annotation
    const gallery: GalleryItem[] = readGalleryData(); // Add type annotation

    // Bütün öğeleri güncelle (Add type for item)
    const updatedGallery = gallery.map((item: GalleryItem) => {
      // Use OrderItem type for find callback
      const orderItem = items.find((orderItem: OrderItem) => orderItem.id === item.id);

      if (orderItem) {
        // İlgili öğeyi güncelle
        return {
          ...item,
          order: orderItem.order
        };
      }
      
      // Güncellenmeyecek öğeleri olduğu gibi döndür
      return item;
    });

    // Sıralama sayesı üzerinde sırala (Add types for a, b)
    updatedGallery.sort((a: GalleryItem, b: GalleryItem) => a.order - b.order);

    // Verileri kaydet
    const success = writeGalleryData(updatedGallery);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Galeri öğeleri başarıyla yeniden sıralandı'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Galeri öğeleri sıralanırken bir hata oluştu' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Galeri öğeleri sıralama hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğeleri sıralanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
