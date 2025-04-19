'use client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-hot-toast';

// Slider öğesi arayüzü
export interface SliderItem {
  id: string;
  image: string;
  videoUrl?: string; // Video URL (isteğe bağlı)
  titleTR: string;
  titleEN: string;
  subtitleTR?: string;
  subtitleEN?: string;
  descriptionTR?: string;
  descriptionEN?: string;
  order: number;
  active?: boolean;
}

interface NewSliderItem {
  titleTR: string;
  titleEN: string;
  subtitleTR?: string;
  subtitleEN?: string;
  descriptionTR?: string;
  descriptionEN?: string;
  image: string;
  videoUrl?: string;
}

// API bağlantıları
const API_URL = '/api/hero-slider';
const REORDER_API_URL = '/api/hero-slider/reorder';
const UPLOAD_API_URL = '/api/admin/slider/upload';

// Medya yükleme fonksiyonu (ImageKit kullanarak)
export async function uploadSliderMedia(file: File): Promise<{fileUrl: string, fileId: string, fileType: string} | null> {
  try {
    console.log('Admin: Slider medyası yükleniyor');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'slider');
    
    const response = await fetch(UPLOAD_API_URL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Medya yüklenirken bir hata oluştu');
    }
    
    const data = await response.json();
    
    if (data.success && data.fileUrl) {
      console.log('Admin: Medya başarıyla yüklendi:', data.fileUrl);
      return {
        fileUrl: data.fileUrl,
        fileId: data.fileId || '',
        fileType: data.fileType || (data.fileUrl.includes('.mp4') ? 'video' : 'image')
      };
    } else {
      throw new Error('Medya yükleme yanıtı geçersiz');
    }
  } catch (error) {
    console.error('Admin: Slider medyası yüklenirken hata oluştu:', error);
    return null;
  }
}

