import { v4 as uuidv4 } from 'uuid';
// JSX kullanımını kaldırıp sadece import tanımlamalarını kullanıyoruz
import { IconType } from 'react-icons';
import { FaUtensils, FaSwimmingPool, FaSpa, FaDumbbell, FaConciergeBell, FaWifi, FaParking, FaShuttleVan, FaCoffee, FaGlassCheers } from 'react-icons/fa'; // Corrected: FaConciergeBell
// Removed incorrect import: import { ServiceItem } from '@/app/types/serviceTypes';
import { prisma } from '../../../lib/db';
import { getBaseUrl as utilsGetBaseUrl, isClient, isServer } from '@/lib/utils';

// Servis Öğesi Arayüzü (Defined here)
export interface ServiceItem {
  id: string;
  titleTR: string;
  titleEN: string;
  descriptionTR: string;
  descriptionEN: string;
  detailsTR: string[];
  detailsEN: string[];
  image: string;
  images: string[];
  gallery?: string[];
  icon: string; // Icon adı ('utensils', 'swimming-pool' vs.)
  active: boolean;
  order: number;
}

// Site tarafında kullanılacak servis arayüzü
export interface SiteService {
  id: string;
  title: string;
  description: string;
  details: string[];
  image: string;
  images: string[];
  icon: string;
  order: number;
}

// Varsayılan veri - İlk yüklemede kullanılacak
const initialServiceData: ServiceItem[] = [
  {
    id: 'restaurant',
    titleTR: 'Restoran',
    titleEN: 'Restaurant',
    descriptionTR: 'Yerel ve uluslararası lezzetlerin buluştuğu restoranımızda, taze malzemelerle hazırlanmış zengin bir menü sunuyoruz. Sabah kahvaltısından akşam yemeğine kadar, konuklarımıza unutulmaz bir yemek deneyimi yaşatıyoruz.',
    descriptionEN: 'In our restaurant, where local and international flavors meet, we offer a rich menu prepared with fresh ingredients. From breakfast to dinner, we provide our guests with an unforgettable dining experience.',
    detailsTR: [
      'Açık Büfe Kahvaltı', 
      'A La Carte Akşam Yemeği', 
      'Özel Diyet Menüleri', 
      'Yöresel Lezzetler'
    ],
    detailsEN: [
      'Buffet Breakfast', 
      'A La Carte Dinner', 
      'Special Diet Menus', 
      'Local Specialties'
    ],
    image: '/images/restaurant/restaurant1.jpg',
    images: [
      '/images/restaurant/restaurant1.jpg',
      '/images/restaurant/restaurant2.jpg',
      '/images/restaurant/restaurant3.jpg',
      '/images/restaurant/restaurant4.jpg',
      '/images/restaurant/restaurant5.jpg'
    ],
    icon: 'utensils',
    active: true,
    order: 1
  },
  {
    id: 'pool',
    titleTR: 'Havuz',
    titleEN: 'Swimming Pool',
    descriptionTR: 'Açık ve kapalı yüzme havuzlarımızda ferahlamanın ve eğlenmenin tadını çıkarabilirsiniz. Kaydıraklı havuzumuz çocuklar için özel olarak tasarlanmıştır. Her mevsim kullanılabilen havuzlarımız, konuklarımızın rahatı için özenle tasarlanmıştır.',
    descriptionEN: 'You can enjoy refreshing and having fun in our indoor and outdoor swimming pools. Our pool with slides is specially designed for children. Our pools, which can be used in all seasons, are carefully designed for the comfort of our guests.',
    detailsTR: [
      'Isıtmalı Açık Havuz', 
      'Kapalı Havuz', 
      'Çocuk Havuzu', 
      'Kaydıraklı Havuz', 
      'Havuz Bar Servisi'
    ],
    detailsEN: [
      'Heated Outdoor Pool', 
      'Indoor Pool', 
      'Children\'s Pool', 
      'Pool with Slides', 
      'Pool Bar Service'
    ],
    image: '/images/gallery/pool.jpg',
    images: [
      '/images/gallery/pool.jpg',
      '/images/gallery/pool2.jpg',
      '/images/gallery/pool3.jpg',
      '/images/gallery/pool4.jpg',
      '/images/gallery/pool5.jpg',
      '/images/gallery/pool6.jpg',
      '/images/gallery/pool7.jpg',
      '/images/gallery/pool8.jpg',
      '/images/gallery/pool9.jpg'
    ],
    icon: 'swimming-pool',
    active: true,
    order: 2
  }
];

