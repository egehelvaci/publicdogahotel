'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes, FaExpand } from 'react-icons/fa';

interface RoomGalleryProps {
  images: string[];
  roomName: string;
  lang: string;
}

const RoomGallery: React.FC<RoomGalleryProps> = ({ images, roomName, lang }) => {
  // İstemci tarafında mı çalıştığını kontrol et
  const isClient = typeof window !== 'undefined';
  
  // SSR kontrolü - bu bileşen client tarafında çalışıyor
  if (!isClient) {
    console.log('[RoomGallery] Sunucu tarafında çalışıyor, sadece istemci tarafı işlemler atlanacak');
  } else {
    console.log('[RoomGallery] İstemci tarafında çalışıyor');
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Tam ekran modu için kullanıcı etkileşimi gerektiğinden, sadece istemci tarafında çalışacak useEffect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
      
      if (e.key === 'ArrowRight') {
        handleNext();
      }
      
      if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    
    // Sadece istemci tarafında olay dinleyicileri ekle
    window.addEventListener('keydown', handleKeyDown);
    
    // Temizleme fonksiyonu
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen, currentIndex, images.length]);
  
  // Tam ekran modu için useEffect
  useEffect(() => {
    // Arka plan kaydırma kilidini tam ekranda engelle
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);
  
  // Slider için otomatik geçiş useEffect
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      if (!isFullscreen) { // Tam ekran modunda otomatik geçişi durdur
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [images.length, isFullscreen]);
  
  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Eğer görsel yoksa
  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] w-full bg-gray-200 flex items-center justify-center">
        <p className="text-gray-500">{lang === 'tr' ? 'Görsel bulunamadı' : 'No image found'}</p>
      </div>
    );
  }
  
  // Normal galeri görünümü
  return (
    <>
      <div className={`relative w-full h-full ${isFullscreen ? 'hidden' : 'block'}`}>
        {/* Ana Görsel */}
        <div className="relative w-full h-full">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
        >
          <Image
                src={image}
                alt={`${roomName} - ${index + 1}`}
            fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={index === 0}
              />
            </div>
          ))}
          </div>
        
        {/* Kontroller */}
        <div className="absolute inset-0 flex items-center justify-between p-4 z-20">
            <button 
            className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-300"
            onClick={handlePrev}
              aria-label={lang === 'tr' ? 'Önceki görsel' : 'Previous image'}
            >
            <FaChevronLeft className="w-4 h-4" />
            </button>
          
            <button 
            className="w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-300"
            onClick={handleNext}
              aria-label={lang === 'tr' ? 'Sonraki görsel' : 'Next image'}
            >
            <FaChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Tam Ekran Butonu */}
        <button
          className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-300"
          onClick={handleToggleFullscreen}
          aria-label={lang === 'tr' ? 'Tam ekran görüntüle' : 'View fullscreen'}
        >
          <FaExpand className="w-4 h-4" />
            </button>
        
        {/* İndikatörler */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
          <div className="flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex ? 'w-4 bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`${lang === 'tr' ? 'Görsel' : 'Image'} ${index + 1}`}
                />
              ))}
            </div>
        </div>
      </div>

      {/* Tam Ekran Galeri */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            <div className="relative w-full h-full">
              {/* Ana Görsel */}
              <div className="relative w-full h-full flex items-center justify-center">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ${
                      index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <div className="relative w-full h-full max-w-7xl max-h-screen">
                      <Image
                        src={image}
                        alt={`${roomName} - ${index + 1}`}
                        fill
                        sizes="100vw"
                        className="object-contain"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Kontroller */}
              <div className="absolute inset-0 flex items-center justify-between p-4 z-20">
            <button 
                  className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-300"
                  onClick={handlePrev}
                  aria-label={lang === 'tr' ? 'Önceki görsel' : 'Previous image'}
            >
                  <FaChevronLeft className="w-5 h-5" />
            </button>
            
                <button
                  className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-300"
                  onClick={handleNext}
                  aria-label={lang === 'tr' ? 'Sonraki görsel' : 'Next image'}
                >
                  <FaChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Kapat Butonu */}
                  <button 
                className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-all duration-300"
                onClick={handleToggleFullscreen}
                aria-label={lang === 'tr' ? 'Kapat' : 'Close'}
                  >
                <FaTimes className="w-5 h-5" />
                  </button>
                  
              {/* Sayı Göstergesi */}
              <div className="absolute bottom-4 left-0 right-0 text-center text-white z-20">
                <p className="text-lg font-medium">
                  {currentIndex + 1} / {images.length}
                </p>
                  </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RoomGallery; 