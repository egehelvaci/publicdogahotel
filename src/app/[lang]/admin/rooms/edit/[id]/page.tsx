'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaSave, FaUpload, FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { getRoomById, updateRoomItem } from '../../../../../data/admin/roomsData';

interface AdminEditRoomPageProps {
  params: {
    lang: string;
    id: string;
  };
}

export default function AdminEditRoomPage({ params }: AdminEditRoomPageProps) {
  // Next.js 15'te params Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;
  const id = resolvedParams.id;
  
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [featuresTR, setFeaturesTR] = useState<string[]>(['']);
  const [featuresEN, setFeaturesEN] = useState<string[]>(['']);
  
  const [roomData, setRoomData] = useState({
    nameTR: '',
    nameEN: '',
    descriptionTR: '',
    descriptionEN: '',
    image: '/images/rooms/placeholder.jpg',
    priceTR: '',
    priceEN: '',
    capacity: 2,
    size: 25,
    type: 'standard',
    active: true,
    order: 1,
    gallery: [] as string[]
  });

  // Oda verilerini yükle
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const roomItem = await getRoomById(id);
        
        if (roomItem) {
          setRoomData({
            nameTR: roomItem.nameTR,
            nameEN: roomItem.nameEN,
            descriptionTR: roomItem.descriptionTR,
            descriptionEN: roomItem.descriptionEN,
            image: roomItem.image,
            priceTR: roomItem.priceTR,
            priceEN: roomItem.priceEN,
            capacity: roomItem.capacity,
            size: roomItem.size,
            type: roomItem.type,
            active: roomItem.active,
            order: roomItem.order,
            gallery: roomItem.gallery
          });
          
          setFeaturesTR(roomItem.featuresTR);
          setFeaturesEN(roomItem.featuresEN);
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

  // Form alanı değişikliği
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'capacity' || name === 'size') {
      setRoomData({ ...roomData, [name]: Number(value) });
    } else {
      setRoomData({ ...roomData, [name]: value });
    }
  };

  // Özellik ekle/çıkar/değiştir
  const handleFeatureChange = (index: number, value: string, lang: 'TR' | 'EN') => {
    if (lang === 'TR') {
      const newFeatures = [...featuresTR];
      newFeatures[index] = value;
      setFeaturesTR(newFeatures);
    } else {
      const newFeatures = [...featuresEN];
      newFeatures[index] = value;
      setFeaturesEN(newFeatures);
    }
  };

  const addFeature = (lang: 'TR' | 'EN') => {
    if (lang === 'TR') {
      setFeaturesTR([...featuresTR, '']);
    } else {
      setFeaturesEN([...featuresEN, '']);
    }
  };

  const removeFeature = (index: number, lang: 'TR' | 'EN') => {
    if (lang === 'TR') {
      const newFeatures = [...featuresTR];
      newFeatures.splice(index, 1);
      setFeaturesTR(newFeatures);
    } else {
      const newFeatures = [...featuresEN];
      newFeatures.splice(index, 1);
      setFeaturesEN(newFeatures);
    }
  };

  // Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setRoomData({ ...roomData, image: result.filePath });
        toast.success(lang === 'tr' ? 'Görsel başarıyla yüklendi!' : 'Image uploaded successfully!');
      } else {
        toast.error(result.message || (lang === 'tr' ? 'Görsel yüklenemedi!' : 'Failed to upload image!'));
      }
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      toast.error(lang === 'tr' ? 'Görsel yüklenirken bir hata oluştu!' : 'An error occurred while uploading the image!');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Görsellerin yüklenip yüklenmediğini kontrol eden fonksiyon
  const checkImageValidity = (imagePath: string) => {
    if (!imagePath) return false;
    // /images/ ile başlayan görsellerin varlığını kontrol et
    return true; // Basit kontrol - gerçek kontrol için resmin varlığı test edilmeli
  };

  // Oda güncelle
  const handleSaveRoom = async () => {
    // Form validation
    if (!roomData.nameTR || !roomData.nameEN || !roomData.descriptionTR || !roomData.descriptionEN) {
      toast.error(lang === 'tr' ? 'Lütfen gerekli alanları doldurun.' : 'Please fill in the required fields.');
      return;
    }

    // Boş özellikleri temizle
    const cleanFeaturesTR = featuresTR.filter(f => f.trim() !== '');
    const cleanFeaturesEN = featuresEN.filter(f => f.trim() !== '');

    setIsSaving(true);

    try {
      // Orijinal oda verisini al
      const originalRoom = await getRoomById(id);
      
      // Ana görsel gallery'de değilse ekle
      let updatedGallery = [...roomData.gallery];
      if (!updatedGallery.includes(roomData.image)) {
        updatedGallery = [roomData.image, ...updatedGallery];
      }

      // Oda nesnesini oluştur
      const updatedRoom = {
        ...roomData,
        // Eğer orijinal odadaki fiyatlar varsa, onları koru, yoksa mevcut değerleri kullan
        priceTR: originalRoom?.priceTR || roomData.priceTR,
        priceEN: originalRoom?.priceEN || roomData.priceEN,
        featuresTR: cleanFeaturesTR,
        featuresEN: cleanFeaturesEN,
        gallery: updatedGallery
      };

      // Odayı güncelle
      const result = await updateRoomItem(id, updatedRoom);
      
      if (result) {
        toast.success(lang === 'tr' ? 'Oda başarıyla güncellendi!' : 'Room updated successfully!');
        // Admin odalar sayfasına yönlendir
        router.push(`/${lang}/admin/rooms`);
      } else {
        throw new Error('Oda güncellenemedi');
      }
    } catch (error) {
      console.error('Oda güncelleme hatası:', error);
      toast.error(lang === 'tr' ? 'Oda güncellenirken bir hata oluştu!' : 'An error occurred while updating the room!');
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {lang === 'tr' ? 'Odayı Düzenle' : 'Edit Room'}: {roomData.nameTR}
            </h1>
            <Link
              href={`/${lang}/admin/rooms`}
              className="text-teal-600 hover:text-teal-700 flex items-center"
            >
              <FaArrowLeft className="mr-2" />
              {lang === 'tr' ? 'Odalar Listesine Dön' : 'Back to Rooms List'}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sol Kolon */}
            <div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  {lang === 'tr' ? 'Oda Görseli' : 'Room Image'}
                </label>
                <div className="mb-2 relative w-full h-64 overflow-hidden rounded-lg border border-gray-300">
                  <img
                    src={roomData.image}
                    alt={roomData.nameTR || 'Oda görseli'}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                  >
                    {isUploading ? (
                      <span>{lang === 'tr' ? 'Yükleniyor...' : 'Uploading...'}</span>
                    ) : (
                      <>
                        <FaUpload className="mr-2" />
                        <span>{lang === 'tr' ? 'Görsel Yükle' : 'Upload Image'}</span>
                      </>
                    )}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Link
                    href={`/${lang}/admin/rooms/gallery/${id}`}
                    className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                  >
                    {lang === 'tr' ? 'Galeriyi Düzenle' : 'Edit Gallery'}
                  </Link>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                  {lang === 'tr' ? 'Oda Tipi' : 'Room Type'}
                </label>
                <select
                  id="type"
                  name="type"
                  value={roomData.type}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="standard">{lang === 'tr' ? 'Standart Oda' : 'Standard Room'}</option>
                  <option value="triple">{lang === 'tr' ? 'Üç Kişilik Oda' : 'Triple Room'}</option>
                  <option value="suite">{lang === 'tr' ? 'Süit Oda' : 'Suite Room'}</option>
                  <option value="apart">{lang === 'tr' ? 'Apart Oda' : 'Apart Room'}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="capacity">
                    {lang === 'tr' ? 'Kapasite' : 'Capacity'}
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    name="capacity"
                    min="1"
                    max="10"
                    value={roomData.capacity}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="size">
                    {lang === 'tr' ? 'Boyut (m²)' : 'Size (m²)'}
                  </label>
                  <input
                    id="size"
                    type="number"
                    name="size"
                    min="1"
                    max="200"
                    value={roomData.size}
                    onChange={handleInputChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
            </div>

            {/* Sağ Kolon */}
            <div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameTR">
                  {lang === 'tr' ? 'Oda Adı (TR)' : 'Room Name (TR)'}
                </label>
                <input
                  id="nameTR"
                  type="text"
                  name="nameTR"
                  value={roomData.nameTR}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nameEN">
                  {lang === 'tr' ? 'Oda Adı (EN)' : 'Room Name (EN)'}
                </label>
                <input
                  id="nameEN"
                  type="text"
                  name="nameEN"
                  value={roomData.nameEN}
                  onChange={handleInputChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descriptionTR">
                  {lang === 'tr' ? 'Açıklama (TR)' : 'Description (TR)'}
                </label>
                <textarea
                  id="descriptionTR"
                  name="descriptionTR"
                  value={roomData.descriptionTR}
                  onChange={handleInputChange}
                  rows={3}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descriptionEN">
                  {lang === 'tr' ? 'Açıklama (EN)' : 'Description (EN)'}
                </label>
                <textarea
                  id="descriptionEN"
                  name="descriptionEN"
                  value={roomData.descriptionEN}
                  onChange={handleInputChange}
                  rows={3}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="active">
                  {lang === 'tr' ? 'Durum' : 'Status'}
                </label>
                <div className="flex items-center">
                  <input
                    id="active"
                    type="checkbox"
                    name="active"
                    checked={roomData.active}
                    onChange={(e) => setRoomData({ ...roomData, active: e.target.checked })}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-gray-700">
                    {lang === 'tr' ? 'Aktif' : 'Active'}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Özellikler Bölümü */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Türkçe Özellikler */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold">
                  {lang === 'tr' ? 'Özellikler (TR)' : 'Features (TR)'}
                </label>
                <button
                  type="button"
                  onClick={() => addFeature('TR')}
                  className="text-teal-600 hover:text-teal-700 text-sm"
                >
                  {lang === 'tr' ? '+ Özellik Ekle' : '+ Add Feature'}
                </button>
              </div>
              <div className="space-y-2">
                {featuresTR.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value, 'TR')}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder={lang === 'tr' ? 'Özellik girin' : 'Enter feature'}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index, 'TR')}
                      className="ml-2 text-red-500 hover:text-red-700"
                      title={lang === 'tr' ? 'Kaldır' : 'Remove'}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* İngilizce Özellikler */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 text-sm font-bold">
                  {lang === 'tr' ? 'Özellikler (EN)' : 'Features (EN)'}
                </label>
                <button
                  type="button"
                  onClick={() => addFeature('EN')}
                  className="text-teal-600 hover:text-teal-700 text-sm"
                >
                  {lang === 'tr' ? '+ Özellik Ekle' : '+ Add Feature'}
                </button>
              </div>
              <div className="space-y-2">
                {featuresEN.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value, 'EN')}
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder={lang === 'tr' ? 'Özellik girin' : 'Enter feature'}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index, 'EN')}
                      className="ml-2 text-red-500 hover:text-red-700"
                      title={lang === 'tr' ? 'Kaldır' : 'Remove'}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Galeri Önizleme */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700 text-sm font-bold">
                {lang === 'tr' ? 'Galeri Önizleme' : 'Gallery Preview'}
              </label>
              <Link
                href={`/${lang}/admin/rooms/gallery/${id}`}
                className="text-teal-600 hover:text-teal-700 text-sm"
              >
                {lang === 'tr' ? 'Galeriyi Yönet' : 'Manage Gallery'}
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {roomData.gallery.slice(0, 6).map((image, index) => (
                <div key={index} className="relative aspect-square rounded overflow-hidden border border-gray-200">
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
              {roomData.gallery.length > 6 && (
                <div className="relative aspect-square rounded flex items-center justify-center bg-gray-100 border border-gray-200">
                  <span className="text-gray-500 text-sm">+{roomData.gallery.length - 6} {lang === 'tr' ? 'görsel daha' : 'more'}</span>
                </div>
              )}
              {roomData.gallery.length === 0 && (
                <div className="col-span-full text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 text-sm">
                    {lang === 'tr' ? 'Henüz hiç görsel yok. Galeriye görsel ekleyin.' : 'No images yet. Add images to gallery.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Kaydet Butonu */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSaveRoom}
              disabled={isSaving}
              className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-6 rounded-md flex items-center font-semibold"
            >
              {isSaving ? (
                <span>{lang === 'tr' ? 'Kaydediliyor...' : 'Saving...'}</span>
              ) : (
                <>
                  <FaSave className="mr-2" />
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