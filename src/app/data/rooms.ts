// Admin panelindeki oda verileri ile senkronize olacak fonksiyonlar
import { getRoomsData, getSiteRoomById } from './admin/roomsData'; // Added getSiteRoomById
import { getBaseUrl, isClient, isServer, getApiUrl } from '@/lib/utils';

// Türkçe dil için oda verileri
const roomsTR: Room[] = [
  {
    id: 'standard-room',
    name: 'Standart Oda',
    description: '26 m² olup, çift kişilik yatak mevcuttur. Konforlu bir konaklama deneyimi için tüm ihtiyaçlarınızı karşılayacak donanıma sahiptir.',
    image: '/images/rooms/standart/standard-room.jpg',
    price: '₺1.500',
    capacity: 2,
    size: 26,
    features: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    gallery: [
      '/images/rooms/standart/standard-room.jpg',
      '/images/rooms/standart/standard-room2.jpg',
      '/images/rooms/standart/standard-room3.jpg',
      '/images/rooms/standart/standard-room4.jpg',
      '/images/rooms/standart/standard-room5.jpg',
      '/images/rooms/standart/standard-room6.jpg',
      '/images/rooms/standart/standard-room7.jpg'
    ]
  },
  {
    id: 'triple-room',
    name: 'Üç Kişilik Oda',
    description: '26 m² olup, 1 adet çift kişilik ve 1 adet tek kişilik yatak mevcuttur. Aileler için ideal bir konaklama seçeneğidir.',
    image: '/images/rooms/triple/triple-room.jpg',
    price: '₺2.500',
    capacity: 3,
    size: 26,
    features: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    gallery: [
      '/images/rooms/triple/triple-room.jpg',
      '/images/rooms/triple/triple-room1.jpg',
      '/images/rooms/triple/triple-room3.jpg',
      '/images/rooms/triple/triple-room4.jpg',
      '/images/rooms/triple/triple-room5.jpg',
      '/images/rooms/triple/triple-room6.jpg'
    ]
  },
  {
    id: 'suite-room',
    name: 'Süit Oda',
    description: '40 m² olup, 1 adet çift kişilik yatak ve 3 adet tek kişilik yatak mevcuttur. Tek duşlu olup seramik zeminden oluşmaktadır.',
    image: '/images/rooms/suite/suite-room.jpg',
    price: '₺3.500',
    capacity: 5,
    size: 40,
    features: [
      'Klima',
      'Saç Kurutma Makinası',
      'LCD TV',
      'Mini-Bar',
      'WC & Duşa Kabin',
      'Balkon',
      'Güvenlik Kasası',
      'Dağ yada Havuz Manzarası'
    ],
    gallery: [
      '/images/rooms/suite/suite-room.jpg',
      '/images/rooms/suite/suite-room2.jpg',
      '/images/rooms/suite/suite-room3.jpg',
      '/images/rooms/suite/suite-room4.jpg',
      '/images/rooms/suite/suite-room5.jpg',
      '/images/rooms/suite/suite-room6.jpg',
      '/images/rooms/suite/suite-room7.jpg',
      '/images/rooms/suite/suite-room8.jpg'
    ]
  },
  {
    id: 'apart-room',
    name: 'Apart Oda',
    description: '30 m² olup, tek duşlu olup seramik zeminden oluşmaktadır. Konforlu bir konaklama için tüm ihtiyaçlarınızı karşılar.',
    image: '/images/rooms/apart/apart-room.jpg',
    price: '₺2.000',
    capacity: 2,
    size: 30,
    features: [
      'Klima',
      'Saç Kurutma Makinası',
      'Uydu TV',
      'WC & Duşa Kabin',
      'Balkon',
      'Dağ yada Havuz Manzarası'
    ],
    gallery: [
      '/images/rooms/apart/apart-room.jpg',
      '/images/rooms/apart/apart-room2.jpg',
      '/images/rooms/apart/apart-room3.jpg',
      '/images/rooms/apart/apart-room4.jpg',
      '/images/rooms/apart/apart-room5.jpg',
      '/images/rooms/apart/apart-room6.jpg'
    ]
  }
];

