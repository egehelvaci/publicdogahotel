'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTimes } from 'react-icons/fa'; // Removed unused FaUpload
import MediaUploader from '../../../../components/admin/ImageUploader'; // Correct component name

interface GalleryAddProps {
  params: {
    lang: string;
  };
}

export default function GalleryAdd({ params }: GalleryAddProps) {
  const router = useRouter();
  const { lang } = params;
  
  // State'ler
  const [titleTR, setTitleTR] = useState('');
  const [titleEN, setTitleEN] = useState('');
  const [descriptionTR, setDescriptionTR] = useState('');
  const [descriptionEN, setDescriptionEN] = useState('');
  const [category, setCategory] = useState('general');
  const [image, setImage] = useState('');
  const [active, setActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Medya yükleme (Removed unused fileType parameter)
  const handleImageUpload = (url: string) => {
    setImage(url);
  };

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Temel doğrulama
    if (!titleTR || !titleEN || !image) {
      setError(lang === 'tr' 
        ? 'Lütfen başlık (TR ve EN) ve resim alanlarını doldurun.' 
        : 'Please fill in the title (TR and EN) and image fields.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titleTR,
          titleEN,
          descriptionTR,
          descriptionEN,
          category,
          image,
          active,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Galeri öğesi eklenirken bir hata oluştu.');
      }
      
      setSuccess(lang === 'tr' 
        ? 'Galeri öğesi başarıyla eklendi!' 
        : 'Gallery item added successfully!');
        
      // Kısa bir süre sonra ana galeri sayfasına yönlendir
      setTimeout(() => {
        router.push(`/${lang}/admin/gallery`);
      }, 1500);

    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error('Galeri öğesi eklenirken hata:', err);
      let errorMessage = 'Galeri öğesi eklenirken bir hata oluştu.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // İptal
  const handleCancel = () => {
    router.push(`/${lang}/admin/gallery`);
  };

  // Kategori seçenekleri
  const categoryOptions = [
    { value: 'general', label: lang === 'tr' ? 'Genel' : 'General' },
    { value: 'rooms', label: lang === 'tr' ? 'Odalar' : 'Rooms' },
    { value: 'restaurant', label: lang === 'tr' ? 'Restoran' : 'Restaurant' },
    { value: 'spa', label: lang === 'tr' ? 'Spa' : 'Spa' },
    { value: 'pool', label: lang === 'tr' ? 'Havuz' : 'Pool' },
    { value: 'beach', label: lang === 'tr' ? 'Plaj' : 'Beach' },
    { value: 'events', label: lang === 'tr' ? 'Etkinlikler' : 'Events' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {lang === 'tr' ? 'Galeri Öğesi Ekle' : 'Add Gallery Item'}
          </h1>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <FaTimes />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Resim Yükleme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'tr' ? 'Görsel' : 'Image'} *
            </label>
            <div className="mt-1 flex flex-col items-center space-y-2">
              {image ? (
                <div className="relative w-full h-64 overflow-hidden rounded-lg">
                  <img src={image} alt="Preview" className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <MediaUploader onMediaUploaded={handleImageUpload} folder="gallery" type="image" /> // Correct component and prop name, added type prop
              )}
            </div>
          </div>
          
          {/* Türkçe Başlık */}
          <div>
            <label htmlFor="titleTR" className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'tr' ? 'Başlık (Türkçe)' : 'Title (Turkish)'} *
            </label>
            <input
              type="text"
              id="titleTR"
              value={titleTR}
              onChange={(e) => setTitleTR(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder={lang === 'tr' ? 'Türkçe başlık girin' : 'Enter Turkish title'}
              required
            />
          </div>
          
          {/* İngilizce Başlık */}
          <div>
            <label htmlFor="titleEN" className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'tr' ? 'Başlık (İngilizce)' : 'Title (English)'} *
            </label>
            <input
              type="text"
              id="titleEN"
              value={titleEN}
              onChange={(e) => setTitleEN(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder={lang === 'tr' ? 'İngilizce başlık girin' : 'Enter English title'}
              required
            />
          </div>
          
          {/* Türkçe Açıklama */}
          <div>
            <label htmlFor="descriptionTR" className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'tr' ? 'Açıklama (Türkçe)' : 'Description (Turkish)'}
            </label>
            <textarea
              id="descriptionTR"
              value={descriptionTR}
              onChange={(e) => setDescriptionTR(e.target.value)}
              rows={3}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder={lang === 'tr' ? 'Türkçe açıklama girin' : 'Enter Turkish description'}
            />
          </div>
          
          {/* İngilizce Açıklama */}
          <div>
            <label htmlFor="descriptionEN" className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'tr' ? 'Açıklama (İngilizce)' : 'Description (English)'}
            </label>
            <textarea
              id="descriptionEN"
              value={descriptionEN}
              onChange={(e) => setDescriptionEN(e.target.value)}
              rows={3}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
              placeholder={lang === 'tr' ? 'İngilizce açıklama girin' : 'Enter English description'}
            />
          </div>
          
          {/* Kategori */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'tr' ? 'Kategori' : 'Category'}
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Aktif/Pasif */}
          <div className="flex items-center">
            <input
              id="active"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              {lang === 'tr' ? 'Aktif (hemen yayınla)' : 'Active (publish immediately)'}
            </label>
          </div>
          
          {/* Butonlar */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              disabled={isLoading}
            >
              <FaTimes className="mr-2 -ml-1" />
              {lang === 'tr' ? 'İptal' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 -ml-1"></span>
              ) : (
                <FaSave className="mr-2 -ml-1" />
              )}
              {lang === 'tr' ? 'Kaydet' : 'Save'}
            </button>
          </div>
        </form>
      </div>
  );
}
