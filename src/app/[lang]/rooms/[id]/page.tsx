import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

// Sayfayı tamamen dinamik yapmak için
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface RoomDetailPageProps {
  params: {
    lang: string;
    id: string;
  };
}

// Basit oda tipi
interface SimpleRoom {
  id: string;
  name: string;
  description: string;
  image: string;
  price: string;
  capacity: number;
  size: number;
  features: string[];
}

// Basit oda verileri
const rooms: { [key: string]: SimpleRoom[] } = {
  'tr': [
    {
      id: 'standard-room',
      name: 'Standart Oda',
      description: 'Konforlu bir konaklama için ideal.',
      image: '/images/rooms/standart/standard-room.jpg',
      price: '₺1.500',
      capacity: 2,
      size: 26,
      features: ['Klima', 'Wifi', 'TV', 'Banyo']
    },
    {
      id: 'triple-room',
      name: 'Üç Kişilik Oda',
      description: 'Aileler için ideal bir konaklama seçeneği.',
      image: '/images/rooms/triple/triple-room.jpg',
      price: '₺2.500',
      capacity: 3,
      size: 26,
      features: ['Klima', 'Wifi', 'TV', 'Banyo']
    }
  ],
  'en': [
    {
      id: 'standard-room',
      name: 'Standard Room',
      description: 'Ideal for a comfortable stay.',
      image: '/images/rooms/standart/standard-room.jpg',
      price: '€50',
      capacity: 2,
      size: 26,
      features: ['Air Conditioning', 'Wifi', 'TV', 'Bathroom']
    },
    {
      id: 'triple-room',
      name: 'Triple Room',
      description: 'An ideal accommodation option for families.',
      image: '/images/rooms/triple/triple-room.jpg',
      price: '€120',
      capacity: 3,
      size: 26,
      features: ['Air Conditioning', 'Wifi', 'TV', 'Bathroom']
    }
  ]
};

export default function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { lang, id } = params;
  
  if (!lang || !id || (lang !== 'tr' && lang !== 'en')) {
    return notFound();
  }
  
  // ID'ye göre odayı bul
  const room = rooms[lang].find(r => r.id === id);
  
  if (!room) {
    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold mb-4">
            {lang === 'tr' ? 'Oda bulunamadı' : 'Room not found'}
          </h1>
          <p className="mb-6">
            {lang === 'tr' 
              ? 'Aradığınız oda bulunamadı. Lütfen başka bir oda seçin.' 
              : 'The room you are looking for was not found. Please choose another room.'}
          </p>
          <Link 
            href={`/${lang}/rooms`}
            className="bg-blue-500 text-white py-2 px-4 rounded"
          >
            {lang === 'tr' ? 'Odalar Sayfasına Dön' : 'Back to Rooms'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <Link 
          href={`/${lang}/rooms`}
          className="mb-6 inline-block text-blue-500"
        >
          {lang === 'tr' ? '← Odalar Sayfasına Dön' : '← Back to Rooms'}
        </Link>
        
        <h1 className="text-3xl font-bold mb-4">{room.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative h-64 md:h-auto">
            <Image 
              src={room.image}
              alt={room.name}
              fill
              className="object-cover rounded"
            />
          </div>
          
          <div>
            <p className="mb-4">{room.description}</p>
            
            <div className="mb-4">
              <h3 className="font-bold mb-2">
                {lang === 'tr' ? 'Özellikler' : 'Features'}
              </h3>
              <ul className="list-disc pl-5">
                {room.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <div className="mb-4">
              <p>
                <strong>{lang === 'tr' ? 'Kapasite:' : 'Capacity:'}</strong> {room.capacity}
              </p>
              <p>
                <strong>{lang === 'tr' ? 'Boyut:' : 'Size:'}</strong> {room.size} m²
              </p>
              <p>
                <strong>{lang === 'tr' ? 'Fiyat:' : 'Price:'}</strong> {room.price}
              </p>
            </div>
            
            <button className="bg-blue-500 text-white py-2 px-4 rounded">
              {lang === 'tr' ? 'Rezervasyon Yap' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