// İngilizce dil için oda verileri
const roomsEN: Room[] = [
  {
    id: 'standard-room',
    name: 'Standard Room',
    description: 'It is 26 m² and has a double bed. It has all the equipment to meet all your needs for a comfortable accommodation experience.',
    image: '/images/rooms/standart/standard-room.jpg',
    price: '€50',
    capacity: 2,
    size: 26,
    features: [
      'Air Conditioning',
      'Hair Dryer',
      'LCD TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      '/images/rooms/standart/standard-room.jpg',
      '/images/rooms/standart/standard-room2.jpg',
      '/images/rooms/standart/standard-room3.jpg',
      '/images/rooms/standart/standard-room4.jpg',
      '/images/rooms/standart/standard-room5.jpg',
      '/images/rooms/standart/standard-room6.jpg',
      '/images/rooms/standart/standard-room7.jpg'
    ]
  },
  {
    id: 'triple-room',
    name: 'Triple Room',
    description: '26 m² with 1 double bed and 1 single bed. An ideal accommodation option for families.',
    image: '/images/rooms/triple/triple-room.jpg',
    price: '€120',
    capacity: 3,
    size: 26,
    features: [
      'Air Conditioning',
      'Hair Dryer',
      'LCD TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      '/images/rooms/triple/triple-room.jpg',
      '/images/rooms/triple/triple-room1.jpg',
      '/images/rooms/triple/triple-room3.jpg',
      '/images/rooms/triple/triple-room4.jpg',
      '/images/rooms/triple/triple-room5.jpg',
      '/images/rooms/triple/triple-room6.jpg'
    ]
  },
  {
    id: 'suite-room',
    name: 'Suite Room',
    description: '40 m² with 1 double bed and 3 single beds. Features a single shower and ceramic floor.',
    image: '/images/rooms/suite/suite-room.jpg',
    price: '€180',
    capacity: 5,
    size: 40,
    features: [
      'Air Conditioning',
      'Hair Dryer',
      'LCD TV',
      'Mini-Bar',
      'WC & Shower Cabin',
      'Balcony',
      'Safety Deposit Box',
      'Mountain or Pool View'
    ],
    gallery: [
      '/images/rooms/suite/suite-room.jpg',
      '/images/rooms/suite/suite-room2.jpg',
      '/images/rooms/suite/suite-room3.jpg',
      '/images/rooms/suite/suite-room4.jpg',
      '/images/rooms/suite/suite-room5.jpg',
      '/images/rooms/suite/suite-room6.jpg',
      '/images/rooms/suite/suite-room7.jpg',
      '/images/rooms/suite/suite-room8.jpg'
    ]
  },
  {
    id: 'apart-room',
    name: 'Apart Room',
    description: '30 m² with a single shower and ceramic floor. Meets all your needs for a comfortable stay.',
    image: '/images/rooms/apart/apart-room.jpg',
    price: '€100',
    capacity: 2,
    size: 30,
    features: [
      'Air Conditioning',
      'Hair Dryer',
      'Satellite TV',
      'WC & Shower Cabin',
      'Balcony',
      'Mountain or Pool View'
    ],
    gallery: [
      '/images/rooms/apart/apart-room.jpg',
      '/images/rooms/apart/apart-room2.jpg',
      '/images/rooms/apart/apart-room3.jpg',
      '/images/rooms/apart/apart-room4.jpg',
      '/images/rooms/apart/apart-room5.jpg',
      '/images/rooms/apart/apart-room6.jpg'
    ]
  }
];

// Oda tipi arayüzü
export interface Room {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  capacity: number;
  size: number;
  features: string[];
  gallery: string[];
  type?: string;
}

// Bir dil için tüm odaları getiren asenkron fonksiyon
export async function getRoomsForLanguage(lang: string): Promise<Room[]> {
  try {
    console.log(`[getRoomsForLanguage] Çalıştı, dil: ${lang}, Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    try {
      // API'ye istek yapmayı dene - Önce statik verileri hazırla (yedek olarak)
      const staticData = lang === 'tr' ? roomsTR : roomsEN;
      
      // Temel URL'yi al
      const baseUrl = getBaseUrl();
      console.log(`[getRoomsForLanguage] Kullanılan temel URL: ${baseUrl}`);
      
      // API'leri dene
      try {
        // API URL'lerini oluştur
        const roomsUrl = getApiUrl(`rooms`, { lang });
        const publicRoomsUrl = getApiUrl(`public/rooms`, { lang });
        
        console.log(`[getRoomsForLanguage] Ana API isteği yapılıyor: ${roomsUrl}`);
        
        // Ana API'yi dene
        let response = await fetch(roomsUrl, {
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
        
        // Ana API başarısız olursa public API'yi dene
        if (!response.ok) {
          console.log(`[getRoomsForLanguage] Ana API başarısız (${response.status}), public API deneniyor...`);
          console.log(`[getRoomsForLanguage] Public API isteği yapılıyor: ${publicRoomsUrl}`);
          
          response = await fetch(publicRoomsUrl, {
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
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API yanıtı başarısız: ${response.status}, ${errorText}`);
          console.log('[getRoomsForLanguage] API başarısız, statik verilere dönülüyor');
          // API hatası durumunda statik verileri kullan
          return staticData;
        }
        
        const result = await response.json();
        
        if (result.success && result.data && Array.isArray(result.data)) {
          // API'den alınan ham verileri dile göre işle
          return result.data.map((room: any) => ({
            id: room.id,
            name: lang === 'tr' ? room.nameTR : room.nameEN,
            description: lang === 'tr' ? room.descriptionTR : room.descriptionEN,
            image: room.mainImageUrl || room.image,
            price: lang === 'tr' ? room.priceTR : room.priceEN,
            capacity: room.capacity,
            size: room.size,
            features: lang === 'tr' 
              ? (Array.isArray(room.featuresTR) ? room.featuresTR : [])
              : (Array.isArray(room.featuresEN) ? room.featuresEN : []),
            gallery: Array.isArray(room.gallery) ? room.gallery : [],
            type: room.type
          }));
        } else {
          console.warn('[getRoomsForLanguage] API başarısız yanıt döndü veya veri formatı beklenmeyen şekilde, statik verilere dönülüyor');
          // API hatası durumunda statik verileri kullan
          return staticData;
        }
      } catch (apiError) {
        console.error('[getRoomsForLanguage] API isteği sırasında hata:', apiError);
        return staticData; // Herhangi bir hata durumunda statik verileri kullan
      }
    } catch (error) {
      console.error('[getRoomsForLanguage] API hatası:', error);
      // API hatası durumunda statik verileri kullan
      return lang === 'tr' ? roomsTR : roomsEN;
    }
  } catch (error) {
    console.error('[getRoomsForLanguage] Genel hata:', error);
    return lang === 'tr' ? roomsTR : roomsEN; // Hata durumunda varsayılan verileri döndür
  }
}