// Tüm slider öğelerini getir
export async function getAllSliderData(): Promise<SliderItem[]> {
  try {
    console.log('getAllSliderData: API isteği gönderiliyor...');
    
    const timestamp = new Date().getTime(); // Önbellek sorunlarını önlemek için
    const response = await fetch(`${API_URL}/?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
    // Hata kontrolü
    if (!response.ok) {
      console.error('Slider verileri çekilirken HTTP hatası:', response.status, response.statusText);
      
      // Hata mesajını almaya çalış
      let errorMsg = 'API isteği başarısız oldu';
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {
        // JSON çözümlenemezse orijinal hata mesajını kullan
      }
      
      throw new Error(`Slider verileri alınamadı: ${errorMsg}`);
    }
    
    // Yanıtı analiz et
    const responseText = await response.text();
    console.log('API ham yanıtı:', responseText.substring(0, 200) + '...');
    
    // JSON'a dönüştürmeyi dene
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('API yanıtı JSON olarak ayrıştırılamadı:', error);
      throw new Error('API yanıtı geçersiz JSON formatında');
    }
    
    // API yanıt formatını kontrol et
    if (!data || typeof data !== 'object') {
      console.error('API yanıtı geçersiz format (nesne değil):', data);
      throw new Error('API yanıt formatı geçersiz (nesne değil)');
    }
    
    if (!data.success && data.message) {
      console.error('API başarısız yanıt döndü:', data.message);
      throw new Error(`API hatası: ${data.message}`);
    }
    
    if (!Array.isArray(data.data)) {
      console.error('API yanıtında data dizisi yok:', data);
      throw new Error('API yanıt formatı geçersiz (data dizisi yok)');
    }
    
    // Veri yapısını düzenleme
    const mappedData = data.data.map((item: any) => {
      // image kullanılacak alanı kontrol et
      if (item.imageUrl && !item.image) {
        item.image = item.imageUrl;
      } else if (!item.image && item.image === "") {
        item.image = ""; // Boş bırak
      }
      
      // order/orderNumber alanını kontrol et
      if (item.orderNumber !== undefined && item.order === undefined) {
        item.order = item.orderNumber;
      }
      
      console.log('Dönüştürülen slider öğesi:', {
        id: item.id,
        titleTR: item.titleTR,
        image: item.image,
        order: item.order
      });
      
      return item;
    });
    
    console.log(`${mappedData.length} slider öğesi alındı`);
    return mappedData;
  } catch (error) {
    console.error('Slider verileri getirilirken hata:', error);
    toast.error('Slider verileri yüklenirken bir hata oluştu');
    return [];
  }
}

// Ana sayfa için aktif slider öğelerini getir
export async function getSliderData(): Promise<SliderItem[]> {
  try {
    console.log('Anasayfa: Slider verilerini getir - API URL:', API_URL);
    
    // Önbellek sorunlarını önlemek için zaman damgası ekle
    const timestamp = new Date().getTime();
    
    const response = await fetch(`${API_URL}/?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      console.warn('API yanıtı başarısız, varsayılan veriler kullanılıyor. Status:', response.status);
      return filterActiveSliderItems(getDefaultSliderData());
    }

    // Önce response.text() ile ham veriyi al
    const responseText = await response.text();
    console.log('API ham yanıtı (ilk 100 karakter):', responseText.substring(0, 100));
    
    // Sonra JSON'a dönüştür
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('API yanıtı JSON olarak ayrıştırılamadı:', error);
      return filterActiveSliderItems(getDefaultSliderData());
    }
    
    // Veri yapısını kontrol et
    if (!responseData || !responseData.success || !responseData.data) {
      console.warn('Anasayfa: API yanıtı geçersiz, varsayılan veri kullanılıyor');
      return filterActiveSliderItems(getDefaultSliderData());
    }
    
    const data = responseData.data;
    
    // API yanıtının yapısını kontrol et
    if (!Array.isArray(data)) {
      console.warn('Anasayfa: API yanıtı dizi değil, varsayılan veri kullanılıyor');
      return filterActiveSliderItems(getDefaultSliderData());
    }
    
    // Debug: API yanıtının yapısını konsola yazdır
    console.log('API yanıtı (veri sayısı):', data.length);
    if (data.length > 0) {
      console.log('İlk öğe örneği:', JSON.stringify({
        id: data[0].id,
        titleTR: data[0].titleTR,
        image: data[0].image?.substring(0, 50),
        videoUrl: data[0].videoUrl?.substring(0, 50)
      }));
    }
    
    // API'den boş veri gelmesi durumunda varsayılan veri
    if (data.length === 0) {
      console.warn('Anasayfa: API boş veri döndürdü, varsayılan veri kullanılıyor');
      return filterActiveSliderItems(getDefaultSliderData());
    }
    
    // Verilerin doğru formatta olduğundan emin ol (image alanı var mı?)
    const validatedData = data.map(item => {
      // Görsel alanını kontrol et
      if (!item.image && item.imageUrl) {
        console.log('Veri düzeltiliyor: imageUrl -> image', item.id);
        item.image = item.imageUrl;
      }
      
      // Order/sıra alanını kontrol et
      if (item.orderNumber !== undefined && item.order === undefined) {
        console.log('Veri düzeltiliyor: orderNumber -> order', item.id);
        item.order = item.orderNumber;
      }
      
      // Null değerleri string değerlere dönüştür
      if (item.titleTR === null) item.titleTR = '';
      if (item.titleEN === null) item.titleEN = '';
      if (item.subtitleTR === null) item.subtitleTR = '';
      if (item.subtitleEN === null) item.subtitleEN = '';
      if (item.descriptionTR === null) item.descriptionTR = '';
      if (item.descriptionEN === null) item.descriptionEN = '';
      
      // Görüntü ve video kontrolü
      if (!item.image && !item.videoUrl) {
        console.warn(`Uyarı: ${item.id} ID'li slider öğesinin görsel veya video URL'si yok`);
      }
      
      // İşlenmiş veriyi konsola yazdır
      console.log(`Slider öğesi ${item.id} işlendi:`, 
                 `image=${item.image?.substring(0, 30) || 'Yok'}`,
                 `videoUrl=${item.videoUrl?.substring(0, 30) || 'Yok'}`,
                 `order=${item.order}`);
      
      return item;
    });
    
    const activeItems = filterActiveSliderItems(validatedData);
    console.log(`${activeItems.length} aktif slider öğesi bulundu`);
    
    return activeItems;
  } catch (error) {
    console.error('Slider verileri alınırken hata oluştu:', error);
    // Hata durumunda varsayılan veri kullan
    return filterActiveSliderItems(getDefaultSliderData());
  }
}

