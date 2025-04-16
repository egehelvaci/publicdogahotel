'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaUpload, FaTrash, FaSave, FaTimes, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getRoomById, updateRoomGallery } from '../../../../../data/admin/roomsData';

interface AdminRoomGalleryPageProps {
  params: {
    lang: string;
    id: string;
  };
}

export default function AdminRoomGalleryPage({ params }: AdminRoomGalleryPageProps) {
  // Next.js 15'te params Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;
  const id = resolvedParams.id;
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [mainImage, setMainImage] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  // Oda verilerini yükle
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const roomItem = await getRoomById(id);
        
        if (roomItem) {
          setRoomName(lang === 'tr' ? roomItem.nameTR : roomItem.nameEN);
          console.log('Oda verileri yüklendi:', roomItem.id);
          console.log('Galeri resimleri:', roomItem.gallery);
          console.log('Ana resim:', roomItem.image);
          setGallery(roomItem.gallery || []);
          setMainImage(roomItem.image);
        } else {
          toast.error(lang === 'tr' ? 'Oda bulunamadı!' : 'Room not found!');
          router.push(`/${lang}/admin/rooms`);
        }
      } catch (error) {
        console.error('Oda yüklenirken hata:', error);
        toast.error(lang === 'tr' ? 'Oda bilgileri yüklenirken bir hata oluştu!' : 'An error occurred while loading room data!');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRoomData();
  }, [id, lang, router]);

  // Görsel seçme/seçimini kaldırma
  const toggleImageSelection = (imagePath: string) => {
    if (selectedImages.includes(imagePath)) {
      setSelectedImages(selectedImages.filter(img => img !== imagePath));
    } else {
      setSelectedImages([...selectedImages, imagePath]);
    }
  };

  // Tüm görselleri seç/seçimi kaldır
  const toggleSelectAll = () => {
    if (selectedImages.length === gallery.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages([...gallery]);
    }
  };

  // Ana görsel olarak ayarla
  const setAsMainImage = (imagePath: string) => {
    setMainImage(imagePath);
    toast.success(lang === 'tr' ? 'Ana görsel güncellendi!' : 'Main image updated!');
  };

  // Seçili görselleri sil
  const deleteSelectedImages = () => {
    if (selectedImages.length === 0) return;
    
    // Ana görsel seçildiyse uyarı göster
    if (selectedImages.includes(mainImage)) {
      toast.error(lang === 'tr' ? 'Ana görsel silinemez! Lütfen önce başka bir görseli ana görsel olarak ayarlayın.' : 'Cannot delete main image! Please set another image as main first.');
      return;
    }
    
    // Görselleri filtreleyerek seçilenleri kaldır
    const updatedGallery = gallery.filter(img => !selectedImages.includes(img));
    setGallery(updatedGallery);
    setSelectedImages([]);
    
    toast.success(
      lang === 'tr' 
        ? `${selectedImages.length} görsel kaldırıldı!` 
        : `${selectedImages.length} images removed!`
    );
  };

  // Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedFiles: string[] = [];
    const failedUploads: string[] = [];

    try {
      console.log(`Yükleme başladı: ${files.length} dosya`);
      
      // Her dosya için ayrı ayrı yükleme işlemi
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Dosya yükleniyor: ${file.name}`);
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        console.log('Yükleme sonucu:', result);

        if (result.success) {
          uploadedFiles.push(result.filePath);
          console.log(`Dosya başarıyla yüklendi: ${result.filePath}`);
        } else {
          failedUploads.push(file.name);
          console.error(`Dosya yüklenemedi: ${file.name}`, result.message || 'Bilinmeyen hata');
        }
      }

      // Başarılı yüklemeleri galeriye ekle
      if (uploadedFiles.length > 0) {
        const updatedGallery = [...gallery, ...uploadedFiles];
        console.log('Güncellenmiş galeri:', updatedGallery);
        setGallery(updatedGallery);
        
        toast.success(
          lang === 'tr'
            ? `${uploadedFiles.length} görsel başarıyla yüklendi!`
            : `${uploadedFiles.length} images uploaded successfully!`
        );
      }

      // Başarısız yüklemeleri bildir
      if (failedUploads.length > 0) {
        console.error('Yüklenemeyen dosyalar:', failedUploads);
        toast.error(
          lang === 'tr'
            ? `${failedUploads.length} görsel yüklenemedi!`
            : `Failed to upload ${failedUploads.length} images!`
        );
      }
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      toast.error(lang === 'tr' ? 'Görsel yüklenirken bir hata oluştu!' : 'An error occurred while uploading images!');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Değişiklikleri kaydet
  const saveChanges = async () => {
    if (gallery.length === 0) {
      toast.error(lang === 'tr' ? 'En az bir görsel gereklidir!' : 'At least one image is required!');
      return;
    }
    
    // Ana görsel galeriye dahil değilse ekle
    if (!gallery.includes(mainImage)) {
      setGallery([mainImage, ...gallery]);
    }

    setIsSaving(true);

    try {
      // Odayı güncelle
      const success = await updateRoomGallery(id, {
        image: mainImage,
        gallery: gallery
      });
      
      if (success) {
        toast.success(lang === 'tr' ? 'Galeri başarıyla güncellendi!' : 'Gallery updated successfully!');
        
        // Düzenleme sayfasına geri dön
        router.push(`/${lang}/admin/rooms/edit/${id}`);
      } else {
        throw new Error('Galeri güncellenemedi');
      }
    } catch (error) {
      console.error('Galeri güncelleme hatası:', error);
      toast.error(lang === 'tr' ? 'Galeri güncellenirken bir hata oluştu!' : 'An error occurred while updating the gallery!');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center text-xl font-semibold text-gray-700">
          {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {lang === 'tr' ? 'Oda Galerisi' : 'Room Gallery'}: {roomName}
            </h1>
            <Link
              href={`/${lang}/admin/rooms/edit/${id}`}
              className="text-teal-600 hover:text-teal-700 flex items-center"
            >
              <FaArrowLeft className="mr-2" />
              {lang === 'tr' ? 'Odayı Düzenlemeye Dön' : 'Back to Room Edit'}
            </Link>
          </div>

          {/* Yükleme Düğmesi */}
          <div className="mb-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md flex items-center"
            >
              {isUploading ? (
                <span>{lang === 'tr' ? 'Yükleniyor...' : 'Uploading...'}</span>
              ) : (
                <>
                  <FaUpload className="mr-2" />
                  {lang === 'tr' ? 'Görsel Yükle' : 'Upload Images'}
                </>
              )}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Seçenekler ve Kaydet Butonu */}
          <div className="flex flex-wrap justify-between items-center mb-4">
            <div className="flex gap-2">
              <button
                onClick={toggleSelectAll}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md text-sm"
              >
                {selectedImages.length === gallery.length
                  ? lang === 'tr' ? 'Tümünün Seçimini Kaldır' : 'Deselect All'
                  : lang === 'tr' ? 'Tümünü Seç' : 'Select All'}
              </button>
              
              {selectedImages.length > 0 && (
                <>
                  <button
                    onClick={deleteSelectedImages}
                    className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center"
                  >
                    <FaTrash className="mr-2" />
                    {lang === 'tr' ? `Seçilenleri Sil (${selectedImages.length})` : `Delete Selected (${selectedImages.length})`}
                  </button>
                </>
              )}
            </div>
            <button
              onClick={saveChanges}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
            >
              <FaSave className="mr-2" />
              {isSaving 
                ? (lang === 'tr' ? 'Kaydediliyor...' : 'Saving...') 
                : (lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes')
              }
            </button>
          </div>

          {/* Ana Görsel */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {lang === 'tr' ? 'Ana Görsel' : 'Main Image'}
            </h2>
            <div className="relative w-full h-64 overflow-hidden rounded-lg border border-gray-300 bg-gray-100 cursor-pointer"
                 onClick={() => window.open(mainImage, '_blank')}>
              <img
                src={mainImage}
                alt={roomName}
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error(`Ana görsel yüklenemedi: ${mainImage}`);
                  e.currentTarget.src = '/images/placeholder.jpg';
                }}
              />
              <div className="absolute bottom-2 right-2 bg-teal-500 text-white rounded-full px-2 py-1 text-xs">
                {lang === 'tr' ? 'Ana Görsel' : 'Main Image'}
              </div>
            </div>
          </div>

          {/* Galeri */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {lang === 'tr' ? 'Galeri Görselleri' : 'Gallery Images'}
            </h2>
            
            {gallery.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">
                  {lang === 'tr' ? 'Henüz hiç görsel yok! Görsel yükleyin.' : 'No images yet! Upload some images.'}
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-500">
                  {lang === 'tr' 
                    ? `${gallery.length} görsel galeriye eklenmiş.` 
                    : `${gallery.length} images added to gallery.`
                  }
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {gallery.map((image, index) => (
                    <div 
                      key={index}
                      className={`relative border-2 ${selectedImages.includes(image) ? 'border-blue-500' : 'border-gray-200'} ${mainImage === image ? 'ring-2 ring-teal-500' : ''} rounded-lg overflow-hidden aspect-square group`}
                    >
                      <div className="absolute inset-0">
                        <img 
                          src={image} 
                          alt={`Görsel ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error(`Görsel yüklenemedi: ${image}`);
                            e.currentTarget.src = '/images/placeholder.jpg';
                          }}
                          onClick={() => window.open(image, '_blank')}
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200">
                        <div className="absolute top-2 right-2 flex space-x-1">
                          {selectedImages.includes(image) && (
                            <span className="bg-blue-500 text-white p-1 rounded-full">
                              <FaCheck size={12} />
                            </span>
                          )}
                          {mainImage === image && (
                            <span className="bg-teal-500 text-white p-1 rounded-full text-xs px-2">
                              Ana
                            </span>
                          )}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleImageSelection(image);
                            }}
                            className="p-1 bg-white/80 rounded text-gray-700 hover:bg-white"
                          >
                            {selectedImages.includes(image) ? 'Seçimi Kaldır' : 'Seç'}
                          </button>
                          
                          {mainImage !== image && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAsMainImage(image);
                              }}
                              className="p-1 bg-teal-600 rounded text-white text-xs"
                            >
                              Ana Görsel Yap
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 