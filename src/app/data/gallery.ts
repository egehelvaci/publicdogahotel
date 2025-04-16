import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Galeri öğesi arayüzü
export interface GalleryItem {
  id: string;
  titleTR: string;
  titleEN: string;
  descriptionTR: string;
  descriptionEN: string;
  image: string;
  category: string;
  order: number;
  active: boolean;
  type: 'image' | 'video';
  youtubeId?: string;
}

// YouTube URL'sinden ID çıkarma fonksiyonu
export function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  
  // YouTube URL formatları:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return match && match[2].length === 11 ? match[2] : null;
}

// JSON dosya yolu
const galleryFilePath = path.join(process.cwd(), 'src/app/data/json/gallery.json');

// Tüm galeri öğelerini getir
export async function getAllGalleryItems(): Promise<GalleryItem[]> {
  try {
    if (!fs.existsSync(galleryFilePath)) {
      return [];
    }
    
    const fileContents = fs.readFileSync(galleryFilePath, 'utf8');
    const items = JSON.parse(fileContents) as GalleryItem[];
    
    // Sıralama düzenini uygula
    return items.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Galeri verileri okunurken hata oluştu:', error);
    return [];
  }
}

// Galeri öğelerini kaydet
export async function saveGalleryItems(items: GalleryItem[]): Promise<boolean> {
  try {
    // Öğeleri sıraya göre güncelle
    const sortedItems = items.sort((a, b) => a.order - b.order);
    
    // Dizini kontrol et ve oluştur
    const dir = path.dirname(galleryFilePath);
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(galleryFilePath, JSON.stringify(sortedItems, null, 2));
    return true;
  } catch (error) {
    console.error('Galeri verileri kaydedilirken hata oluştu:', error);
    return false;
  }
}

// Galeri öğesi sil
export async function deleteGalleryItem(id: string): Promise<boolean> {
  try {
    const items = await getAllGalleryItems();
    const filteredItems = items.filter(item => item.id !== id);
    
    // Silinen öğeden sonraki öğelerin sırasını güncelle
    for (let i = 0; i < filteredItems.length; i++) {
      filteredItems[i].order = i;
    }
    
    return await saveGalleryItems(filteredItems);
  } catch (error) {
    console.error('Galeri öğesi silinirken hata oluştu:', error);
    return false;
  }
}

// Yeni galeri öğesi ekle
export async function addGalleryItem(
  item: Omit<GalleryItem, 'id' | 'order'> & { youtubeUrl?: string }
): Promise<GalleryItem | null> {
  try {
    const items = await getAllGalleryItems();
    
    // YouTube URL'sinden ID'yi çıkar
    let youtubeId = item.youtubeId;
    if (item.youtubeUrl && !youtubeId) {
      youtubeId = extractYoutubeId(item.youtubeUrl);
    }
    
    const newItem: GalleryItem = {
      id: uuidv4(),
      image: item.image || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : ''),
      youtubeId: youtubeId || undefined,
      titleTR: item.titleTR,
      titleEN: item.titleEN,
      descriptionTR: item.descriptionTR,
      descriptionEN: item.descriptionEN,
      category: item.category,
      order: items.length,
      active: item.active,
      type: youtubeId ? 'video' : 'image',
    };
    
    items.push(newItem);
    
    if (await saveGalleryItems(items)) {
      return newItem;
    }
    return null;
  } catch (error) {
    console.error('Galeri öğesi eklenirken hata oluştu:', error);
    return null;
  }
}

// Galeri öğesi güncelle
export async function updateGalleryItem(updatedItem: GalleryItem & { youtubeUrl?: string }): Promise<GalleryItem | null> {
  try {
    const items = await getAllGalleryItems();
    const index = items.findIndex(item => item.id === updatedItem.id);
    
    if (index === -1) {
      console.error('Güncellenecek galeri öğesi bulunamadı');
      return null;
    }
    
    // YouTube URL'sinden ID'yi çıkar
    if (updatedItem.youtubeUrl) {
      updatedItem.youtubeId = extractYoutubeId(updatedItem.youtubeUrl);
      if (updatedItem.youtubeId) {
        updatedItem.type = 'video';
        if (!updatedItem.image) {
          updatedItem.image = `https://img.youtube.com/vi/${updatedItem.youtubeId}/hqdefault.jpg`;
        }
      }
    }
    
    // YouTube ID varsa tip video, yoksa image olsun
    updatedItem.type = updatedItem.youtubeId ? 'video' : 'image';
    
    items[index] = {
      ...updatedItem,
      youtubeUrl: undefined // youtubeUrl veritabanında saklanmasın
    };
    
    if (await saveGalleryItems(items)) {
      return updatedItem;
    }
    return null;
  } catch (error) {
    console.error('Galeri öğesi güncellenirken hata oluştu:', error);
    return null;
  }
}

// Galeri öğelerinin sırasını güncelle
export async function updateGalleryItemsOrder(itemIds: string[]): Promise<boolean> {
  try {
    const items = await getAllGalleryItems();
    
    // Yeni sıralamaya göre öğeleri güncelle
    const updatedItems = itemIds.map((id, index) => {
      const item = items.find(item => item.id === id);
      if (item) {
        return { ...item, order: index };
      }
      return null;
    }).filter(Boolean) as GalleryItem[];
    
    // Sıralanmamış öğeleri ekle
    const unsortedItems = items.filter(item => !itemIds.includes(item.id));
    const allItems = [...updatedItems, ...unsortedItems];
    
    return await saveGalleryItems(allItems);
  } catch (error) {
    console.error('Galeri öğelerinin sırası güncellenirken hata oluştu:', error);
    return false;
  }
}

// ID'ye göre galeri öğesi getir
export async function getGalleryItemById(id: string): Promise<GalleryItem | null> {
  try {
    const items = await getAllGalleryItems();
    return items.find(item => item.id === id) || null;
  } catch (error) {
    console.error('Galeri öğesi alınırken hata oluştu:', error);
    return null;
  }
}

// Dil bazında galeri öğelerini getir
export async function getGalleryForLanguage(lang: string): Promise<GalleryItem[]> {
  try {
    const items = await getAllGalleryItems();
    
    // Sıralamaya göre öğeleri sırala
    return items.sort((a, b) => a.order - b.order).map(item => ({
      ...item,
      titleTR: lang === 'tr' ? item.titleTR : item.titleEN,
      titleEN: lang === 'en' ? item.titleTR : item.titleEN,
    })) as GalleryItem[];
  } catch (error) {
    console.error(`${lang} dili için galeri verileri getirilirken hata oluştu:`, error);
    return [];
  }
}