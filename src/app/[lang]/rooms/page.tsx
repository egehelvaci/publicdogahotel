'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { FaBed, FaRulerCombined, FaUsers, FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getRoomsForLanguage } from '../../data/rooms';

interface RoomsPageProps {
  params: {
    lang: string;
  };
}

export default function RoomsPage({ params }: RoomsPageProps) {
  // Next.js 15'te params Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;
  
  const [rooms, setRooms] = useState([]);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  
  // Her oda için aktif görsel state'i
  const [activeImages, setActiveImages] = useState<{[key: string]: number}>({});
  
  // Odaları asenkron olarak yükle
  useEffect(() => {
    const loadRooms = async () => {
      try {
        // No-store ile veri çekme, API önbelleğini bypass etmek için
        const fetchUrl = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/rooms?t=${Date.now()}` 
          : 'http://localhost:3000/api/rooms';
          
        const response = await fetch(fetchUrl, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error('Oda verileri alınamadı');
        }
        
        const data = await response.json();
        let roomsData;
        
        if (data.success) {
          // API'den alınan ham verileri dile göre işle
          roomsData = data.data
            .filter((room: any) => room.active)
            .map((room: any) => ({
              id: room.id,
              name: lang === 'tr' ? room.nameTR : room.nameEN,
              description: lang === 'tr' ? room.descriptionTR : room.descriptionEN,
              image: room.image,
              price: lang === 'tr' ? room.priceTR : room.priceEN,
              capacity: room.capacity,
              size: room.size,
              features: lang === 'tr' ? room.featuresTR : room.featuresEN,
              gallery: room.gallery,
              type: room.type
            }));
        } else {
          // API hatası durumunda varsayılan fonksiyonu kullan
          roomsData = await getRoomsForLanguage(lang);
        }
        
        // roomsData'nın bir dizi olduğundan emin olalım
        if (Array.isArray(roomsData)) {
          setRooms(roomsData);
          
          // Odalar yüklendikten sonra activeImages state'ini oluştur
          if (roomsData.length > 0) {
            const initialActiveImages = roomsData.reduce((acc, room) => ({
              ...acc, 
              [room.id]: 0
            }), {});
            setActiveImages(initialActiveImages);
          } else {
            console.warn('Yüklenen oda verisi boş bir dizi');
            setActiveImages({});
          }
        } else {
          console.error('Hata: roomsData bir dizi değil:', roomsData);
          setRooms([]);
          setActiveImages({});
        }
      } catch (error) {
        console.error('Odalar yüklenirken hata oluştu:', error);
        setRooms([]);
        setActiveImages({});
      }
    };
    
    loadRooms();
  }, [lang]);
  
  // Önceki görsele geçme fonksiyonu
  const goToPrevious = (roomId: string) => {
    setActiveImages(prev => {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.gallery) return prev;
      
      const currentIndex = prev[roomId];
      const newIndex = currentIndex === 0 ? room.gallery.length - 1 : currentIndex - 1;
      
      return {...prev, [roomId]: newIndex};
    });
  };
  
  // Sonraki görsele geçme fonksiyonu
  const goToNext = (roomId: string) => {
    setActiveImages(prev => {
      const room = rooms.find(r => r.id === roomId);
      if (!room || !room.gallery) return prev;
      
      const currentIndex = prev[roomId];
      const newIndex = currentIndex === room.gallery.length - 1 ? 0 : currentIndex + 1;
      
      return {...prev, [roomId]: newIndex};
    });
  };
  
  const pageTitle = lang === 'tr' ? 'Odalarımız' : 'Our Rooms';
  const pageDescription = lang === 'tr'
    ? 'Konfor ve lüksün buluştuğu Doğa Hotel odalarında unutulmaz bir konaklama deneyimi yaşayın.'
    : 'Experience an unforgettable stay in Doğa Hotel rooms where comfort and luxury meet.';

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Başlık Alanı */}
        <div className="text-center mb-16">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-4 text-gray-800"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {pageTitle}
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {pageDescription}
          </motion.p>
        </div>
        
        {/* Odalar Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-12">
          {rooms.map((room, index) => {
            const galleryImages = room.gallery || [room.image];
            const activeImageIndex = activeImages[room.id] || 0;
            
            return (
              <motion.div 
                key={room.id}
                className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => setHoveredRoom(null)}
              >
                <div className="relative h-64 w-full group">
                  {/* Görseller Slider */}
                  {galleryImages.map((image, imgIndex) => (
                    <motion.div 
                      key={imgIndex}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: imgIndex === activeImageIndex ? 1 : 0,
                        zIndex: imgIndex === activeImageIndex ? 1 : 0
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <Image
                        src={image}
                        alt={`${room.name} - ${imgIndex + 1}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="transition-transform duration-500"
                        style={{ 
                          transform: hoveredRoom === room.id ? 'scale(1.05)' : 'scale(1)'
                        }}
                      />
                    </motion.div>
                  ))}
                  
                  {/* Slider Kontrolleri */}
                  {galleryImages.length > 1 && (
                    <>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPrevious(room.id);
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-teal-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        aria-label={lang === 'tr' ? 'Önceki görsel' : 'Previous image'}
                      >
                        <FaChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          goToNext(room.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-teal-700 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                        aria-label={lang === 'tr' ? 'Sonraki görsel' : 'Next image'}
                      >
                        <FaChevronRight size={16} />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center space-x-1 z-10">
                        {galleryImages.map((_, dotIndex) => (
                          <button
                            key={dotIndex}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              activeImageIndex === dotIndex ? 'bg-white w-3' : 'bg-white/60 hover:bg-white/80'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImages(prev => ({...prev, [room.id]: dotIndex}));
                            }}
                            aria-label={`${lang === 'tr' ? 'Görsel' : 'Image'} ${dotIndex + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
                
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">{room.name}</h2>
                  <p className="text-gray-600 mb-5">{room.description}</p>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-4">
                      <div className="flex items-center">
                        <FaUsers className="text-teal-600 mr-2" />
                        <span className="text-sm text-gray-700">{room.capacity} {lang === 'tr' ? 'Kişi' : 'Persons'}</span>
                      </div>
                      <div className="flex items-center">
                        <FaRulerCombined className="text-teal-600 mr-2" />
                        <span className="text-sm text-gray-700">{room.size}m²</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end items-center">
                    <Link 
                      href={`/${lang}/rooms/${room.id}`}
                      className="inline-flex items-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-5 rounded transition-colors duration-300"
                    >
                      {lang === 'tr' ? 'Detaylar' : 'Details'} 
                      <FaArrowRight className="ml-2" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 