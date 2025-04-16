'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/app/components/admin/AdminHeader';
import { AboutData } from '@/app/data/about';
import { FaUpload, FaSave, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default function AboutAdminPage({ params }: PageProps) {
  // Next.js 15'te params artık Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;

  const router = useRouter();
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  const heroImageRef = useRef<HTMLInputElement>(null);
  const mainImageRef = useRef<HTMLInputElement>(null);

  // Form durumları
  const [titleTR, setTitleTR] = useState('');
  const [titleEN, setTitleEN] = useState('');
  const [subtitleTR, setSubtitleTR] = useState('');
  const [subtitleEN, setSubtitleEN] = useState('');
  const [contentTR, setContentTR] = useState<string>('');
  const [contentEN, setContentEN] = useState<string>('');
  const [badgesTR, setBadgesTR] = useState<string>('');
  const [badgesEN, setBadgesEN] = useState<string>('');

  // API'den verileri çek
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/about', {
          cache: 'no-store'
        });
        
        if (!response.ok) {
          throw new Error('Veri alınamadı');
        }
        
        const data = await response.json();
        setAboutData(data);
        
        // Form alanlarını doldur
        setTitleTR(data.titleTR);
        setTitleEN(data.titleEN);
        setSubtitleTR(data.subtitleTR);
        setSubtitleEN(data.subtitleEN);
        setContentTR(data.contentTR.join('\n\n'));
        setContentEN(data.contentEN.join('\n\n'));
        setBadgesTR(data.badgesTR.join(', '));
        setBadgesEN(data.badgesEN.join(', '));
        
      } catch (error) {
        console.error('Veri çekme hatası:', error);
        setMessage({
          text: 'Veriler yüklenemedi. Lütfen sayfayı yenileyin.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Resim yükleme işlemi
  const handleImageUpload = async (imageType: 'heroImage' | 'mainImage') => {
    const fileInput = imageType === 'heroImage' ? heroImageRef.current : mainImageRef.current;
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      setMessage({ text: 'Lütfen bir resim seçin.', type: 'error' });
      return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', imageType);
    
    setSaving(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/admin/about/upload', {
        method: 'POST',
        body: formData,
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Resim yüklenemedi');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Başarılı ise state'i güncelle
        if (aboutData) {
          setAboutData({
            ...aboutData,
            [imageType]: result.data.path
          });
        }
        
        setMessage({ text: 'Resim başarıyla yüklendi.', type: 'success' });
        
        // Input alanını temizle
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        throw new Error(result.error || 'Resim yüklenemedi');
      }
    } catch (error: unknown) { // Changed 'any' to 'unknown'
      console.error('Resim yükleme hatası:', error);
      let errorMessage = 'Resim yüklenirken bir hata oluştu.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Metin içeriklerini kaydet
  const handleSaveContent = async () => {
    if (!aboutData) return;
    
    setSaving(true);
    setMessage(null);
    
    try {
      // Metin içeriklerini hazırla
      const updatedData: Partial<AboutData> = {
        titleTR,
        titleEN,
        subtitleTR,
        subtitleEN,
        contentTR: contentTR.split('\n\n').filter(paragraph => paragraph.trim() !== ''),
        contentEN: contentEN.split('\n\n').filter(paragraph => paragraph.trim() !== ''),
        badgesTR: badgesTR.split(',').map(badge => badge.trim()).filter(badge => badge !== ''),
        badgesEN: badgesEN.split(',').map(badge => badge.trim()).filter(badge => badge !== '')
      };
      
      const response = await fetch('/api/admin/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        },
        body: JSON.stringify(updatedData),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Veriler kaydedilemedi');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAboutData(result.data);
        setMessage({ text: 'Değişiklikler başarıyla kaydedildi.', type: 'success' });
      } else {
        throw new Error(result.error || 'Veriler kaydedilemedi');
      }
    } catch (error: unknown) { // Changed 'any' to 'unknown'
      console.error('Kaydetme hatası:', error);
      let errorMessage = 'Veriler kaydedilirken bir hata oluştu.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader title={lang === 'tr' ? 'Hakkımızda Sayfası' : 'About Page'} backUrl={`/${lang}/admin`} />
        <div className="max-w-6xl mx-auto p-4 h-screen flex items-center justify-center">
          <div className="animate-spin text-amber-600">
            <FaSpinner size={40} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader title={lang === 'tr' ? 'Hakkımızda Sayfası' : 'About Page'} backUrl={`/${lang}/admin`} />
      
      <div className="max-w-6xl mx-auto p-4">
        {/* Bilgi/Hata Mesajı */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center">
              {message.type === 'success' ? <FaCheck className="mr-2" /> : <FaExclamationTriangle className="mr-2" />}
              <p>{message.text}</p>
            </div>
          </div>
        )}

        {/* Görsel Yükleme Bölümü */}
        <div className="bg-white shadow-md rounded-lg mb-6 p-6">
          <h2 className="text-xl font-semibold mb-4">{lang === 'tr' ? 'Görseller' : 'Images'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hero Image */}
            <div className="space-y-3">
              <h3 className="font-medium">{lang === 'tr' ? 'Hero Görseli' : 'Hero Image'}</h3>
              
              <div className="bg-gray-100 h-40 rounded-md overflow-hidden relative">
                {aboutData?.heroImage && (
                  <img 
                    src={aboutData.heroImage} 
                    alt="Hero Görsel" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <div className="flex">
                <input 
                  type="file" 
                  ref={heroImageRef}
                  className="hidden" 
                  accept="image/*" 
                  onChange={() => {}} 
                />
                <button
                  type="button"
                  onClick={() => heroImageRef.current?.click()}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2 flex-grow"
                >
                  <FaUpload className="inline-block mr-2" />
                  {lang === 'tr' ? 'Görsel Seç' : 'Select Image'}
                </button>
                <button
                  type="button"
                  onClick={() => handleImageUpload('heroImage')}
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="inline-block animate-spin" /> : 'Yükle'}
                </button>
              </div>
            </div>
            
            {/* Main Image */}
            <div className="space-y-3">
              <h3 className="font-medium">{lang === 'tr' ? 'Ana Görsel' : 'Main Image'}</h3>
              
              <div className="bg-gray-100 h-40 rounded-md overflow-hidden relative">
                {aboutData?.mainImage && (
                  <img 
                    src={aboutData.mainImage} 
                    alt="Ana Görsel" 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <div className="flex">
                <input 
                  type="file" 
                  ref={mainImageRef}
                  className="hidden" 
                  accept="image/*" 
                  onChange={() => {}} 
                />
                <button
                  type="button"
                  onClick={() => mainImageRef.current?.click()}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2 flex-grow"
                >
                  <FaUpload className="inline-block mr-2" />
                  {lang === 'tr' ? 'Görsel Seç' : 'Select Image'}
                </button>
                <button
                  type="button"
                  onClick={() => handleImageUpload('mainImage')}
                  disabled={saving}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {saving ? <FaSpinner className="inline-block animate-spin" /> : 'Yükle'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* İçerik Düzenleme Bölümü */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">{lang === 'tr' ? 'İçerik' : 'Content'}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Başlık (TR) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (TR)</label>
              <input
                type="text"
                value={titleTR}
                onChange={(e) => setTitleTR(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Başlık (EN) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (EN)</label>
              <input
                type="text"
                value={titleEN}
                onChange={(e) => setTitleEN(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Alt Başlık (TR) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık (TR)</label>
              <input
                type="text"
                value={subtitleTR}
                onChange={(e) => setSubtitleTR(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Alt Başlık (EN) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Başlık (EN)</label>
              <input
                type="text"
                value={subtitleEN}
                onChange={(e) => setSubtitleEN(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* İçerik (TR) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İçerik (TR) <span className="text-gray-400 text-xs">(Paragraflar arasında boş satır bırakın)</span>
              </label>
              <textarea
                value={contentTR}
                onChange={(e) => setContentTR(e.target.value)}
                rows={10}
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>
            
            {/* İçerik (EN) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İçerik (EN) <span className="text-gray-400 text-xs">(Leave empty line between paragraphs)</span>
              </label>
              <textarea
                value={contentEN}
                onChange={(e) => setContentEN(e.target.value)}
                rows={10}
                className="w-full p-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Özellikler (TR) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rozetler (TR) <span className="text-gray-400 text-xs">(Virgülle ayırın)</span>
              </label>
              <input
                type="text"
                value={badgesTR}
                onChange={(e) => setBadgesTR(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {/* Özellikler (EN) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rozetler (EN) <span className="text-gray-400 text-xs">(Separate with commas)</span>
              </label>
              <input
                type="text"
                value={badgesEN}
                onChange={(e) => setBadgesEN(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          {/* Kaydet Butonu */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveContent}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <FaSpinner className="inline-block mr-2 animate-spin" />
                  {lang === 'tr' ? 'Kaydediliyor...' : 'Saving...'}
                </>
              ) : (
                <>
                  <FaSave className="inline-block mr-2" />
                  {lang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
