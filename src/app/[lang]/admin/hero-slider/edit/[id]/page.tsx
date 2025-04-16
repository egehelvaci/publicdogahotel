'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaTrashAlt } from 'react-icons/fa';
import { BiLoader } from 'react-icons/bi';
import AdminHeader from '@/app/components/admin/AdminHeader';
import { getAllSliderData, updateSliderItem, deleteSliderItem, SliderItem } from '@/app/data/admin/sliderData';
import MediaUploader from '@/app/components/admin/MediaUploader';

// Corrected EditSliderPageProps interface
interface EditSliderPageProps {
  params: {
    lang: string;
    id: string;
  };
}

export default function EditSliderPage({ params }: EditSliderPageProps) {
  // Removed unnecessary React.use() call
  // const resolvedParams = React.use(params);
  const lang = params.lang || 'tr'; // Get lang directly from params
  const id = params.id; // Get id directly from params

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<SliderItem>({
    id: '',
    image: '',
    videoUrl: '',
    titleTR: '',
    titleEN: '',
    subtitleTR: '',
    subtitleEN: '',
    descriptionTR: '',
    descriptionEN: '',
    order: 0,
    active: true
  });

  // Slider verisini yükle
  useEffect(() => {
    const fetchSliderItem = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Tüm verileri getir
        const allItems = await getAllSliderData();
        
        // ID'ye göre filtrele
        const item = allItems.find((item) => item.id === id);
        
        if (!item) {
          setError('Slider bulunamadı.');
          return;
        }

        setFormData(item);
      } catch (err: unknown) { // Changed 'any' to 'unknown'
        console.error('Slider verisi alınırken hata:', err);
        let errorMessage = 'Bilinmeyen hata';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(`Hata: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSliderItem();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validasyon
    if (!formData.image && !formData.videoUrl) {
      setError('Lütfen en az bir görsel veya video yükleyin');
      setIsSubmitting(false);
      return;
    }

    if (!formData.titleTR || !formData.titleEN) {
      setError('Lütfen Türkçe ve İngilizce başlık alanlarını doldurun');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await updateSliderItem(formData.id, {
        image: formData.image,
        videoUrl: formData.videoUrl,
        titleTR: formData.titleTR,
        titleEN: formData.titleEN,
        subtitleTR: formData.subtitleTR,
        subtitleEN: formData.subtitleEN,
        descriptionTR: formData.descriptionTR,
        descriptionEN: formData.descriptionEN,
        active: formData.active
      });

      if (result) {
        router.push(`/${lang}/admin/hero-slider`);
      } else {
        setError('Slider öğesi güncellenirken bir hata oluştu.');
      }
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error('Slider güncelleme hatası:', err);
      let errorMessage = 'Bilinmeyen hata';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Hata: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const success = await deleteSliderItem(id);
      
      if (success) {
        router.push(`/${lang}/admin/hero-slider`);
      } else {
        setError('Slider silinirken bir hata oluştu.');
        setShowDeleteConfirm(false);
      }
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error('Silme hatası:', err);
      let errorMessage = 'Bilinmeyen hata';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Hata: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Görsel yükleme işlemi tamamlandığında çağrılacak fonksiyon
  const handleMediaUploaded = (url: string, fileType: string) => {
    if (fileType === 'video') {
      // Video yüklendiyse videoUrl alanını güncelle
      setFormData({
        ...formData,
        videoUrl: url
      });
    } else {
      // Görsel yüklendiyse image alanını güncelle
      setFormData({
        ...formData,
        image: url
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader title="Slider Düzenle" />
        <div className="container mx-auto px-4 py-20 flex justify-center">
          <div className="flex items-center">
            <BiLoader className="animate-spin text-3xl text-blue-600 mr-2" />
            <span>Slider verisi yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader title="Slider Düzenle" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={`/${lang}/admin/hero-slider`}
              className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              <FaArrowLeft className="mr-2" /> Geri Dön
            </Link>
            <h1 className="text-2xl font-bold">Slider Düzenle</h1>
          </div>
          
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <FaTrashAlt className="mr-2" />
            Sil
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {error && (
            <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Görsel</label>
                <MediaUploader 
                  onMediaUploaded={handleMediaUploaded}
                  folder="slider"
                  existingMedia={formData.image}
                  type="image"
                />
                {!formData.image && !formData.videoUrl && (
                  <p className="text-gray-500 text-sm mt-1">Görsel veya video yüklemeniz gereklidir</p>
                )}
              </div>

              <div>
                <label className="block mb-2 font-medium">Video</label>
                <MediaUploader
                  onMediaUploaded={handleMediaUploaded}
                  folder="slider"
                  existingMedia={formData.videoUrl}
                  type="video"
                />
                <p className="text-sm text-gray-500 mt-1">
                  İsteğe bağlı: Arka plan videosu yükleyin (MP4 formatı önerilir)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Başlık (Türkçe)*</label>
                <input
                  type="text"
                  name="titleTR"
                  value={formData.titleTR}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Başlık (İngilizce)*</label>
                <input
                  type="text"
                  name="titleEN"
                  value={formData.titleEN}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Alt Başlık (Türkçe)</label>
                <input
                  type="text"
                  name="subtitleTR"
                  value={formData.subtitleTR}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Alt Başlık (İngilizce)</label>
                <input
                  type="text"
                  name="subtitleEN"
                  value={formData.subtitleEN}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Açıklama (Türkçe)</label>
                <textarea
                  name="descriptionTR"
                  value={formData.descriptionTR}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 font-medium">Açıklama (İngilizce)</label>
                <textarea
                  name="descriptionEN"
                  value={formData.descriptionEN}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                    className="mr-2 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>Aktif (Sitede göster)</span>
                </label>
              </div>

              <div>
                <label className="block mb-2 font-medium">Sıralama</label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleChange}
                  min={1}
                  className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Düşük sayı olan öğeler önce gösterilir (1, 2, 3 vb.)
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <Link
                href={`/${lang}/admin/hero-slider`}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-4 hover:bg-gray-300"
              >
                İptal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <BiLoader className="animate-spin mr-2" />
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Silme Onay Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Slider'ı Sil</h3> {/* Replaced ' with ' */}
            <p className="mb-6">Bu slider'ı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p> {/* Replaced ' with ' */}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md mr-4 hover:bg-gray-300"
                disabled={isDeleting}
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                {isDeleting ? (
                  <>
                    <BiLoader className="animate-spin mr-2" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <FaTrashAlt className="mr-2" />
                    Sil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
