'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaUpload, FaTrash, FaImage, FaGripLines } from 'react-icons/fa';
import AdminNavbar from '../../../../../components/AdminNavbar';
import { getServiceById, updateServiceGallery } from '../../../../../data/admin/servicesData';

type PageProps = {
  params: {
    lang: string;
    id: string;
  };
};

export default function ServiceGalleryPage({ params }: PageProps) {
  // Next.js 15'te params Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;
  const id = resolvedParams.id;
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [serviceName, setServiceName] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  // Hizmet verilerini yükle
  const fetchServiceData = async () => {
    try {
      setLoading(true);
      // API'den doğrudan alım yapalım, önbelleği tamamen atlayarak
      const timestamp = Date.now();
      const baseUrl = window.location.origin;
      
      const response = await fetch(`${baseUrl}/api/admin/services/${id}?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(lang === 'tr' ? 'Hizmet bulunamadı' : 'Service not found');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.item) {
        throw new Error(lang === 'tr' ? 'Hizmet bulunamadı' : 'Service not found');
      }
      
      const service = data.item;
      setServiceName(lang === 'tr' ? service.titleTR : service.titleEN);
      setImages(service.images || []);
      
    } catch (err: any) {
      setMessage({
        text: err.message || 'Hizmet verileri yüklenemedi',
        type: 'error'
      });
      console.error('Hizmet verileri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yükleme
  useEffect(() => {
    fetchServiceData();
    
    // Sayfa görünür olduğunda verileri yenile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServiceData();
      }
    };
    
    // Görünürlük değişikliklerini dinle (kullanıcı sekmeye geri döndüğünde)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Düzenli aralıklarla verileri yenileme - localStorage yerine tamamen sunucu odaklı yaklaşım
    const intervalId = setInterval(fetchServiceData, 15000); // 15 saniyede bir
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [id, lang]);

  // Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'services');
        
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(lang === 'tr' ? 'Dosya yüklenemedi' : 'File upload failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Yeni görsel yolunu ekle
          setImages(prev => [...prev, data.filePath]);
        }
      }
      
      setMessage({
        text: lang === 'tr' ? 'Görsel(ler) başarıyla yüklendi' : 'Image(s) uploaded successfully',
        type: 'success'
      });
      
      // Input'u temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Dosya yükleme hatası:', error);
      setMessage({
        text: error.message || 'Dosya yüklenirken bir hata oluştu',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  // Görseli kaldır
  const removeImage = (image: string) => {
    // Görseli listeden kaldır
    setImages(prev => prev.filter(img => img !== image));
  };

  // Değişiklikleri kaydet
  const saveChanges = async () => {
    setUploading(true);
    setMessage(null);
    
    try {
      // İlk görsel ana görsel olarak ayarlanır
      const mainImage = images.length > 0 ? images[0] : '';
      
      // API isteğini önbelleği atlatacak şekilde oluştur
      const timestamp = Date.now();
      const baseUrl = window.location.origin;
      
      const response = await fetch(`${baseUrl}/api/admin/services/${id}/gallery?t=${timestamp}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({
          image: mainImage,
          images: images
        }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(lang === 'tr' ? 'Değişiklikler kaydedilemedi' : 'Could not save changes');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          text: lang === 'tr' ? 'Değişiklikler kaydedildi' : 'Changes saved successfully',
          type: 'success'
        });
        
        // Kaydettikten sonra yeniden veri yükle
        setTimeout(() => {
          router.refresh(); // Next.js router'ı yenile
          fetchServiceData(); // Veriyi yeniden çek
        }, 500);
      } else {
        throw new Error(lang === 'tr' ? 'Değişiklikler kaydedilemedi' : 'Could not save changes');
      }
    } catch (error: any) {
      console.error('Kaydetme hatası:', error);
      setMessage({
        text: error.message || 'Değişiklikler kaydedilirken bir hata oluştu',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  // Manuel sürükle bırak işlemleri - daha kararlı çalışması için geliştirdim
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newImages = [...images];
    const draggedImage = newImages[draggedItem];
    
    // Öğeyi kaldır ve yeni konuma ekle
    newImages.splice(draggedItem, 1);
    newImages.splice(index, 0, draggedImage);
    
    setImages(newImages);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar lang={lang} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/${lang}/admin/services`)}
                className="mr-4 p-2 bg-white rounded-full shadow hover:bg-gray-100"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                {lang === 'tr' ? `${serviceName} - Görsel Galerisi` : `${serviceName} - Image Gallery`}
              </h1>
            </div>
            
            <button
              onClick={saveChanges}
              disabled={uploading}
              className={`px-4 py-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 flex items-center gap-2 ${uploading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>
                  {lang === 'tr' ? 'Kaydediliyor...' : 'Saving...'}
                </>
              ) : (
                <>
                  <FaImage />
                  {lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
          
          {message && (
            <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          
          {/* Dosya Yükleme Alanı */}
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {lang === 'tr' ? 'Görsel Yükle' : 'Upload Images'}
              </h2>
            </div>
            
            <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="mb-4 text-center">
                <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-700">
                  {lang === 'tr' ? 'Görselleri buraya sürükleyin veya' : 'Drag and drop your images here or'}
                </p>
                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none">
                  <span>{lang === 'tr' ? 'dosya seçin' : 'browse files'}</span>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                {lang === 'tr'
                  ? 'PNG, JPG, GIF veya WEBP formatları desteklenir. Maksimum dosya boyutu 5MB.'
                  : 'PNG, JPG, GIF or WEBP formats are supported. Maximum file size 5MB.'}
              </p>
            </div>
          </div>
          
          {/* Görsel Galerisi */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {lang === 'tr' ? 'Galeri Görselleri' : 'Gallery Images'}
              </h2>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">
                  {images.length} {lang === 'tr' ? 'görsel' : 'images'}
                </span>
                {images.length > 0 && (
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-md">
                    {lang === 'tr' ? 'İlk görsel ana görseldir' : 'First image is the main image'}
                  </div>
                )}
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
              </div>
            ) : images.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <FaImage className="h-16 w-16 mb-4" />
                <p>{lang === 'tr' ? 'Henüz görsel yüklenmemiş' : 'No images uploaded yet'}</p>
              </div>
            ) : (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  {lang === 'tr' 
                    ? 'Görselleri sıralamak için sürükleyip bırakabilirsiniz. En üstteki görsel ana görsel olarak kullanılacaktır.' 
                    : 'You can drag and drop images to reorder them. The topmost image will be used as the main image.'}
                </p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative group rounded-lg overflow-hidden border-2 cursor-move
                        ${index === 0 ? 'border-teal-400 ring-2 ring-teal-400' : 'border-gray-200'} 
                        ${draggedItem === index ? 'opacity-50' : 'opacity-100'}`}
                    >
                      <div className="aspect-w-1 aspect-h-1 w-full">
                        <img
                          src={image}
                          alt={`${serviceName} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Kontrol Butonları */}
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-2">
                          <div
                            className="p-2 rounded-full bg-white hover:bg-gray-200 transition-colors cursor-move"
                            title={lang === 'tr' ? 'Sürükle' : 'Drag to reorder'}
                          >
                            <FaGripLines className="text-gray-700" />
                          </div>
                          <button
                            onClick={() => removeImage(image)}
                            className="p-2 rounded-full bg-white hover:bg-red-500 hover:text-white transition-colors"
                            title={lang === 'tr' ? 'Görseli sil' : 'Remove image'}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      
                      {/* Ana Görsel Etiketi */}
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-teal-500 text-white text-xs px-2 py-1 rounded-md">
                          {lang === 'tr' ? 'Ana Görsel' : 'Main Image'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 