// API'den servisleri çekme temel fonksiyonu - önbelleklemeyi engellemek için
async function fetchServicesData(): Promise<ServiceItem[]> {
  const timestamp = Date.now(); // Önbelleği kırmak için zaman damgası
  try {
    console.log(`[fetchServicesData] Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    const baseUrl = utilsGetBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success ? data.items : initialServiceData;
  } catch (error) {
    console.error('Servis verileri çekme hatası:', error);
    return initialServiceData;
  }
}

// Removed unused caching logic
// let servicesCache: ServiceItem[] | null = null;
// let cacheTimestamp: number = 0;
// const CACHE_TTL = 0;
// const getServiceDataWithCache = async (): Promise<ServiceItem[]> => { ... };

// Önbelleği temizle (veri güncellendiğinde çağrılır) - Keep clearCache if used by update/add/delete
const clearCache = () => {
  console.log('Önbellek temizleniyor...');
  // Removed unused cache variables
  // servicesCache = null;
  // cacheTimestamp = 0;
  
  // LocalStorage kullanımını kaldırdık, doğrudan JSON dosyasına yazıyoruz
};

// Servis verilerini dil bazlı getir (site tarafı) (Return type updated)
export async function getServicesData(lang: string): Promise<SiteService[]> {
  try {
    console.log(`[getServicesData] Dil: ${lang}, Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    // Doğrudan public API'den veri çek
    const timestamp = Date.now();
    const baseUrl = utilsGetBaseUrl();
    
    const response = await fetch(`${baseUrl}/api/services?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'API hatası');
    }

    // Zaten API aktif servisleri filtreliyor, şimdi sadece dil dönüşümü yapalım (Add types)
    return data.items.map((item: ServiceItem): SiteService => ({
      id: item.id,
      title: lang === 'tr' ? item.titleTR : item.titleEN,
      description: lang === 'tr' ? item.descriptionTR : item.descriptionEN,
      details: lang === 'tr' ? item.detailsTR : item.detailsEN,
      image: item.image,
      images: item.images || [item.image], // Eğer images dizisi yoksa, image'ı dizi olarak kullan
      icon: item.icon,
      order: item.order
    }));
  } catch (error) {
    console.error('Servis verileri çekme hatası:', error);
    return []; // Hata durumunda boş dizi döndür
  }
}

// Tüm servis verilerini getir (admin tarafı)
export async function getAllServicesData(): Promise<ServiceItem[]> {
  // Her zaman taze veri çek
  try {
    const timestamp = Date.now(); // Her seferinde benzersiz timestamp ile önbelleği engelle
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/admin/services?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error('Servis verileri getirilemedi');
    }
    
    const data = await response.json();
    
    if (data.success) {
      return data.items.sort((a: ServiceItem, b: ServiceItem) => a.order - b.order);
    } else {
      throw new Error(data.message || 'API hatası');
    }
  } catch (error) {
    console.error('Servis verileri çekme hatası:', error);
    return [];
  }
}

// ID'ye göre servis detayı getir (doğrudan API'den)
export async function getServiceById(id: string): Promise<ServiceItem | null> {
  try {
    console.log(`[getServiceById] ID: ${id}, Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    if (isServer && prisma) {
      // Sunucu tarafında prisma kullan
      console.log('[getServiceById] Sunucu tarafında prisma kullanılıyor');
      
      const service = await prisma.services.findUnique({
        where: { id }
      });
      
      if (!service) return null;
      
      return {
        id: service.id,
        titleTR: service.titleTR || '',
        titleEN: service.titleEN || '',
        descriptionTR: service.descriptionTR || '',
        descriptionEN: service.descriptionEN || '',
        detailsTR: service.detailsTR || [],
        detailsEN: service.detailsEN || [],
        image: service.image || '',
        images: service.images as string[] || [],
        icon: service.icon || '',
        order: service.order || 0,
        active: service.active
      };
    }
    
    // Client tarafında API kullan
    console.log('[getServiceById] API kullanılıyor');
    const baseUrl = utilsGetBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API yanıt hatası: ${response.status}`);
    }
    
    const data = await response.json();
    return data.success ? data.item : null;
  } catch (error) {
    console.error(`Servis getirme hatası (ID: ${id}):`, error);
    return null;
  }
}

// Servis öğesini güncelle
export async function updateServiceItem(id: string, service: Partial<ServiceItem>): Promise<ServiceItem | null> {
  try {
    const timestamp = Date.now();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/admin/services/${id}?t=${timestamp}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(service),
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error(`API yanıtı hatalı: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Başarılı olursa önbelleği temizle
    if (data.success) {
      clearCache();
    }
    
    return data.success ? data.item : null;
  } catch (error) {
    console.error('Hizmet güncelleme hatası:', error);
    return null;
  }
}

// Servis galerisi güncelle
export async function updateServiceGallery(id: string, galleryData: { image: string, images: string[] }): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/admin/services/${id}/gallery?t=${timestamp}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify(galleryData),
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error('Servis galerisi güncellenirken hata oluştu');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Servis galerisi güncellenemedi');
    }
    
    clearCache(); // Önbelleği temizle
    return true;
  } catch (error) {
    console.error('Servis galerisi güncelleme hatası:', error);
    return false;
  }
}

