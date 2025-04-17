'use client';

import React, { useState, useRef, useCallback } from 'react';
import { FaCloudUploadAlt, FaImage, FaVideo, FaTimesCircle } from 'react-icons/fa';
import ImageKitImage from './ImageKitImage';
import ImageKitVideo from './ImageKitVideo';

interface MediaUploaderProps {
  onUpload: (result: { url: string; fileId: string; fileType: string }) => void;
  initialUrl?: string;
  type?: 'image' | 'video' | 'any';
  maxSizeMB?: number;
  label?: string;
  folder?: string;
  className?: string;
  errorMessage?: string;
  apiEndpoint?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  onUpload,
  initialUrl = '',
  type = 'any',
  maxSizeMB = 100,
  label = 'Medya Yükle',
  folder = 'uploads',
  className = '',
  errorMessage = '',
  apiEndpoint = '/api/upload'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorText, setErrorText] = useState(errorMessage);
  const [previewUrl, setPreviewUrl] = useState(initialUrl);
  const [fileType, setFileType] = useState<'image' | 'video'>(initialUrl?.match(/\.(mp4|webm|mov)$/i) ? 'video' : 'image');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dosya türüne göre MIME tipleri
  const getAcceptedFileTypes = (): string => {
    switch (type) {
      case 'image':
        return 'image/jpeg,image/png,image/webp,image/gif';
      case 'video':
        return 'video/mp4,video/webm,video/ogg,video/mov,video/quicktime';
      case 'any':
        return 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/mov,video/quicktime';
      default:
        return '';
    }
  };
  
  // Dosya seçildiğinde
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsError(false);
    setErrorText('');
    
    // Dosya türü kontrolü
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (type === 'image' && !isImage) {
      setIsError(true);
      setErrorText('Lütfen geçerli bir görsel dosyası seçin.');
      return;
    }
    
    if (type === 'video' && !isVideo) {
      setIsError(true);
      setErrorText('Lütfen geçerli bir video dosyası seçin.');
      return;
    }
    
    // Dosya boyutu kontrolü
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setIsError(true);
      setErrorText(`Dosya çok büyük. En fazla ${maxSizeMB}MB yükleyebilirsiniz.`);
      return;
    }
    
    // Yükleme işlemi için hazırlık
    setIsLoading(true);
    
    try {
      // Önizleme URL'si oluştur
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setFileType(isVideo ? 'video' : 'image');
      
      // FormData oluştur
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      
      console.log('Dosya yükleniyor:', file.name, 'klasör:', folder);
      
      // API'ye yükle
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });
      
      // Yanıtı önce text olarak al
      const responseText = await response.text();
      console.log('API yanıt (raw):', responseText);
      
      // JSON'a çevirmeyi dene
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error('JSON ayrıştırma hatası:', error);
        throw new Error(`Geçersiz API yanıtı: ${responseText}`);
      }
      
      // API yanıt formatını kontrol et
      if (!response.ok || !result.success) {
        const errorMessage = result.message || 'Dosya yüklenirken bir hata oluştu';
        console.error('Yükleme hatası (API):', { 
          status: response.status,
          statusText: response.statusText,
          result
        });
        throw new Error(errorMessage);
      }
      
      // URL kontrolü
      if (!result.url) {
        console.error('URL bilgisi eksik (API):', result);
        throw new Error('Dosya yüklendi ancak URL bilgisi alınamadı');
      }
      
      // Dosya bilgileri
      const fileName = result.fileName || '';
      const fileUrl = result.url;
      const fileTypeFromResponse = result.fileType || (isVideo ? 'video' : 'image');
      
      console.log('Dosya başarıyla yüklendi:', {
        url: fileUrl,
        fileId: fileName,
        fileType: fileTypeFromResponse
      });
      
      // Başarılı yükleme - handler'ı çağır
      onUpload({
        url: fileUrl,
        fileId: fileName,
        fileType: fileTypeFromResponse
      });
      
      // Önizleme URL'sini güncelle
      setPreviewUrl(fileUrl);
    } catch (error) {
      console.error('Yükleme hatası:', error);
      setIsError(true);
      setErrorText(error instanceof Error ? error.message : 'Dosya yüklenirken bir hata oluştu');
      // Hata durumunda önizlemeyi temizle
      setPreviewUrl('');
      
      // Tarayıcı konsoluna daha detaylı hata mesajı
      if (error instanceof Error) {
        console.error('Detaylı hata:', {
          message: error.message,
          stack: error.stack,
          cause: error.cause
        });
      }
    } finally {
      setIsLoading(false);
      // Dosya inputunu temizle
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Dosya sürükle-bırak işlemi
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        
        // Değişikliği tetiklemek için change olayını manuel olarak tetikle
        const changeEvent = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(changeEvent);
      }
    }
  }, []);
  
  // Önizlemeyi temizle
  const clearPreview = () => {
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUpload({ url: '', fileId: '', fileType: '' });
  };
  
  return (
    <div className={`w-full ${className}`}>
      {/* Medya yükleme alanı */}
      {!previewUrl ? (
        <div
          className={`border-2 border-dashed ${isError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100 transition-all`}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm text-gray-500">Yükleniyor, lütfen bekleyin...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center py-4">
                <FaCloudUploadAlt className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-1">{label}</p>
                <p className="text-xs text-gray-400">Sürükle bırak veya dosya seç</p>
                {isError && <p className="text-red-500 text-xs mt-2">{errorText}</p>}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptedFileTypes()}
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
        </div>
      ) : (
        // Önizleme alanı
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={clearPreview}
              className="bg-gray-800 bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-colors"
              title="Temizle"
            >
              <FaTimesCircle className="w-5 h-5" />
            </button>
          </div>
          
          {fileType === 'image' ? (
            <ImageKitImage
              src={previewUrl}
              alt="Önizleme"
              width={300}
              height={200}
              className="w-full object-cover"
            />
          ) : (
            <ImageKitVideo
              src={previewUrl}
              controls
              width={300}
              height={200}
              className="w-full"
            />
          )}
          
          {/* Dosya türü göstergesi */}
          <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-50 text-white rounded-full p-1 flex items-center">
            {fileType === 'image' ? (
              <FaImage className="w-4 h-4 mr-1" />
            ) : (
              <FaVideo className="w-4 h-4 mr-1" />
            )}
            <span className="text-xs">{fileType === 'image' ? 'Görsel' : 'Video'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaUploader; 