import { NextRequest, NextResponse } from 'next/server';
// Removed unused imports from '@/app/data/gallery'
// import {
//   getAllGalleryItems,
//   addGalleryItem,
//   updateGalleryItem,
//   deleteGalleryItem,
//   updateGalleryItemsOrder,
//   GalleryItem
// } from '@/app/data/gallery';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Galeri öğesi arayüzü
interface GalleryItem {
  id: string;
  image: string;
  videoUrl?: string; // Video URL (isteğe bağlı)
  title?: string;
  description?: string;
  order: number;
  type: 'image' | 'video'; // Öğe türü
}

// JSON dosya yolu
const dataFilePath = path.join(process.cwd(), 'src/app/data/json/gallery.json');

// Yardımcı fonksiyonlar (Return type added)
function readGalleryData(): GalleryItem[] {
  try {
    // Dosya yoksa oluştur
    if (!fs.existsSync(dataFilePath)) {
      // Dizin yoksa oluştur
      const dir = path.dirname(dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(dataFilePath, '[]', 'utf8');
      return [];
    }

    const data = fs.readFileSync(dataFilePath, 'utf8');
    // Cast the parsed data to GalleryItem[]
    return JSON.parse(data) as GalleryItem[];
  } catch (error) {
    console.error('Galeri verileri okunurken hata oluştu:', error);
    return [];
  }
}

// Use GalleryItem type for data parameter
function writeGalleryData(data: GalleryItem[]): boolean {
  try {
    // Dizin yoksa oluştur
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Galeri verileri yazılırken hata oluştu:', error);
    return false;
  }
}

// GET: Tüm galeri öğelerini getir
export async function GET() {
  try {
    const data: GalleryItem[] = readGalleryData(); // Add type annotation
    return NextResponse.json(data, { status: 200 });
  } catch /* Removed unused 'error' */ {
    return NextResponse.json(
      { error: 'Galeri verileri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST: Yeni galeri öğesi ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Gerekli alanları kontrol et
    if (!body.image) {
      return NextResponse.json(
        { error: 'Görsel alanı gereklidir' },
        { status: 400 }
      );
    }

    const data: GalleryItem[] = readGalleryData(); // Add type annotation

    // Öğe türünü belirle
    const itemType = body.videoUrl ? 'video' : 'image';
    
    // Yeni öğe oluştur
    const newItem: GalleryItem = {
      id: body.id || uuidv4(),
      image: body.image,
      videoUrl: body.videoUrl || undefined,
      title: body.title || undefined,
      description: body.description || undefined,
      order: body.order || data.length,
      type: body.type || itemType
    };
    
    data.push(newItem);
    
    if (writeGalleryData(data)) {
      // Cache'i yenile
      revalidatePath('/gallery');
      revalidatePath('/admin/gallery');
      
      return NextResponse.json(newItem, { status: 201 });
    } else {
      return NextResponse.json(
        { error: 'Galeri verisi kaydedilemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Galeri öğesi eklenirken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Galeri öğesi eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT: Bir galeri öğesini güncelle
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    
    // ID kontrol et
    if (!body.id) {
      return NextResponse.json(
        { error: "Güncellenecek galeri öğesinin ID'si gereklidir" },
        { status: 400 }
      );
    }

    const data: GalleryItem[] = readGalleryData(); // Add type annotation
    // Add type for item in findIndex
    const index = data.findIndex((item: GalleryItem) => item.id === body.id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Güncellenecek galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // Öğe türünü belirle
    const itemType = body.videoUrl ? 'video' : 'image';
    
    // Mevcut öğeyi güncelle
    data[index] = {
      ...data[index],
      ...body,
      type: body.type || itemType
    };
    
    if (writeGalleryData(data)) {
      // Cache'i yenile
      revalidatePath('/gallery');
      revalidatePath('/admin/gallery');
      
      return NextResponse.json(data[index], { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Galeri verisi güncellenemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Galeri öğesi güncellenirken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Galeri öğesi güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE: Galeri öğesini sil
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: "Silinecek galeri öğesinin ID'si gereklidir" },
        { status: 400 }
      );
    }

    const data: GalleryItem[] = readGalleryData(); // Add type annotation
    // Add type for item in filter
    const filteredData = data.filter((item: GalleryItem) => item.id !== id);

    // Hiçbir öğe silinmediyse
    if (filteredData.length === data.length) {
      return NextResponse.json(
        { error: 'Silinecek galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }

    // Sıra numaralarını güncelle (Add type for item)
    const updatedData = filteredData.map((item: GalleryItem, index) => ({
      ...item,
      order: index
    }));

    if (writeGalleryData(updatedData)) {
      // Cache'i yenile
      revalidatePath('/gallery');
      revalidatePath('/admin/gallery');
      
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: 'Galeri verisi silinemedi' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Galeri öğesi silinirken hata oluştu:', error);
    return NextResponse.json(
      { error: 'Galeri öğesi silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
