import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Slider öğesi arayüzü
export interface SliderItem {
  id: string;
  image: string;
  videoUrl?: string; // Video URL (isteğe bağlı)
  titleTR: string;
  titleEN: string;
  subtitleTR: string;
  subtitleEN: string;
  descriptionTR: string;
  descriptionEN: string;
  order: number;
  active: boolean;
}

// API bağlantıları
const API_URL = '/api/slider';
const REORDER_API_URL = '/api/slider/reorder';

// Tüm slider öğelerini getir (admin için)
export async function getAllSliderData(): Promise<SliderItem[]> {
  try {
    console.log('Admin: Tüm slider verilerini getir - API URL:', API_URL);
    
    const response = await axios.get(API_URL, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (response.status === 200 && response.data) {
      console.log(`Admin: ${response.data.length} slider öğesi başarıyla yüklendi`);
      
      // API'den boş veri gelmesi durumunda default veri
      if (!response.data || response.data.length === 0) {
        console.warn('Admin: API boş veri döndürdü, varsayılan veri kullanılıyor');
        return getDefaultSliderData();
      }

      return response.data;
    } else {
      throw new Error(`API beklenmeyen yanıt döndürdü: ${response.status}`);
    }
  } catch (error) {
    console.error('Admin: Slider verileri getirilirken hata oluştu:', error);
    console.log('Admin: Varsayılan slider verisi kullanılacak');
    return getDefaultSliderData();
  }
}

// Ana sayfa için aktif slider öğelerini getir
export async function getSliderData(): Promise<SliderItem[]> {
  try {
    console.log('Anasayfa: Slider verilerini getir - API URL:', API_URL);
    
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.warn('API yanıtı başarısız, varsayılan veriler kullanılıyor');
      return filterActiveSliderItems(getDefaultSliderData());
    }

    const data = await response.json();
    
    // API'den boş veri gelmesi durumunda varsayılan veri
    if (!data || data.length === 0) {
      console.warn('Anasayfa: API boş veri döndürdü, varsayılan veri kullanılıyor');
      return filterActiveSliderItems(getDefaultSliderData());
    }
    
    return filterActiveSliderItems(data);
  } catch (error) {
    console.error('Slider verileri alınırken hata oluştu:', error);
    // Hata durumunda varsayılan veri kullan
    return filterActiveSliderItems(getDefaultSliderData());
  }
}

// Aktif slider öğelerini filtrele ve sırala
function filterActiveSliderItems(items: SliderItem[]): SliderItem[] {
  return items
    .filter(item => item.active)
    .sort((a, b) => a.order - b.order);
}

// Yeni slider öğesi ekle
export async function addSliderItem(item: Omit<SliderItem, 'id' | 'order'>): Promise<SliderItem | null> {
  try {
    console.log('Admin: Yeni slider öğesi ekleniyor');
    // Mevcut tüm öğeleri al
    const currentItems = await getAllSliderData();
    
    // Yeni öğe için kimlik ve sıra numarası oluştur
    const newItem: SliderItem = {
      ...item,
      id: uuidv4(),
      order: currentItems.length + 1
    };

    // Görsel yolunu düzelt (eğer tam URL değilse)
    if (newItem.image && !newItem.image.startsWith('http') && !newItem.image.startsWith('/')) {
      newItem.image = `/${newItem.image}`;
    }

    console.log('Admin: Yeni öğe oluşturuldu:', newItem);

    const response = await axios.post(API_URL, newItem, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });

    if (response.status === 201 && response.data) {
      console.log('Admin: Yeni slider öğesi başarıyla eklendi:', response.data);
      return response.data;
    } else {
      throw new Error(`API beklenmeyen yanıt döndürdü: ${response.status}`);
    }
  } catch (error) {
    console.error('Admin: Slider öğesi eklenirken hata oluştu:', error);
    return null;
  }
}

// Slider öğesini güncelle
export async function updateSliderItem(id: string, updates: Partial<Omit<SliderItem, 'id' | 'order'>>): Promise<SliderItem | null> {
  try {
    console.log('Admin: Slider öğesi güncelleniyor:', id);
    
    // Görsel yolunu düzelt (eğer tam URL değilse)
    const updatedItem = { ...updates, id };
    if (updatedItem.image && !updatedItem.image.startsWith('http') && !updatedItem.image.startsWith('/')) {
      updatedItem.image = `/${updatedItem.image}`;
    }

    const response = await axios.put(API_URL, updatedItem, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });

    if (response.status === 200 && response.data) {
      console.log('Admin: Slider öğesi başarıyla güncellendi:', response.data);
      return response.data;
    } else {
      throw new Error(`API beklenmeyen yanıt döndürdü: ${response.status}`);
    }
  } catch (error) {
    console.error('Admin: Slider öğesi güncellenirken hata oluştu:', error);
    return null;
  }
}

// Slider öğesini sil
export async function deleteSliderItem(id: string): Promise<boolean> {
  try {
    console.log('Admin: Slider öğesi siliniyor:', id);
    const response = await axios.delete(`${API_URL}?id=${id}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });

    if (response.status === 200) {
      console.log('Admin: Slider öğesi başarıyla silindi');
      return true;
    } else {
      throw new Error(`API beklenmeyen yanıt döndürdü: ${response.status}`);
    }
  } catch (error) {
    console.error('Admin: Slider öğesi silinirken hata oluştu:', error);
    return false;
  }
}

// Slider öğelerini yeniden sırala
export async function reorderSliderItems(orderedIds: { id: string; order: number }[]): Promise<SliderItem[] | null> {
  try {
    console.log('Admin: Slider öğeleri yeniden sıralanıyor');
    const response = await axios.post(REORDER_API_URL, orderedIds, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });

    if (response.status === 200 && response.data) {
      console.log('Admin: Slider öğeleri başarıyla yeniden sıralandı');
      return response.data;
    } else {
      throw new Error(`API beklenmeyen yanıt döndürdü: ${response.status}`);
    }
  } catch (error) {
    console.error('Admin: Slider öğeleri yeniden sıralanırken hata oluştu:', error);
    return null;
  }
}

// Varsayılan slider verisi
function getDefaultSliderData(): SliderItem[] {
  console.log('Varsayılan slider verisi kullanılıyor');
  return [
    {
      id: '1',
      image: '/images/slider/slider-1.jpg',
      titleTR: 'Doğa ile İç İçe',
      titleEN: 'In Harmony with Nature',
      subtitleTR: 'Huzur dolu bir tatil',
      subtitleEN: 'A peaceful holiday',
      descriptionTR: 'Doğanın kalbinde unutulmaz bir tatil deneyimi',
      descriptionEN: 'An unforgettable holiday experience in the heart of nature',
      order: 1,
      active: true
    },
    {
      id: '2',
      image: '/images/slider/slider-2.jpg',
      titleTR: 'Konforlu Odalar',
      titleEN: 'Comfortable Rooms',
      subtitleTR: 'Evinizi aratmayacak konfor',
      subtitleEN: 'Comfort that won\'t make you miss home',
      descriptionTR: 'Modern olanaklarla donatılmış ferah odalar',
      descriptionEN: 'Spacious rooms equipped with modern amenities',
      order: 2,
      active: true
    }
  ];
} 