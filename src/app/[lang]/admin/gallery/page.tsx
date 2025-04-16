'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaEdit, FaTrashAlt, FaArrowUp, FaArrowDown, FaPlus, FaEye, FaTimes, FaCheck, FaGripLines, FaYoutube, FaImage } from 'react-icons/fa';
import { BiLoader } from 'react-icons/bi';
import AdminHeader from '@/app/components/admin/AdminHeader';

interface GalleryItem {
  id: string;
  image: string;
  order: number;
  type: 'image' | 'video';
  youtubeId?: string;
  title?: string;
  description?: string;
}

// Corrected PageProps interface
interface GalleryPageProps {
  params: {
    lang: string;
  };
}

export default function GalleryPage({ params }: GalleryPageProps) {
  // Removed unnecessary React.use() call
  // const resolvedParams = React.use(params);
  const lang = params.lang || 'tr'; // Get lang directly from params

  const router = useRouter();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [isMultiDeleteModalOpen, setIsMultiDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sıralama işlemi için değişkenler
  const [draggedItem, setDraggedItem] = useState<GalleryItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubePreview, setYoutubePreview] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');

  // Galeri öğelerini yükle
  useEffect(() => {
    fetchGalleryItems();
  }, []);

  const fetchGalleryItems = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Galeri öğeleri alınıyor...');
      const response = await fetch('/api/admin/gallery', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        cache: 'no-store'
      });
      
      console.log('API yanıtı:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Galeri öğeleri yüklenirken hata: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Galeri verileri alındı:', data);
      
      if (data && Array.isArray(data.items)) {
        setGalleryItems(data.items);
      } else {
        throw new Error('Geçersiz veri formatı');
      }
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error('Galeri öğeleri yüklenirken hata:', err);
      let errorMessage = 'Bilinmeyen hata';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Galeri öğeleri yüklenirken bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Sıralama işlemleri
  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = galleryItems.findIndex(item => item.id === id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === galleryItems.length - 1)
    ) return;

    const newItems = [...galleryItems];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Öğeleri değiştir
    [newItems[currentIndex], newItems[targetIndex]] = [newItems[targetIndex], newItems[currentIndex]];
    
    // Sıra numaralarını güncelle
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setGalleryItems(updatedItems);

    try {
      // API isteği ile sıralamayı güncelle
      const response = await fetch('/api/admin/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems.map(item => ({ id: item.id, order: item.order })) })
      });
      
      if (!response.ok) throw new Error('Sıralama güncellenirken hata oluştu');
    } catch (err) {
      console.error('Sıralama güncelleme hatası:', err);
      // Hata durumunda orijinal listeye geri dön
      fetchGalleryItems();
    }
  };

  // Sürükle-bırak işlemleri
  const handleDragStart = (item: GalleryItem) => {
    if (selectMode) return; // Seçim modunda sürüklemeyi engelle
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedItem || selectMode) return;
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || selectMode) return;

    const draggedIndex = galleryItems.findIndex(item => item.id === draggedItem.id);
    if (draggedIndex === dropIndex) return;

    // Yeni sıralama oluştur
    const items = [...galleryItems];
    const [movedItem] = items.splice(draggedIndex, 1);
    items.splice(dropIndex, 0, movedItem);

    // Sıra numaralarını güncelle
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    // State'i güncelle ve kullanıcıya hemen geri bildirim ver
    setGalleryItems(updatedItems);
    setDraggedItem(null);
    setDragOverIndex(null);

    try {
      // API isteği ile sıralamayı güncelle
      const response = await fetch('/api/admin/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems.map(item => ({ id: item.id, order: item.order })) })
      });
      
      if (!response.ok) throw new Error('Sıralama güncellenirken hata oluştu');
    } catch (err) {
      console.error('Sıralama güncelleme hatası:', err);
      // Hata durumunda orijinal listeye geri dön
      fetchGalleryItems();
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  // Silme işlemi
  const deleteItem = async () => {
    if (!selectedItemId) return;
    
    try {
      const response = await fetch(`/api/admin/gallery/${selectedItemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Silme işlemi sırasında hata oluştu');
      
      setGalleryItems(galleryItems.filter(item => item.id !== selectedItemId));
      setIsDeleteModalOpen(false);
      setSelectedItemId(null);
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  // Çoklu silme işlemi
  const deleteMultipleItems = async () => {
    if (selectedItems.length === 0) return;
    
    setIsDeleting(true);
    
    try {
      // Sırayla her bir öğeyi sil
      for (const id of selectedItems) {
        const response = await fetch(`/api/admin/gallery/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          console.error(`${id} ID'li öğe silinirken hata oluştu`);
        }
      }
      
      // Silinen öğeleri listeden kaldır
      setGalleryItems(galleryItems.filter(item => !selectedItems.includes(item.id)));
      
      // Seçim modunu kapat ve seçili öğeleri temizle
      setSelectMode(false);
      setSelectedItems([]);
      setIsMultiDeleteModalOpen(false);
    } catch (err) {
      console.error('Çoklu silme hatası:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Görsel yükleme
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Dosyaları kontrol et ve önizleme URLsi oluştur
    const fileArray = Array.from(files);
    
    // Sadece resim dosyalarını filtrele
    const imageOnlyFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    // Resim olmayan dosyalar varsa uyarı ver
    if (imageOnlyFiles.length !== fileArray.length) {
      setError(lang === 'tr' 
        ? 'Sadece resim dosyaları yükleyebilirsiniz (JPG, PNG, WebP).' 
        : 'Only image files (JPG, PNG, WebP) can be uploaded.');
    }
    
    setImageFiles(imageOnlyFiles);
    
    // Önizleme URLsi oluştur
    const newPreviewUrls = imageOnlyFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(newPreviewUrls);
  };
  
  const removePreview = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(''); // Önceki hataları temizle
    
    try {
      // Her bir dosyayı ayrı ayrı yükle
      let completedUploads = 0;
      
      // Sırayla yükleme
      for (const file of imageFiles) {
        // Dosya boyutu kontrolü
        const maxSizeInMB = 25; // resimler için 25MB sınırı
        const fileSizeInMB = file.size / (1024 * 1024);
        
        if (fileSizeInMB > maxSizeInMB) {
          throw new Error(`${file.name}: ${lang === 'tr' 
            ? `Dosya boyutu çok büyük (${fileSizeInMB.toFixed(2)}MB). Görseller için maksimum boyut ${maxSizeInMB}MB olmalıdır.`
            : `File size too large (${fileSizeInMB.toFixed(2)}MB). Maximum size for images is ${maxSizeInMB}MB.`}`);
        }
        
        console.log(`Dosya yükleniyor: ${file.name}, Boyut: ${fileSizeInMB.toFixed(2)}MB, Tip: ${file.type}`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', 'image');
        formData.append('filename', file.name);
        
        // API ile iletişim
        try {
          console.log(`${file.name} yükleme başlatılıyor...`);
          
          const response = await fetch('/api/admin/gallery/upload', {
            method: 'POST',
            body: formData,
            // Uzun yüklemeler için timeout süresini artırma
            signal: AbortSignal.timeout(120000) // 2 dakika timeout
          });
          
          // API yanıt detaylarını al
          const responseData = await response.json().catch(e => ({ error: 'Yanıt ayrıştırılamadı' }));
          console.log(`${file.name} API yanıtı:`, response.status, responseData);
          
          if (!response.ok) {
            // API'den dönen hata mesajını kullan veya genel hata mesajı
            const errorMessage = responseData?.message || responseData?.error || `${file.name} yüklenirken hata oluştu (${response.status})`;
            throw new Error(errorMessage);
          }
          
          completedUploads++;
          setUploadProgress(Math.round((completedUploads / imageFiles.length) * 100));
          console.log(`${file.name} yükleme tamamlandı (${completedUploads}/${imageFiles.length})`);
          
        } catch (uploadError: any) {
          console.error(`${file.name} yükleme hatası:`, uploadError);
          
          // Network timeouts ve bağlantı hatalarını özel olarak ele al
          if (uploadError.name === 'AbortError') {
            throw new Error(`${file.name}: ${lang === 'tr' 
              ? 'Yükleme zaman aşımına uğradı. Ağ bağlantınızı kontrol edin veya daha küçük bir dosya deneyin.'
              : 'Upload timed out. Check your network connection or try a smaller file.'}`);
          }
          
          throw uploadError; // Hatayı üst seviyeye taşı
        }
      }
      
      // Başarılı yükleme sonrası form sıfırla ve galeriyi yenile
      setImageFiles([]);
      setPreviewUrls([]);
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchGalleryItems();
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error('Yükleme hatası:', err);
      let errorMessage = lang === 'tr' ? 'Dosya yüklenirken beklenmeyen bir hata oluştu' : 'An unexpected error occurred while uploading files';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Öğe seçim işlemleri
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedItems.length === galleryItems.length) {
      // Tüm seçimleri kaldır
      setSelectedItems([]);
    } else {
      // Tümünü seç
      setSelectedItems(galleryItems.map(item => item.id));
    }
  };

  // YouTube video URL'sini işle
  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    
    // YouTube URL'sinden ID'yi çıkar
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      const videoId = match[2];
      setYoutubePreview(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);
    } else {
      setYoutubePreview('');
    }
  };

  // YouTube videosu yükle
  const uploadYoutubeVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    
    setIsUploading(true);
    setError('');
    
    try {
      // YouTube URL'sinden ID'yi çıkar
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = youtubeUrl.match(regExp);
      
      if (!match || match[2].length !== 11) {
        throw new Error(lang === 'tr' ? 'Geçerli bir YouTube URL\'si giriniz' : 'Please enter a valid YouTube URL');
      }
      
      const videoId = match[2];
      
      // API isteği hazırla
      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          item: {
            type: 'video',
            youtubeId: videoId,
            titleTR: videoTitle,
            titleEN: videoTitle,
            descriptionTR: videoDescription,
            descriptionEN: videoDescription,
            image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            category: 'genel',
            active: true
          }
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Video eklenirken bir hata oluştu');
      }
      
      // Başarılı yükleme sonrası form sıfırla
      setYoutubeUrl('');
      setYoutubePreview('');
      setVideoTitle('');
      setVideoDescription('');
      
      fetchGalleryItems();
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error('YouTube video ekleme hatası:', err);
      let errorMessage = lang === 'tr' ? 'Video eklenirken bir hata oluştu' : 'An error occurred while adding the video';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Added title prop back */}
      <AdminHeader title={lang === 'tr' ? 'Galeri Yönetimi' : 'Gallery Management'} />

      <main className="container mx-auto p-4">
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">
            {lang === 'tr' ? 'Galeri Yönetimi' : 'Gallery Management'}
          </h1>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {/* Medya Tipi Seçici */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {lang === 'tr' ? 'Yeni Medya Yükle' : 'Upload New Media'}
            </h2>
            
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => setMediaType('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mediaType === 'image' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaImage />
                {lang === 'tr' ? 'Fotoğraf Yükle' : 'Upload Image'}
              </button>
              
              <button
                type="button"
                onClick={() => setMediaType('video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  mediaType === 'video' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <FaYoutube />
                {lang === 'tr' ? 'YouTube Video Ekle' : 'Add YouTube Video'}
              </button>
            </div>
          </div>
          
          {/* Resim Yükleme Formu */}
          {mediaType === 'image' && (
            <form onSubmit={uploadImages} className="mb-8">
              <div className="mb-4">
                <label 
                  htmlFor="image-upload" 
                  className="block w-full cursor-pointer p-4 border-2 border-dashed border-blue-300 rounded-lg text-center hover:border-blue-500 transition-colors"
                >
                  <div className="flex flex-col items-center">
                    <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <span className="text-sm text-gray-600">
                      {lang === 'tr' 
                        ? 'Fotoğraf Yüklemek İçin Tıklayın veya Sürükleyip Bırakın' 
                        : 'Click or Drag & Drop to Upload Photos'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      {lang === 'tr'
                        ? 'Desteklenen formatlar: JPG, PNG veya WebP (mak. 25MB)'
                        : 'Supported formats: JPG, PNG or WebP (max. 25MB)'}
                    </span>
                  </div>
                  <input 
                    type="file" 
                    id="image-upload" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    multiple 
                    accept="image/jpeg,image/png,image/webp"
                  />
                </label>
              </div>
              
              {/* Seçilen Dosyaların Önizlemesi */}
              {previewUrls.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-3">
                    {lang === 'tr' ? 'Seçilen Dosyalar' : 'Selected Files'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {previewUrls.map((url, index) => {
                      const file = imageFiles[index];
                      
                      return (
                        <div key={index} className="border rounded-lg p-3 bg-gray-50 relative">
                          <button 
                            type="button"
                            onClick={() => removePreview(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center z-10"
                            aria-label="Remove"
                          >
                            <FaTimes />
                          </button>
                          
                          <div className="mb-2 aspect-video bg-gray-200 rounded overflow-hidden relative">
                            <img 
                              src={url} 
                              alt={`Preview ${index + 1}`} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Yükleme Butonu */}
              {previewUrls.length > 0 && (
                <div>
                  {isUploading ? (
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className="text-center mt-2 text-sm text-gray-600">
                        {uploadProgress}% {lang === 'tr' ? 'Yükleniyor...' : 'Uploading...'}
                      </div>
                    </div>
                  ) : (
                    <button 
                      type="submit" 
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {lang === 'tr' ? 'Yükle' : 'Upload'} ({previewUrls.length} {lang === 'tr' ? 'dosya' : 'files'})
                    </button>
                  )}
                </div>
              )}
            </form>
          )}
          
          {/* YouTube Video Ekleme Formu */}
          {mediaType === 'video' && (
            <form onSubmit={uploadYoutubeVideo} className="mb-8">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="youtube-url">
                  {lang === 'tr' ? 'YouTube Video Linki' : 'YouTube Video Link'}
                </label>
                <input
                  type="text"
                  id="youtube-url"
                  value={youtubeUrl}
                  onChange={handleYoutubeUrlChange}
                  placeholder={lang === 'tr' ? 'YouTube video linkini yapıştırın' : 'Paste YouTube video link here'}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'tr' 
                    ? 'Örnek: https://www.youtube.com/watch?v=abc123 veya https://youtu.be/abc123' 
                    : 'Example: https://www.youtube.com/watch?v=abc123 or https://youtu.be/abc123'}
                </p>
              </div>
              
              {/* Video Başlık ve Açıklama */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="video-title">
                  {lang === 'tr' ? 'Video Başlığı' : 'Video Title'}
                </label>
                <input
                  type="text"
                  id="video-title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder={lang === 'tr' ? 'Video başlığı (isteğe bağlı)' : 'Video title (optional)'}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="video-description">
                  {lang === 'tr' ? 'Video Açıklaması' : 'Video Description'}
                </label>
                <textarea
                  id="video-description"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder={lang === 'tr' ? 'Video açıklaması (isteğe bağlı)' : 'Video description (optional)'}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
              
              {/* YouTube Video Önizleme */}
              {youtubePreview && (
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">
                    {lang === 'tr' ? 'Video Önizleme' : 'Video Preview'}
                  </h3>
                  <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden max-w-md">
                    <img 
                      src={youtubePreview} 
                      alt="YouTube Video Preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-600/80 rounded-full w-12 h-12 flex items-center justify-center">
                        <FaYoutube className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Video Ekleme Butonu */}
              <button
                type="submit"
                disabled={!youtubePreview || isUploading}
                className={`px-4 py-2 rounded ${
                  !youtubePreview || isUploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700'
                } text-white flex items-center gap-2`}
              >
                {isUploading ? <BiLoader className="animate-spin" /> : <FaYoutube />}
                {lang === 'tr' ? 'YouTube Video Ekle' : 'Add YouTube Video'}
              </button>
            </form>
          )}
          
          {/* Mevcut Galeri Öğeleri */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {lang === 'tr' ? 'Mevcut Galeri Öğeleri' : 'Current Gallery Items'}
              </h2>
              
              <div className="flex gap-2">
                {/* Sıralama Talimatı */}
                {!selectMode && galleryItems.length > 1 && (
                  <div className="text-sm text-gray-500 mr-2 hidden md:flex items-center gap-1">
                    <FaGripLines />
                    {lang === 'tr' 
                      ? 'Sıralamak için öğeleri sürükleyip bırakın' 
                      : 'Drag and drop items to reorder'}
                  </div>
                )}
                
                {selectMode && selectedItems.length > 0 && (
                  <button 
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                    onClick={() => setIsMultiDeleteModalOpen(true)}
                  >
                    <FaTrashAlt />
                    {lang === 'tr' ? 'Seçilenleri Sil' : 'Delete Selected'} ({selectedItems.length})
                  </button>
                )}
                
                <button 
                  className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                    selectMode 
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  onClick={() => {
                    setSelectMode(!selectMode);
                    if (selectMode) setSelectedItems([]);
                  }}
                >
                  {selectMode ? <FaTimes /> : <FaCheck />}
                  {selectMode 
                    ? (lang === 'tr' ? 'Seçimi İptal Et' : 'Cancel Selection') 
                    : (lang === 'tr' ? 'Çoklu Seçim' : 'Multi Select')
                  }
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-8">
                <BiLoader className="animate-spin text-4xl text-blue-600 mx-auto mb-2" />
                <p>{lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}</p>
              </div>
            ) : galleryItems.length === 0 ? (
              <div className="text-center py-8 bg-gray-100 rounded">
                <p className="text-gray-600">
                  {lang === 'tr' 
                    ? 'Henüz galeri öğesi bulunmuyor. Yukarıdaki formdan yeni görsel veya video ekleyin.' 
                    : 'No gallery items yet. Add new images or videos using the form above.'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {galleryItems.map((item, index) => {
                  // Öğe tipini belirle: Resim mi Video mu?
                  const isVideo = item.type === 'video';
                  // Öğenin sürüklenme durumunu kontrol et
                  const isDragging = draggedItem?.id === item.id;
                  
                  return (
                    <div 
                      key={item.id}
                      className={`border rounded-lg overflow-hidden shadow-md transition-all duration-300 bg-white ${
                        isDragging ? 'opacity-50 cursor-grabbing' : ''
                      }`}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(item)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                    >
                      <div className="flex flex-col">
                        {/* Görsel veya Video Thumbnail */}
                        <div className="relative w-full h-36 sm:h-48 bg-gray-100">
                          <img 
                            src={item.image} 
                            alt={`Gallery item ${item.id}`} 
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Video ise oynat ikonu göster */}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="bg-red-600/80 rounded-full w-10 h-10 flex items-center justify-center">
                                <FaYoutube className="text-white text-xl" />
                              </div>
                            </div>
                          )}
                          
                          {/* Tip göstergesi */}
                          <div className={`absolute top-2 left-2 ${
                            isVideo ? 'bg-red-500' : 'bg-blue-500'
                          } text-white text-xs px-2 py-1 rounded-full`}>
                            {isVideo ? (
                              <div className="flex items-center gap-1">
                                <FaYoutube size={10} />
                                <span>Video</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <FaImage size={10} />
                                <span>Resim</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Başlık ve Açıklama */}
                        {(item.title || item.youtubeId) && (
                          <div className="p-2 border-t">
                            <p className="font-medium text-sm truncate">
                              {item.title || (isVideo ? `YouTube: ${item.youtubeId}` : '')}
                            </p>
                            {item.description && (
                              <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Eylemler ve Bilgiler */}
                        <div className="p-2 bg-white">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">#{item.order + 1}</span>
                            
                            {!selectMode && (
                              <div className="flex space-x-1">
                                {/* Yukarı/Aşağı Okları */}
                                <div className="flex space-x-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveItem(item.id, 'up');
                                    }}
                                    disabled={item.order === 0}
                                    className={`text-gray-600 p-1 rounded hover:bg-gray-100 ${
                                      item.order === 0 ? 'opacity-30 cursor-not-allowed' : ''
                                    }`}
                                    aria-label="Move up"
                                  >
                                    <FaArrowUp size={12} />
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveItem(item.id, 'down');
                                    }}
                                    disabled={item.order === galleryItems.length - 1}
                                    className={`text-gray-600 p-1 rounded hover:bg-gray-100 ${
                                      item.order === galleryItems.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                                    }`}
                                    aria-label="Move down"
                                  >
                                    <FaArrowDown size={12} />
                                  </button>
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedItemId(item.id);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="text-red-600 p-1 rounded hover:bg-gray-100"
                                  aria-label="Delete"
                                >
                                  <FaTrashAlt size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Seçim Göstergesi */}
                        {selectMode && (
                          <div 
                            className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 ${
                              selectedItems.includes(item.id) 
                                ? 'bg-blue-500 border-white' 
                                : 'bg-white/70 border-gray-400'
                            }`}
                            onClick={() => toggleItemSelection(item.id)}
                          >
                            {selectedItems.includes(item.id) && (
                              <FaCheck className="text-white text-xs absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Silme Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {lang === 'tr' ? 'Öğeyi Sil' : 'Delete Item'}
            </h2>
            <p className="mb-6">
              {lang === 'tr' 
                ? 'Bu öğeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.' 
                : 'Are you sure you want to delete this item? This action cannot be undone.'
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedItemId(null);
                }}
              >
                {lang === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={deleteItem}
              >
                {lang === 'tr' ? 'Sil' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Çoklu Silme Modal */}
      {isMultiDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {lang === 'tr' ? 'Seçilen Öğeleri Sil' : 'Delete Selected Items'}
            </h2>
            <p className="mb-6">
              {lang === 'tr' 
                ? `${selectedItems.length} öğeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.` 
                : `Are you sure you want to delete ${selectedItems.length} items? This action cannot be undone.`
              }
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                onClick={() => setIsMultiDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                {lang === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-2"
                onClick={deleteMultipleItems}
                disabled={isDeleting}
              >
                {isDeleting && <BiLoader className="animate-spin" />}
                {lang === 'tr' 
                  ? (isDeleting ? 'Siliniyor...' : 'Sil') 
                  : (isDeleting ? 'Deleting...' : 'Delete')
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