// ID'ye göre oda bilgisini getir
export async function getRoomById(lang: string, id: string): Promise<Room | undefined> {
  try {
    console.log(`[getRoomById] Çalıştı, ID: ${id}, dil: ${lang}, Ortam: ${isServer ? 'Sunucu' : 'İstemci'}`);
    
    if (!id) {
      console.error('[getRoomById] Geçersiz ID');
      return undefined;
    }
    
    // Temel URL'yi al
    const baseUrl = getBaseUrl();
    console.log(`[getRoomById] Kullanılan temel URL: ${baseUrl}`);
    
    // Yedek statik veri
    const rooms = lang === 'tr' ? roomsTR : roomsEN;
    const staticRoom = rooms.find(room => room.id.toLowerCase() === id.toLowerCase());
    
    // Önce API'den veri almayı dene
    try {
      // API URL'lerini oluştur
      const roomUrl = getApiUrl(`rooms/${id}`, { lang });
      const publicRoomUrl = getApiUrl(`public/rooms/${id}`, { lang });
      
      console.log(`[getRoomById] Ana API isteği yapılıyor: ${roomUrl}`);
      
      // Direkt API'den veriyi almaya çalış
      let response = await fetch(roomUrl, {
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
      
      // Ana API başarısız olursa public API'yi dene
      if (!response.ok) {
        console.log(`[getRoomById] Ana API başarısız (${response.status}), public API deneniyor...`);
        console.log(`[getRoomById] Public API isteği yapılıyor: ${publicRoomUrl}`);
        
        response = await fetch(publicRoomUrl, {
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
      }
      
      if (response.ok) {
        const result = await response.json();
        console.log('[getRoomById] API yanıtı alındı');
        
        if (result.success && result.data) {
          console.log('[getRoomById] API\'den doğrudan oda verisi alındı:', result.data.id);
          
          // Feature alanları kontrolü
          const features = lang === 'tr' 
            ? (result.data.featuresTR || []) 
            : (result.data.featuresEN || []);
          
          // Oda nesnesini oluştur
          const roomData = {
            id: result.data.id,
            name: lang === 'tr' ? result.data.nameTR : result.data.nameEN,
            description: lang === 'tr' ? result.data.descriptionTR : result.data.descriptionEN,
            image: result.data.mainImageUrl || result.data.image,
            price: lang === 'tr' ? result.data.priceTR : result.data.priceEN,
            capacity: result.data.capacity,
            size: result.data.size,
            features: features,
            gallery: result.data.gallery || []
          };
          
          return roomData;
        } else {
          console.error('[getRoomById] API yanıtı başarısız veya veri yok');
        }
      } else {
        console.error(`[getRoomById] Tüm API'ler başarısız: ${response.status}`);
      }
    } catch (apiError) {
      console.error('[getRoomById] API üzerinden oda arama hatası:', apiError);
    }
    
    // admin/roomsData'dan getSiteRoomById kullan
    try {
      const room = await getSiteRoomById(lang, id);
      
      if (room) {
        console.log(`[getRoomById] Oda başarıyla bulundu: ${room.id}`);
        return room;
      }
    } catch (apiError) {
      console.error('[getRoomById] admin/roomsData üzerinden oda arama hatası:', apiError);
    }
    
    // Bulunamadıysa veya API hatası varsa, sabit verilerde arayalım
    console.log(`[getRoomById] Admin modülünde oda bulunamadı, sabit veriler kontrol ediliyor`);
    
    if (staticRoom) {
      console.log('[getRoomById] Sabit veriden bulunan oda:', staticRoom.id);
      return staticRoom;
    } else {
      console.log('[getRoomById] Oda bulunamadı');
      return undefined;
    }
  } catch (error) {
    console.error('[getRoomById] Oda arama hatası:', error);
    // Hata durumunda yine sabit verilere dönelim
    const rooms = lang === 'tr' ? roomsTR : roomsEN;
    return rooms.find(room => room.id.toLowerCase() === id.toLowerCase());
  }
}
