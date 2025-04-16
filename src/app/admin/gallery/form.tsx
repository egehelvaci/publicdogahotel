"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FaUpload, FaSave, FaYoutube } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { GalleryItem, extractYoutubeId } from '@/app/data/gallery';

interface GalleryFormProps {
  initialData?: GalleryItem;
  isEditing?: boolean;
}

export default function GalleryForm({ initialData, isEditing = false }: GalleryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    titleTR: '',
    titleEN: '',
    descriptionTR: '',
    descriptionEN: '',
    image: '',
    category: 'genel',
    active: true,
    youtubeUrl: '',
    type: 'image' as 'image' | 'video',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        titleTR: initialData.titleTR || '',
        titleEN: initialData.titleEN || '',
        descriptionTR: initialData.descriptionTR || '',
        descriptionEN: initialData.descriptionEN || '',
        image: initialData.image || '',
        category: initialData.category || 'genel',
        active: initialData.active ?? true,
        youtubeUrl: initialData.youtubeId ? `https://www.youtube.com/watch?v=${initialData.youtubeId}` : '',
        type: initialData.type || 'image',
      });
      setImagePreview(initialData.image || null);
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Görsel önizleme
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Gerçek uygulamada burada dosya yükleme API'si çağrılır
    // Şimdilik sahte bir URL kullanıyoruz
    setFormData(prev => ({ ...prev, image: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!formData.titleTR || (!formData.image && !formData.youtubeUrl)) {
      toast.error('Lütfen gerekli alanları doldurun (Başlık ve Görsel/YouTube Video)');
      return;
    }

    setLoading(true);

    try {
      // YouTube URL'sinden ID'yi çıkar
      const youtubeId = formData.youtubeUrl ? extractYoutubeId(formData.youtubeUrl) : null;
      
      // Eğer YouTube URL'si girilmişse ve geçerliyse type'ı video olarak ayarla
      setFormData({
        ...formData,
        youtubeId: youtubeId,
        type: youtubeId ? 'video' : 'image'
      });
      
      // API isteği gelecekte eklenecek
      // Şimdilik başarılı olduğunu varsayalım
      
      toast.success(isEditing ? 'Galeri öğesi güncellendi' : 'Galeri öğesi eklendi');
      router.push('/admin/gallery');
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Başlık (TR) *</label>
            <input
              type="text"
              name="titleTR"
              value={formData.titleTR}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Başlık (EN)</label>
            <input
              type="text"
              name="titleEN"
              value={formData.titleEN}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Açıklama (TR)</label>
            <textarea
              name="descriptionTR"
              value={formData.descriptionTR}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Açıklama (EN)</label>
            <textarea
              name="descriptionEN"
              value={formData.descriptionEN}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Kategori</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="genel">Genel</option>
              <option value="otel">Otel</option>
              <option value="odalar">Odalar</option>
              <option value="restoran">Restoran</option>
              <option value="spa">Spa</option>
              <option value="havuz">Havuz</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Medya Tipi</label>
            <div className="mt-1 flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="image"
                  checked={formData.type === 'image'}
                  onChange={() => setFormData(prev => ({ ...prev, type: 'image' }))}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Resim</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="video"
                  checked={formData.type === 'video'}
                  onChange={() => setFormData(prev => ({ ...prev, type: 'video' }))}
                  className="h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Video</span>
              </label>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleCheckboxChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Aktif</label>
          </div>
        </div>
        
        <div className="space-y-4">
          {formData.type === 'image' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Görsel *</label>
                <div className="mt-1 flex items-center space-x-4">
                  <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                    <FaUpload className="mr-2" />
                    Görsel Seç
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                  {formData.image && (
                    <span className="text-sm text-gray-500">Görsel seçildi</span>
                  )}
                </div>
              </div>
              
              {imagePreview && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Önizleme</label>
                  <div className="relative h-64 w-full border border-gray-300 rounded-md overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Önizleme"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">YouTube Video Linki *</label>
              <div className="mt-1 flex items-center">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaYoutube className="text-red-500" />
                  </div>
                  <input
                    type="text"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleChange}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>
              {formData.youtubeUrl && extractYoutubeId(formData.youtubeUrl) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video Önizleme</label>
                  <div className="relative h-64 w-full border border-gray-300 rounded-md overflow-hidden">
                    <Image
                      src={`https://img.youtube.com/vi/${extractYoutubeId(formData.youtubeUrl)}/hqdefault.jpg`}
                      alt="YouTube Önizleme"
                      fill
                      className="object-contain"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-12 flex items-center justify-center bg-red-600 rounded-lg opacity-90">
                        <FaYoutube className="text-white text-2xl" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/admin/gallery')}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          İptal
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
          ) : (
            <FaSave className="mr-2" />
          )}
          {isEditing ? 'Güncelle' : 'Kaydet'}
        </button>
      </div>
    </form>
  );
} 