// Temel URL yardımcı fonksiyonu
const getBaseUrl = (): string => {
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
};

// Yeni servis ekle
export async function addServiceItem(newItem: Omit<ServiceItem, 'id'>): Promise<ServiceItem | null> {
  try {
    const baseUrl = getBaseUrl();
    
    // Gönderi verilerini hazırla
    const serviceData = {
      ...newItem,
      id: uuidv4()
    };
    
    console.log('Gönderilecek servis verisi:', JSON.stringify(serviceData, null, 2));
    
    // API endpoint'i slash ile bitmeli
    const url = baseUrl + '/api/admin/services/';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData)
    });
    
    console.log('API yanıtı durumu:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API yanıtı hata kodu:', response.status);
      console.error('API yanıt içeriği:', errorText);
      throw new Error(`Servis eklenirken hata oluştu: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      clearCache(); // Önbelleği temizle
      
      // WebSocket bildirimi gönder
      try {
        await fetch(`${baseUrl}/api/websocket/notify?topic=services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'serviceAdded', id: data.id })
        });
      } catch (error) {
        console.warn('WebSocket bildirimi gönderilemedi:', error);
      }
      
      // API sadece id döndürdüğü için serviceData'yı id ile döndür
      return {
        ...serviceData,
        id: data.id || serviceData.id
      };
    } else {
      throw new Error(data.message || 'Servis eklenemedi');
    }
  } catch (error: any) {
    console.error('Servis ekleme hatası:', error);
    throw error; // Hatayı yakalamak yerine fırlat
  }
}

// Servis sil
export async function deleteServiceItem(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${getBaseUrl()}/api/admin/services/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error('Servis silinirken hata oluştu');
    }
    
    const data = await response.json();
    
    if (data.success) {
      clearCache(); // Önbelleği temizle
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Servis silme hatası:', error);
    return false;
  }
}

// Servis görünürlüğü değiştir
export async function toggleServiceVisibility(id: string): Promise<boolean> {
  try {
    // Önce mevcut durumu al
    const service = await getServiceById(id);
    if (!service) return false;
    
    // Görünürlüğü tersine çevir
    const response = await updateServiceItem(id, { active: !service.active });
    
    return response !== null;
  } catch (error) {
    console.error('Görünürlük değiştirme hatası:', error);
    return false;
  }
}

// Servis görseli yükle
export async function uploadServiceImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'services');
    
    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Görsel yüklenirken hata oluştu');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Görsel yüklenemedi');
    }
    
    return data.url;
  } catch (error) {
    console.error('Görsel yükleme hatası:', error);
    throw error;
  }
}

// Servis görseli ekle
export async function addImageToServiceGallery(id: string, imagePath: string): Promise<boolean> {
  try {
    // Mevcut servis detaylarını al
    const service = await getServiceById(id);
    if (!service) return false;
    
    // Görsel zaten galeride varsa ekleme
    if (service.images.includes(imagePath)) {
      return true;
    }
    
    // Yeni görseli ekle
    const updatedImages = [...service.images, imagePath];
    
    // Servisi güncelle
    const updatedService = await updateServiceItem(id, { 
      images: updatedImages,
      // Ana görsel yoksa, ilk görseli ana görsel olarak ayarla
      image: service.image || imagePath
    });
    
    return updatedService !== null;
  } catch (error) {
    console.error('Görsel ekleme hatası:', error);
    return false;
  }
}

// Servis galerisinden görsel kaldır
export async function removeImageFromServiceGallery(id: string, imagePath: string): Promise<boolean> {
  try {
    // Mevcut servis detaylarını al
    const service = await getServiceById(id);
    if (!service) return false;

    // Görseli galeriden kaldır (Added string type for img)
    const updatedImages = service.images.filter((img: string) => img !== imagePath);

    // Güncelleme verisi hazırla
    const updateData: Partial<ServiceItem> = { images: updatedImages };
    
    // Eğer silinen görsel ana görsel ise, yeni ana görseli ayarla
    if (service.image === imagePath && updatedImages.length > 0) {
      updateData.image = updatedImages[0];
    } else if (service.image === imagePath && updatedImages.length === 0) {
      updateData.image = '';
    }
    
    // Servisi güncelle
    const updatedService = await updateServiceItem(id, updateData);
    
    return updatedService !== null;
  } catch (error) {
    console.error('Görsel kaldırma hatası:', error);
    return false;
  }
}