// Slider öğelerini sırala (eski filtreleme kaldırıldı)
function filterActiveSliderItems(items: SliderItem[]): SliderItem[] {
  return items.sort((a, b) => a.order - b.order);
}

// Görsel URL'sini düzenle (nesne veya string olabilir)
function formatImageUrl(image: any): string {
  // Eğer image undefined veya null ise boş string döndür
  if (!image) {
    return '';
  }
  
  // Eğer image bir nesne ise
  if (typeof image === 'object') {
    // Nesne içinde url, fileUrl veya src özellikleri var mı kontrol et
    if (image.url) return image.url;
    if (image.fileUrl) return image.fileUrl;
    if (image.src) return image.src;
    
    // Olası özellikler yoksa ve nesne stringifiy edilebiliyorsa
    try {
      console.warn('Görsel nesnesi düzeltilemiyor, nesne detayları:', JSON.stringify(image));
    } catch (e) {
      console.error('Görsel nesnesi loglanamadı');
    }
    return '';
  }
  
  // Eğer image string ise ve URL formatında değilse
  if (typeof image === 'string') {
    if (!image.startsWith('http') && !image.startsWith('/')) {
      return `/${image}`;
    }
    return image;
  }
  
  // Diğer veri tipleri için boş string döndür
  console.warn('Beklenmeyen görsel veri tipi:', typeof image);
  return '';
}

