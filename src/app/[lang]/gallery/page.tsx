import React from 'react';
import { getAllGalleryItems } from '@/app/data/gallery';
import { Metadata } from 'next';
import GalleryCarousel from '@/app/components/GalleryCarousel';
import { getDictionary } from '@/app/dictionaries';

export const metadata: Metadata = {
  title: 'Galeri | Doğa Tatil Evi',
  description: 'Doğa Tatil Evi\'nin güzel mekanlarını, havuzunu, bahçesini ve çevresini keşfedin. Tatil evinizde sizi bekleyen manzaralardan enstantaneler.',
}

export default async function GalleryPage({ params }: { params: { lang: string } }) {
  // params parametresini await ile bekleyelim
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'tr';
  
  // Sözlük verilerini al
  const dictionary = await getDictionary(lang);
  
  const galleryItems = await getAllGalleryItems();
  
  // Galeri öğelerini sıralama
  const sortedGalleryItems = [...galleryItems].sort((a, b) => a.order - b.order);
  
  // Sadece active (aktif) durumdaki öğeleri göster
  const activeItems = sortedGalleryItems.filter(item => item.active !== false);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header bileşeni kaldırıldı - çünkü zaten layout içinde bir header bulunuyor */}
      
      <main className="flex-grow">
        <GalleryCarousel 
          items={activeItems} 
          lang={lang} 
          dictionary={dictionary.gallery}
        />
      </main>
      
      {/* Footer bileşeni root layout'ta olduğu için burada kaldırıldı */}
    </div>
  );
} 