import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FaArrowLeft, FaUsers, FaRulerCombined, FaCheck, FaBed, FaPhone, FaWhatsapp } from 'react-icons/fa';
import RoomGallery from './RoomGallery';

// Sayfayı tamamen dinamik yapmak için
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface RoomDetailPageProps {
  params: {
    lang: string;
    id: string;
  };
}

// Merkezi oda alma fonksiyonu
async function fetchRoomData(lang: string, id: string) {
  try {
    // Timestamp ekleyerek cache'lemeyi önle
    const timestamp = Date.now();
    const url = `http://localhost:3000/api/rooms/${id}?t=${timestamp}`;
    
    console.log(`[RoomDetailPage] API isteği: ${url}`);
    
    const response = await fetch(url, {
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
      console.error(`[RoomDetailPage] API yanıtı başarısız: ${response.status} ${response.statusText}`);
      throw new Error('API yanıtı başarısız');
    }
    
    const data = await response.json();
    
    if (data && data.success && data.data) {
      // API'den dönen veriyi Room formatına dönüştür
      const room = data.data;
      
      return {
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
      };
    }
    
    throw new Error('API verisi boş veya geçersiz format');
  } catch (error) {
    console.error('[RoomDetailPage] Oda verisi alınırken hata:', error);
    return null;
  }
}

// Basit oda verileri (fallback için)
const fallbackRooms: { [key: string]: any } = {
  'tr': [
    {
      id: '3b787da0-0016-48d1-837f-648e73981817',
      name: 'Standart Oda',
      description: 'Konforlu bir konaklama için ideal.',
      image: '/images/rooms/standart/standard-room.jpg',
      price: '₺1.500',
      capacity: 2,
      size: 26,
      features: ['Klima', 'Wifi', 'TV', 'Banyo'],
      gallery: ['/images/rooms/standart/standard-room.jpg']
    }
  ],
  'en': [
    {
      id: '3b787da0-0016-48d1-837f-648e73981817',
      name: 'Standard Room',
      description: 'Ideal for a comfortable stay.',
      image: '/images/rooms/standart/standard-room.jpg',
      price: '€50',
      capacity: 2,
      size: 26,
      features: ['Air Conditioning', 'Wifi', 'TV', 'Bathroom'],
      gallery: ['/images/rooms/standart/standard-room.jpg']
    }
  ]
};

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  // Next.js 13+ için params'ı await etmemiz gerekiyor
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const id = resolvedParams.id;
  
  if (!lang || !id) {
    return notFound();
  }
  
  // API'den odayı getir
  let room = await fetchRoomData(lang, id);
  
  // API'den veri alınamazsa fallback verileri kullan
  if (!room) {
    const fallbackList = (lang === 'tr' || lang === 'en') ? fallbackRooms[lang] : fallbackRooms['tr'];
    room = fallbackList.find(r => r.id === id);
    
    if (!room) {
      return (
        <div className="pt-24 pb-16 min-h-screen flex flex-col items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              {lang === 'tr' ? 'Oda Bulunamadı' : 'Room Not Found'}
            </h1>
            <p className="text-gray-600 mb-8">
              {lang === 'tr' 
                ? 'Aradığınız oda bulunamadı veya kaldırılmış olabilir.' 
                : 'The room you are looking for could not be found or may have been removed.'}
            </p>
            <Link 
              href={`/${lang}/rooms`}
              className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-5 rounded transition-colors duration-300"
            >
              <FaArrowLeft className="mr-2" />
              {lang === 'tr' ? 'Odalar Sayfasına Dön' : 'Back to Rooms'}
            </Link>
          </div>
        </div>
      );
    }
  }

  // Oda görselleri
  const galleryImages = room.gallery && room.gallery.length > 0 ? room.gallery : [room.image];
  
  // Yatak bilgisini oluştur
  const getBedInfo = () => {
    if (room.capacity <= 2) {
      return lang === 'tr' ? 'Çift kişilik yatak' : 'Double bed';
    } else if (room.capacity === 3) {
      return lang === 'tr' ? '1 çift kişilik, 1 tek kişilik yatak' : '1 double bed, 1 single bed';
    } else {
      return lang === 'tr' ? 'Çoklu yatak düzeni' : 'Multiple bed arrangement';
    }
  };

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Geri Düğmesi */}
        <div className="mb-8">
          <Link 
            href={`/${lang}/rooms`}
            className="inline-flex items-center text-teal-600 hover:text-teal-700 transition-colors duration-300"
          >
            <FaArrowLeft className="mr-2" />
            {lang === 'tr' ? 'Tüm Odalar' : 'All Rooms'}
          </Link>
        </div>
        
        {/* Oda Başlık */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
          {room.name}
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Sol Taraf - Oda Görselleri Slider */}
          <div className="aspect-[4/3] relative rounded-xl overflow-hidden shadow-xl">
            <RoomGallery 
              images={galleryImages} 
              roomName={room.name} 
              lang={lang}
            />
          </div>
          
          {/* Sağ Taraf - Oda Bilgileri */}
          <div className="flex flex-col">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <p className="text-gray-700 mb-6">{room.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-teal-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FaRulerCombined className="text-teal-600 mr-2 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">{lang === 'tr' ? 'Oda Boyutu' : 'Room Size'}</p>
                      <p className="font-semibold">{room.size} m²</p>
                    </div>
                  </div>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FaUsers className="text-teal-600 mr-2 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">{lang === 'tr' ? 'Kapasite' : 'Capacity'}</p>
                      <p className="font-semibold">{room.capacity} {lang === 'tr' ? 'Kişi' : 'Persons'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg col-span-2">
                  <div className="flex items-center">
                    <FaBed className="text-teal-600 mr-2 text-xl" />
                    <div>
                      <p className="text-sm text-gray-500">{lang === 'tr' ? 'Yatak' : 'Bed'}</p>
                      <p className="font-semibold">{getBedInfo()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{lang === 'tr' ? 'Oda Özellikleri' : 'Room Features'}</h3>
              <ul className="grid grid-cols-1 gap-y-3">
                {room.features && room.features.map((feature, index) => (
                  <li key={index} className="flex items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <FaCheck className="text-teal-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-auto">
              <a 
                href="tel:+905320664808" 
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-lg transition-colors duration-300 font-medium shadow-lg flex items-center justify-center"
              >
                <FaPhone className="mr-2" />
                {lang === 'tr' ? 'Rezervasyon Yap' : 'Book Now'}
              </a>
              <a 
                href={`https://wa.me/905320664808?text=${encodeURIComponent(lang === 'tr' ? 'Merhaba, Rezarvasyon hakkında bilgi almak istiyorum' : 'Hello, I would like to get information about reservation')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg transition-colors duration-300 font-medium shadow-lg flex items-center justify-center"
              >
                <FaWhatsapp className="mr-2 text-lg" />
                {lang === 'tr' ? 'WhatsApp ile Bilgi Al' : 'Get Info via WhatsApp'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