// Çoklu görsel yükle
export async function uploadMultipleServiceImages(files: FileList): Promise<string[]> {
  try {
    const uploadedImages: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imagePath = await uploadServiceImage(file);
      uploadedImages.push(imagePath);
    }
    
    return uploadedImages;
  } catch (error) {
    console.error('Çoklu görsel yükleme hatası:', error);
    throw error;
  }
}

// Servisleri yeniden sırala
export async function reorderServices(items: {id: string, order: number}[]): Promise<boolean> {
  try {
    const timestamp = Date.now();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/api/admin/services/reorder?t=${timestamp}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ items }),
      cache: 'no-store',
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      throw new Error('Servisler yeniden sıralanırken hata oluştu');
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Servisler yeniden sıralanamadı');
    }
    
    clearCache(); // Önbelleği temizle
    return true;
  } catch (error) {
    console.error('Servis sıralama hatası:', error);
    return false;
  }
}

// Icon seçeneklerini getir
export function getIconOptions() {
  return [
    { value: 'utensils', label: 'Restoran' },
    { value: 'swimming-pool', label: 'Havuz' },
    { value: 'spa', label: 'Spa' },
    { value: 'dumbbell', label: 'Fitness' },
    { value: 'concierge-bell', label: 'Resepsiyon' },
    { value: 'wifi', label: 'Wi-Fi' },
    { value: 'parking', label: 'Otopark' },
    { value: 'shuttle-van', label: 'Transfer' },
    { value: 'coffee', label: 'Kahve' },
    { value: 'glass-cheers', label: 'Bar' }
  ];
}

// İkon adına göre ikon bileşeni için fabrika fonksiyonu (Removed unused className)
export function getIconComponent(iconName: string): IconType {
  // İkon adına göre uygun ikonu döndüren bir fabrika fonksiyonu
  const iconMap: Record<string, IconType> = {
    'utensils': FaUtensils,
    'swimming-pool': FaSwimmingPool,
    'spa': FaSpa,
    'dumbbell': FaDumbbell,
    'concierge-bell': FaConciergeBell, // Corrected: FaConciergeBell
    'wifi': FaWifi,
    'parking': FaParking,
    'shuttle-van': FaShuttleVan,
    'coffee': FaCoffee,
    'glass-cheers': FaGlassCheers
  };
  
  return iconMap[iconName] || FaUtensils; // Bulunamazsa varsayılan ikon döndür
}

// Tüm servisleri getir admin için
export async function getAllServices(): Promise<ServiceItem[]> {
  try {
    console.log(`[getAllServices] Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    if (isServer && prisma) {
      // Server tarafındayız ve prisma erişilebilir
      console.log('[getAllServices] Sunucu tarafında prisma kullanılıyor');
      
      const services = await prisma.services.findMany({
        orderBy: {
          order: 'asc'
        }
      });
      
      return services.map(service => ({
        id: service.id,
        titleTR: service.titleTR || '',
        titleEN: service.titleEN || '',
        descriptionTR: service.descriptionTR || '',
        descriptionEN: service.descriptionEN || '',
        detailsTR: service.detailsTR || '',
        detailsEN: service.detailsEN || '',
        image: service.image || '',
        images: service.images as string[] || [],
        icon: service.icon || '',
        order: service.order || 0,
        active: service.active
      }));
    }
    
    // API üzerinden servisleri getir (client tarafı veya prisma'ya erişim yok)
    console.log('[getAllServices] API kullanılıyor');
    return await fetchServicesData();
  } catch (error) {
    console.error('Servis verileri getirme hatası:', error);
    return initialServiceData;
  }
}

// Servis ekleme (admin panel)
export async function addService(service: Omit<ServiceItem, 'id'>): Promise<ServiceItem | null> {
  try {
    console.log(`[addService] Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    const baseUrl = utilsGetBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(service)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API yanıt hatası: ${response.status}, ${errorText}`);
    }
    
    const data = await response.json();
    return data.success ? data.item : null;
  } catch (error) {
    console.error('Servis ekleme hatası:', error);
    return null;
  }
}

// Servis güncelleme (admin panel)
export async function updateService(id: string, serviceData: Partial<ServiceItem>): Promise<boolean> {
  try {
    console.log(`[updateService] ID: ${id}, Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    const baseUrl = utilsGetBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serviceData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API yanıt hatası: ${response.status}, ${errorText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`Servis güncelleme hatası (ID: ${id}):`, error);
    return false;
  }
}

// Servis silme (admin panel)
export async function deleteService(id: string): Promise<boolean> {
  try {
    console.log(`[deleteService] ID: ${id}, Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    const baseUrl = utilsGetBaseUrl();
    const response = await fetch(`${baseUrl}/api/admin/services/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API yanıt hatası: ${response.status}, ${errorText}`);
    }
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error(`Servis silme hatası (ID: ${id}):`, error);
    return false;
  }
}