// Yeni slider öğesi ekle
export async function addSliderItem(item: NewSliderItem): Promise<SliderItem | null> {
  try {
    console.log('addSliderItem: API isteği gönderiliyor...');
    
    // Veri işleme için özel kopyalama, null veya undefined değerleri temizleme
    const processedItem = {
      ...item,
      titleTR: item.titleTR?.trim() || '',
      titleEN: item.titleEN?.trim() || '',
      subtitleTR: item.subtitleTR?.trim() || null,
      subtitleEN: item.subtitleEN?.trim() || null,
      descriptionTR: item.descriptionTR?.trim() || null,
      descriptionEN: item.descriptionEN?.trim() || null,
      image: item.image || null,
      videoUrl: item.videoUrl || null
    };
    
    console.log('İstek gövdesi:', JSON.stringify(processedItem, null, 2));
    
    // Validasyon
    if (!processedItem.titleTR || !processedItem.titleEN) {
      const error = 'Başlık alanları zorunludur';
      console.error('Validasyon hatası:', error);
      toast.error(error);
      return null;
    }
    
    // Görsel veya video gerekli
    if (!processedItem.image && !processedItem.videoUrl) {
      const error = 'Görsel veya video gereklidir';
      console.error('Validasyon hatası:', error);
      toast.error(error);
      return null;
    }

    // fetch ile API isteği
    console.log(`POST isteği gönderiliyor: ${API_URL}`);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(processedItem),
    });
    
    // Yanıt durumunu kontrol et
    if (!response.ok) {
      // Hata yanıtını almaya çalış
      let errorMessage = `HTTP hatası: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('API hata yanıtı:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('API hata yanıtı ayrıştırılamadı:', e);
        try {
          const errorText = await response.text();
          console.error('API ham hata yanıtı:', errorText);
        } catch (textError) {
          console.error('API ham yanıt alınamadı:', textError);
        }
      }
      
      throw new Error(`Slider eklenirken API hatası: "${errorMessage}"`);
    }
    
    // Başarılı yanıtı ayrıştır
    const data = await response.json();
    console.log('API yanıtı:', data);
    
    // Başarı durumunu ve veri kontrolü
    if (!data.success || !data.data) {
      throw new Error(data.message || 'API yanıtında data nesnesi yok');
    }
    
    console.log('Yeni slider başarıyla eklendi:', data.data);
    toast.success('Slider öğesi başarıyla eklendi');
    
    return data.data;
  } catch (error) {
    console.error('Slider ekleme hatası:', error);
    let errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    toast.error(errorMessage);
    throw error; // Hatayı tekrar fırlat ki çağıran fonksiyon yakalasın
  }
}

// Slider öğesi güncelle
export async function updateSliderItem(id: string, item: Partial<SliderItem>): Promise<SliderItem | null> {
  try {
    console.log('updateSliderItem: API isteği gönderiliyor...', {id, item});
    
    if (!id) {
      toast.error('Güncellenecek slider ID gerekli');
      return null;
    }

    // fetch ile API isteği
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({...item, id}),
    });
    
    // Yanıt durumunu kontrol et
    if (!response.ok) {
      // Hata yanıtını almaya çalış
      let errorMessage = `HTTP hatası: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('API hata yanıtı:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('API hata yanıtı ayrıştırılamadı:', e);
        try {
          const errorText = await response.text();
          console.error('API ham hata yanıtı:', errorText);
        } catch (textError) {
          console.error('API ham yanıt alınamadı:', textError);
        }
      }
      
      toast.error(`Slider güncellenemedi: ${errorMessage}`);
      return null;
    }
    
    // Başarılı yanıtı ayrıştır
    const data = await response.json();
    console.log('API yanıtı:', data);
    
    // Başarı durumunu ve veri kontrolü
    if (!data.success || !data.data) {
      const errorMessage = data.message || 'API yanıtında data nesnesi yok';
      toast.error(`Slider güncellenemedi: ${errorMessage}`);
      return null;
    }
    
    console.log('Slider başarıyla güncellendi:', data.data);
    toast.success('Slider başarıyla güncellendi');
    return data.data;
  } catch (error) {
    console.error('Slider güncellenirken hata:', error);
    toast.error('Slider güncellenirken bir hata oluştu');
    return null;
  }
}

