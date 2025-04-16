'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaTimes, FaExpand } from 'react-icons/fa';
import ScrollAnimationWrapper from '../../components/ScrollAnimationWrapper';
import { staticGalleryImages, getImagePaths } from '../../utils/galleryUtils';

type GalleryPageProps = {
  lang: string;
};

export default function GalleryPage({ lang }: GalleryPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [sliderActiveIndex, setSliderActiveIndex] = useState(0);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  const openLightbox = (index: number) => {
    setLightboxImageIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev === staticGalleryImages.length - 1 ? 0 : prev + 1));
  };

  const prevLightboxImage = () => {
    setLightboxImageIndex((prev) => (prev === 0 ? staticGalleryImages.length - 1 : prev - 1));
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 mt-4">
        <ScrollAnimationWrapper animation="fadeIn" delay={0.1} once={true}>
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">
              {lang === 'tr' ? 'Fotoğraf Galerisi' : 'Photo Gallery'}
            </h2>
          </div>
        </ScrollAnimationWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staticGalleryImages.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <Image
                src={image.path}
                alt={`Gallery Image ${index + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                priority={index < 6}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <FaExpand className="text-white text-2xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

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
              key={lightboxImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-full max-w-5xl h-[80vh] md:px-10">
                <Image
                  src={staticGalleryImages[lightboxImageIndex].path}
                  alt={`Gallery Image ${lightboxImageIndex + 1}`}
                  fill
                  sizes="100vw"
                  style={{ objectFit: 'contain' }}
                  priority
                />
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
            {lightboxImageIndex + 1} / {staticGalleryImages.length}
          </div>
        </div>
      )}
    </div>
  );
} 