'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes, FaExpand, FaPlay } from 'react-icons/fa';
import ScrollAnimationWrapper from '../../components/ScrollAnimationWrapper';
import { fetchGalleryItems, GalleryItem } from '../../utils/galleryUtils';

type GalleryPageProps = {
  lang: string;
};

// Galeri filtreleme seçenekleri
type GalleryFilter = 'photos' | 'videos';

export default function GalleryPage({ lang }: GalleryPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItemIndex, setLightboxItemIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [activeFilter, setActiveFilter] = useState<GalleryFilter>('photos');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Galeri verilerini yükle
  useEffect(() => {
    async function loadGalleryData() {
      setIsLoading(true);
      setError(null);
      
      try {
        const items = await fetchGalleryItems();
        if (items.length > 0) {
          setGalleryItems(items);
        } else {
          setError('Galeri öğeleri yüklenemedi, lütfen daha sonra tekrar deneyin.');
        }
      } catch (err) {
        console.error('Galeri yükleme hatası:', err);
        setError('Galeri öğeleri yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadGalleryData();
  }, []);

  // Filtre değiştiğinde öğeleri filtrele
  useEffect(() => {
    if (galleryItems.length > 0) {
      if (activeFilter === 'photos') {
        setFilteredItems(galleryItems.filter(item => item.type === 'image'));
      } else if (activeFilter === 'videos') {
        setFilteredItems(galleryItems.filter(item => item.type === 'video'));
      }
    }
  }, [galleryItems, activeFilter]);

  const openLightbox = (index: number) => {
    setLightboxItemIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
    
    // Video oynatılıyorsa durdur
    if (videoRef.current && filteredItems[lightboxItemIndex]?.type === 'video') {
      videoRef.current.pause();
    }
  };

  const nextLightboxImage = () => {
    setLightboxItemIndex((prev) => (prev === filteredItems.length - 1 ? 0 : prev + 1));
  };

  const prevLightboxImage = () => {
    setLightboxItemIndex((prev) => (prev === 0 ? filteredItems.length - 1 : prev - 1));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') nextLightboxImage();
        if (e.key === 'ArrowLeft') prevLightboxImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextLightboxImage();
    } else if (isRightSwipe) {
      prevLightboxImage();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  // Filtre değiştirme işlevi
  const changeFilter = (filter: GalleryFilter) => {
    setActiveFilter(filter);
  };

  // Yükleme durumunda loading göster
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // Hata durumunda hata mesajı göster
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 transition-colors"
          >
            {lang === 'tr' ? 'Yeniden Dene' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Veri yoksa mesaj göster
  if (galleryItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 mt-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              {lang === 'tr' ? 'Galeri' : 'Gallery'}
            </h2>
          </div>
          <p className="text-center text-gray-500">
            {lang === 'tr' ? 'Henüz galeri öğesi eklenmemiş.' : 'No gallery items added yet.'}
          </p>
        </div>
      </div>
    );
  }

  // Seçilen filtreye göre öğeleri sayalım
  const photoCount = galleryItems.filter(item => item.type === 'image').length;
  const videoCount = galleryItems.filter(item => item.type === 'video').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 mt-4">
        <ScrollAnimationWrapper animation="fadeIn" delay={0.1} once={true}>
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold">
              {lang === 'tr' ? 'Galeri' : 'Gallery'}
            </h2>
          </div>
        </ScrollAnimationWrapper>

        {/* Filtre sekmeleri */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border ${
                activeFilter === 'photos'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              } rounded-l-lg`}
              onClick={() => changeFilter('photos')}
            >
              {lang === 'tr' ? `Fotoğraflar (${photoCount})` : `Photos (${photoCount})`}
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border ${
                activeFilter === 'videos'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              } rounded-r-lg`}
              onClick={() => changeFilter('videos')}
            >
              {lang === 'tr' ? `Videolar (${videoCount})` : `Videos (${videoCount})`}
            </button>
          </div>
        </div>

        {/* Filtre sonucunda öğe yoksa mesaj göster */}
        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {activeFilter === 'photos' 
                ? (lang === 'tr' ? 'Henüz fotoğraf eklenmemiş.' : 'No photos added yet.') 
                : (lang === 'tr' ? 'Henüz video eklenmemiş.' : 'No videos added yet.')}
            </p>
          </div>
        )}

        {/* Galeri ızgarası */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              {item.type === 'video' && item.videoUrl ? (
                <>
                  <div className="w-full h-full">
                    <video 
                      className="object-cover w-full h-full"
                      src={item.videoUrl}
                      muted
                      playsInline
                      loop
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="bg-amber-500 rounded-full p-3 text-white">
                      <FaPlay />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {item.image && (
                    <Image
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.title || `Gallery Image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      priority={index < 6}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <FaExpand className="text-white text-2xl" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button 
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center z-20 transition-all"
            onClick={closeLightbox}
            aria-label="Close lightbox"
          >
            <FaTimes />
          </button>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={lightboxItemIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-5xl h-[80vh] md:px-10">
                {filteredItems[lightboxItemIndex]?.type === 'video' && filteredItems[lightboxItemIndex]?.videoUrl ? (
                  <video
                    ref={videoRef}
                    src={filteredItems[lightboxItemIndex].videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  ></video>
                ) : filteredItems[lightboxItemIndex]?.image ? (
                  <Image
                    src={filteredItems[lightboxItemIndex].image || '/images/placeholder.jpg'}
                    alt={filteredItems[lightboxItemIndex]?.title || `Gallery Image ${lightboxItemIndex + 1}`}
                    fill
                    sizes="100vw"
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-white">Görüntü yüklenemedi</p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          
          <button 
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center z-20 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              prevLightboxImage();
            }}
            aria-label="Previous image"
          >
            <FaChevronLeft className="text-xl" />
          </button>
          <button 
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center z-20 transition-all"
            onClick={(e) => {
              e.stopPropagation();
              nextLightboxImage();
            }}
            aria-label="Next image"
          >
            <FaChevronRight className="text-xl" />
          </button>
          
          <div className="absolute bottom-6 left-0 right-0 text-center text-white">
            {lightboxItemIndex + 1} / {filteredItems.length}
          </div>
        </div>
      )}
    </div>
  );
} 