// Slider öğesi sil
export async function deleteSliderItem(id: string): Promise<boolean> {
  try {
    console.log('deleteSliderItem: API isteği gönderiliyor...', id);
    
    if (!id) {
      toast.error('Silinecek slider ID gerekli');
      return false;
    }
    
    // fetch ile API isteği
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    
    // Yanıt durumunu kontrol et
    if (!response.ok) {
      // Hata yanıtını almaya çalış
      let errorMessage = `HTTP hatası: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('API hata yanıtı:', errorData);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('API hata yanıtı ayrıştırılamadı:', e);
        try {
          const errorText = await response.text();
          console.error('API ham hata yanıtı:', errorText);
        } catch (textError) {
          console.error('API ham yanıt alınamadı:', textError);
        }
      }
      
      toast.error(`Slider silinemedi: ${errorMessage}`);
      return false;
    }
    
    // Başarılı yanıtı ayrıştır
    const data = await response.json();
    console.log('API yanıtı:', data);
    
    // Başarı durumunu kontrol et
    if (!data.success) {
      const errorMessage = data.message || 'API yanıtı başarısız';
      toast.error(`Slider silinemedi: ${errorMessage}`);
      return false;
    }
    
    console.log('Slider başarıyla silindi:', data.data);
    toast.success('Slider başarıyla silindi');
    return true;
  } catch (error) {
    console.error('Slider silinirken hata:', error);
    toast.error('Slider silinirken bir hata oluştu');
    return false;
  }
}

// Slider sıralamasını güncelle
export async function reorderSliderItems(items: Partial<SliderItem>[]): Promise<SliderItem[]> {
  try {
    console.log('reorderSliderItems: API isteği gönderiliyor...', items);
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      toast.error('Geçerli sıralama verisi gerekli');
      return [];
    }
    
    const response = await fetch('/api/hero-slider/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items }),
    });
    
    // Ham yanıtı kontrol et
    const responseText = await response.text();
    console.log('Ham API yanıtı:', responseText);
    
    // JSON çözümleye çalış
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('API yanıtı JSON çözümleme hatası:', error);
      toast.error('Sunucu yanıtı geçersiz format');
      return [];
    }
    
    // Hata kontrolü
    if (!response.ok || !data.success) {
      const errorMsg = data.message || 'Bilinmeyen API hatası';
      console.error('Sıralama güncellenirken API hatası:', errorMsg);
      toast.error(`Sıralama güncellenemedi: ${errorMsg}`);
      return [];
    }
    
    console.log('Sıralama başarıyla güncellendi:', data.data);
    toast.success('Sıralama başarıyla güncellendi');
    return data.data;
  } catch (error) {
    console.error('Sıralama güncellenirken hata:', error);
    toast.error('Sıralama güncellenirken bir hata oluştu');
    return [];
  }
}

// Varsayılan slider verisi
function getDefaultSliderData(): SliderItem[] {
  console.log('Varsayılan slider verisi kullanılıyor');
  
  const defaultItems = [
    {
      id: 'default-1',
      image: '/images/default-slider-1.jpg',
      titleTR: 'Varsayılan Başlık 1',
      titleEN: 'Default Title 1',
      subtitleTR: 'Varsayılan Alt Başlık 1',
      subtitleEN: 'Default Subtitle 1',
      descriptionTR: 'Bu varsayılan bir açıklamadır. API çalışmadığında görünür.',
      descriptionEN: 'This is a default description. Shown when API is not working.',
      order: 1
    },
    {
      id: 'default-2',
      image: '/images/default-slider-2.jpg',
      titleTR: 'Varsayılan Başlık 2',
      titleEN: 'Default Title 2',
      subtitleTR: 'Varsayılan Alt Başlık 2',
      subtitleEN: 'Default Subtitle 2',
      descriptionTR: 'Bu varsayılan bir açıklamadır. API çalışmadığında görünür.',
      descriptionEN: 'This is a default description. Shown when API is not working.',
      order: 2
    }
  ];
  
  // /public klasöründe bu görseller var mı kontrol et
  const isRunningInBrowser = typeof window !== 'undefined';
  if (isRunningInBrowser) {
    // Varsayılan görsellerin URL'lerini test et
    defaultItems.forEach(item => {
      console.log(`Varsayılan görsel test ediliyor: ${item.image}`);
      // Test görsellerini değiştir - daha güvenilir bir seçenek
      item.image = '/images/placeholder.png';
    });
  }
  
  return defaultItems;
}

// Slider ekleme fonksiyonu
export const addSlider = async (data: Partial<SliderItem>): Promise<SliderItem | null> => {
  try {
    const response = await fetch('/api/hero-slider', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.item;
    }
    
    return null;
  } catch (error) {
    console.error('Slider ekleme hatası:', error);
    throw error;
  }
};

// Slider getirme fonksiyonu (ID'ye göre)
export const getSliderById = async (id: string): Promise<SliderItem | null> => {
  try {
    const response = await fetch(`/api/hero-slider/${id}`);
    
    if (!response.ok) {
      throw new Error(`API hatası: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.item;
    }
    
    return null;
  } catch (error) {
    console.error('Slider getirme hatası:', error);
    throw error;
  }
};

// Slider güncelleme fonksiyonu
export const updateSlider = async (id: string, data: Partial<SliderItem>): Promise<SliderItem | null> => {
  try {
    const response = await fetch(`/api/hero-slider/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      return result.item;
    }
    
    return null;
  } catch (error) {
    console.error('Slider güncelleme hatası:', error);
    throw error;
  }
};

// Slider silme fonksiyonu
export const deleteSlider = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/hero-slider/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`API hatası: ${response.status}`);
    }

    const result = await response.json();
    
    return result.success;
  } catch (error) {
    console.error('Slider silme hatası:', error);
    throw error;
  }
}; 