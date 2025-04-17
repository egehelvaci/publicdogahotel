import React from 'react';
import { Metadata } from 'next';
import { getDictionary } from '@/app/dictionaries';
import GalleryPage from './GalleryPage';

export const metadata: Metadata = {
  title: 'Galeri | Doğa Tatil Evi',
  description: 'Doğa Tatil Evi\'nin güzel mekanlarını, havuzunu, bahçesini ve çevresini keşfedin. Tatil evinizde sizi bekleyen manzaralardan enstantaneler.',
}

export default async function GalleryPageServer({ params }: { params: { lang: string } }) {
  // params'ı await etmemiz gerekiyor
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'tr';
  
  // Sözlük verilerini al
  const dictionary = await getDictionary(lang);
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <GalleryPage lang={lang} />
      </main>
    </div>
  );
} 