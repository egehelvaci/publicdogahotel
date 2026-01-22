'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FaEdit, 
  FaArrowUp, 
  FaArrowDown,
  FaImages,
  FaArrowLeft
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { 
  getAllRoomsData, 
  RoomItem,
  toggleRoomVisibility,
  reorderRoomItems
} from '../../../data/admin/roomsData';
import useSocketNotifications from './useSocketNotifications';
import AdminLayout from '../../../components/AdminLayout';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface AdminRoomsPageProps {
  params: {
    lang: string;
  };
}

export default function AdminRoomsPage({ params }: AdminRoomsPageProps) {
  // Next.js 15'te params Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;

  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoomItem | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  
  // WebSocket bildirimlerini dinle
  const { needsRefresh, resetRefreshFlag } = useSocketNotifications();

  // Oda verilerini yükle
  const loadRooms = async () => {
    try {
      setIsLoading(true);
      const data = await getAllRoomsData();
      setRoomItems(data);
    } catch (error) {
      console.error('Oda verileri yüklenirken bir hata oluştu:', error);
      toast.error(lang === 'tr' ? 'Veriler yüklenirken bir hata oluştu' : 'Error loading data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Sayfa yüklendiğinde verileri getir
  useEffect(() => {
    loadRooms();
  }, [lang]);
  
  // WebSocket bildirimi geldiğinde verileri yenile
  useEffect(() => {
    if (needsRefresh) {
      console.log('WebSocket bildirimi alındı, veriler yenileniyor...');
      loadRooms();
      resetRefreshFlag();
    }
  }, [needsRefresh]);

  // Oda görünürlüğünü değiştir
  const handleToggleVisibility = async (id: string) => {
    try {
      const success = await toggleRoomVisibility(id);
      
      if (success) {
        // State'i güncelle
        setRoomItems(prev => prev.map(item => 
          item.id === id ? { ...item, active: !item.active } : item
        ));
        
        toast.success(lang === 'tr' ? 'Oda görünürlüğü güncellendi' : 'Room visibility updated');
      } else {
        throw new Error('Görünürlük değiştirilemedi');
      }
    } catch (error) {
      console.error('Görünürlük değiştirilirken hata:', error);
      toast.error(lang === 'tr' ? 'Görünürlük değiştirilirken hata oluştu' : 'Error updating visibility');
    }
  };

  // Sıralamayı değiştir
  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = roomItems.findIndex(item => item.id === id);
    if (currentIndex === -1) return;
    
    const newItems = [...roomItems];
    
    if (direction === 'up' && currentIndex > 0) {
      // Öğeyi bir üste taşı
      [newItems[currentIndex], newItems[currentIndex - 1]] = 
        [newItems[currentIndex - 1], newItems[currentIndex]];
    } else if (direction === 'down' && currentIndex < newItems.length - 1) {
      // Öğeyi bir alta taşı
      [newItems[currentIndex], newItems[currentIndex + 1]] = 
        [newItems[currentIndex + 1], newItems[currentIndex]];
    }
    
    // Yeni sıra numaralarını güncelle
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1
    }));
    
    setRoomItems(reorderedItems);
    
    // Veritabanına kaydet
    const orderData = reorderedItems.map(item => ({
      id: item.id,
      order: item.order
    }));
    
    try {
      const success = await reorderRoomItems(orderData);
      
      if (success) {
        toast.success(lang === 'tr' ? 'Sıralama güncellendi' : 'Order updated');
      } else {
        throw new Error('Sıralama güncellenemedi');
      }
    } catch (error) {
      console.error('Sıralama güncellenirken hata:', error);
      toast.error(lang === 'tr' ? 'Sıralama güncellenirken hata oluştu' : 'Error updating order');
      // Hata durumunda verileri yeniden yükle
      loadRooms();
    }
  };

  // Düzenleme sayfasına yönlendir
  const handleEditRoom = (id: string) => {
    window.location.href = `/${lang}/admin/rooms/edit/${id}`;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center text-xl font-semibold text-gray-700">
          {lang === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {lang === 'tr' ? 'Odalar Yönetimi' : 'Rooms Management'}
            </h1>
            <div className="flex items-center gap-4">
              <Link
                href={`/${lang}/admin`}
                className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md shadow-sm"
              >
                <FaArrowLeft className="mr-2" />
                {lang === 'tr' ? 'Admin Panele Dön' : 'Back to Admin Panel'}
              </Link>
              <div className="text-gray-600 italic text-sm">
                {lang === 'tr' ? 'Mevcut oda türleri düzenlenebilir' : 'Existing room types can be edited'}
              </div>
            </div>
          </div>
          
          {/* Odalar Listesi */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">{lang === 'tr' ? 'Sıra' : 'Order'}</th>
                  <th className="p-2 text-left">{lang === 'tr' ? 'Görsel' : 'Image'}</th>
                  <th className="p-2 text-left">{lang === 'tr' ? 'Oda Adı (TR)' : 'Room Name (TR)'}</th>
                  <th className="p-2 text-left">{lang === 'tr' ? 'Oda Adı (EN)' : 'Room Name (EN)'}</th>
                  <th className="p-2 text-left">{lang === 'tr' ? 'Kapasite' : 'Capacity'}</th>
                  <th className="p-2 text-left">{lang === 'tr' ? 'İşlemler' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {roomItems.map((room, index) => (
                  <motion.tr 
                    key={room.id}
                    className="border-b hover:bg-gray-50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2">
                      <div className="w-20 h-20 relative">
                        <Image
                          src={room.mainImageUrl || room.image}
                          alt={room.nameTR}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    </td>
                    <td className="p-2">{room.nameTR}</td>
                    <td className="p-2">{room.nameEN}</td>
                    <td className="p-2">{room.capacity} {lang === 'tr' ? 'Kişi' : 'People'}</td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/${lang}/admin/rooms/edit/${room.id}`}
                          className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          <FaEdit className="mr-1" />
                          {lang === 'tr' ? 'Düzenle' : 'Edit'}
                        </Link>
                        <Link
                          href={`/${lang}/admin/rooms/gallery/${room.id}`}
                          className="inline-flex items-center px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                        >
                          <FaImages className="mr-1" />
                          {lang === 'tr' ? 'Galeri' : 'Gallery'}
                        </Link>
                        <div className="flex items-center space-x-1">
                          {index > 0 && (
                            <button
                              onClick={() => handleReorder(room.id, 'up')}
                              className="p-1 text-gray-600 hover:text-gray-800"
                              title={lang === 'tr' ? 'Yukarı Taşı' : 'Move Up'}
                            >
                              <FaArrowUp />
                            </button>
                          )}
                          {index < roomItems.length - 1 && (
                            <button
                              onClick={() => handleReorder(room.id, 'down')}
                              className="p-1 text-gray-600 hover:text-gray-800"
                              title={lang === 'tr' ? 'Aşağı Taşı' : 'Move Down'}
                            >
                              <FaArrowDown />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {roomItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">
                      {lang === 'tr' ? 'Henüz hiç oda eklenmemiş.' : 'No rooms added yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 