'use client';

import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaUpload } from 'react-icons/fa';
import Link from 'next/link';
import AdminLayout from '@/app/components/AdminLayout';
import Image from 'next/image';

interface AdminRoomEditPageProps {
  params: Promise<{
    lang: string;
    id: string;
  }>;
}

export default function AdminRoomEditPage({ params }: AdminRoomEditPageProps) {
  const resolvedParams = React.use(params);
  const { lang, id } = resolvedParams;
  
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nameTR: '',
    nameEN: '',
    descriptionTR: '',
    descriptionEN: '',
    priceTR: '',
    priceEN: '',
    capacity: 2,
    size: 25,
    featuresTR: [],
    featuresEN: [],
    type: 'standard',
    mainImageUrl: '',
    orderNumber: 0
  });

  // Mevcut oda verilerini yükle
  useEffect(() => {
    const loadRoomData = async () => {
      if (id === 'new') {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admin/rooms/${id}`);
        if (!response.ok) throw new Error('Oda verileri alınamadı');

        const data = await response.json();
        if (data.success && data.data) {
          setFormData({
            nameTR: data.data.nameTR || '',
            nameEN: data.data.nameEN || '',
            descriptionTR: data.data.descriptionTR || '',
            descriptionEN: data.data.descriptionEN || '',
            priceTR: data.data.priceTR || '',
            priceEN: data.data.priceEN || '',
            capacity: data.data.capacity || 2,
            size: data.data.size || 25,
            featuresTR: data.data.featuresTR || [],
            featuresEN: data.data.featuresEN || [],
            type: data.data.type || 'standard',
            mainImageUrl: data.data.mainImageUrl || data.data.image || '',
            orderNumber: data.data.orderNumber || data.data.order || 0
          });
        }
      } catch (error) {
        console.error('Oda verileri yüklenirken hata:', error);
        alert(lang === 'tr' ? 'Oda verileri yüklenirken hata oluştu' : 'Error loading room data');
      } finally {
        setLoading(false);
      }
    };

    loadRoomData();
  }, [id, lang]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiUrl = id === 'new' 
        ? `/api/admin/rooms`
        : `/api/admin/rooms/${id}`;

      const response = await fetch(apiUrl, {
        method: id === 'new' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          active: true
        })
      });

      if (!response.ok) {
        throw new Error(lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred');
      }

      const result = await response.json();
      
      if (result.success) {
        alert(lang === 'tr' ? 'Oda başarıyla kaydedildi' : 'Room saved successfully');
        window.location.href = `/${lang}/admin/rooms`;
      } else {
        throw new Error(result.message || (lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred'));
      }
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      alert(error.message || (lang === 'tr' ? 'Bir hata oluştu' : 'An error occurred'));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-gray-600">
            {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {id === 'new' 
              ? (lang === 'tr' ? 'Yeni Oda Ekle' : 'Add New Room')
              : (lang === 'tr' ? 'Odayı Düzenle' : 'Edit Room')}
          </h1>
          <Link
            href={`/${lang}/admin/rooms`}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <FaArrowLeft className="mr-2" />
            {lang === 'tr' ? 'Geri Dön' : 'Go Back'}
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          {/* Ana Görsel */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {lang === 'tr' ? 'Ana Görsel' : 'Main Image'}
            </label>
            {formData.mainImageUrl && (
              <div className="relative w-full h-48 mb-4">
                <Image
                  src={formData.mainImageUrl}
                  alt="Room preview"
                  fill
                  className="object-cover rounded"
                />
              </div>
            )}
            <input
              type="text"
              name="mainImageUrl"
              value={formData.mainImageUrl}
              onChange={handleInputChange}
              placeholder={lang === 'tr' ? 'Görsel URL' : 'Image URL'}
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Oda Adı */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'tr' ? 'Oda Adı (TR)' : 'Room Name (TR)'}
              </label>
              <input
                type="text"
                name="nameTR"
                value={formData.nameTR}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'tr' ? 'Oda Adı (EN)' : 'Room Name (EN)'}
              </label>
              <input
                type="text"
                name="nameEN"
                value={formData.nameEN}
                onChange={handleInputChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Açıklama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'tr' ? 'Açıklama (TR)' : 'Description (TR)'}
              </label>
              <textarea
                name="descriptionTR"
                value={formData.descriptionTR}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'tr' ? 'Açıklama (EN)' : 'Description (EN)'}
              </label>
              <textarea
                name="descriptionEN"
                value={formData.descriptionEN}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Fiyat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'tr' ? 'Fiyat (TR)' : 'Price (TR)'}
              </label>
              <input
                type="text"
                name="priceTR"
                value={formData.priceTR}
                onChange={handleInputChange}
                placeholder="₺0"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'tr' ? 'Fiyat (EN)' : 'Price (EN)'}
              </label>
              <input
                type="text"
                name="priceEN"
                value={formData.priceEN}
                onChange={handleInputChange}
                placeholder="€0"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Kapasite ve Boyut */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'tr' ? 'Kapasite' : 'Capacity'}
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'tr' ? 'Boyut (m²)' : 'Size (m²)'}
              </label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          {/* Oda Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {lang === 'tr' ? 'Oda Tipi' : 'Room Type'}
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="standard">{lang === 'tr' ? 'Standart' : 'Standard'}</option>
              <option value="suite">{lang === 'tr' ? 'Suit' : 'Suite'}</option>
              <option value="deluxe">{lang === 'tr' ? 'Delüks' : 'Deluxe'}</option>
            </select>
          </div>

          {/* Kaydet Butonu */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {lang === 'tr' ? 'Kaydet' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
} 