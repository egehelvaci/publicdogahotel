'use client';

import React, { useState, useEffect, useCallback } from 'react';
// Removed unused import: import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Removed unused import: import Image from 'next/image';
import { FaEdit, FaTrashAlt, FaEye, FaPlus, FaGripVertical, FaArrowUp, FaArrowDown } from 'react-icons/fa'; // Removed unused FaCheck, FaTimes
import { BiLoader } from 'react-icons/bi';
import AdminHeader from '@/app/components/admin/AdminHeader';
import { getAllSliderData, deleteSliderItem, reorderSliderItems, SliderItem } from '@/app/data/admin/sliderData';

interface HeroSliderPageProps {
  params: {
    lang: string;
  };
}

// Corrected HeroSliderPageProps interface
export default function HeroSliderPage({ params }: HeroSliderPageProps) {
  // Removed unnecessary React.use() call
  // const resolvedParams = React.use(params);
  const lang = params.lang || 'tr'; // Get lang directly from params

  // Removed unused variable: const router = useRouter();
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Sürükle-bırak için yeni state'ler
  const [draggedItem, setDraggedItem] = useState<SliderItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Slider öğelerini yükle
  const fetchSliderItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Hero Slider admin sayfası: veri yükleniyor');
      const timestamp = new Date().getTime(); // Önbellek sorunlarını önlemek için timestamp
      const data = await getAllSliderData();
      
      console.log('Yüklenen slider öğeleri:', data.length);
      setSliderItems(data);
    } catch (err: unknown) { // Changed 'any' to 'unknown'
      console.error('Slider öğeleri yüklenirken hata:', err);
      let errorMessage = 'Bilinmeyen hata';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(`Slider öğeleri yüklenirken bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setInitialLoad(false);
    }
  }, []);

  // Verileri yenileme fonksiyonu
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    fetchSliderItems();
  }, [fetchSliderItems, refreshTrigger]);

  // Slider öğesi silme
  const handleDelete = async () => {
    if (!selectedItemId) return;
    
    try {
      await deleteSliderItem(selectedItemId);
      
      // Veriyi güncelle
      setSliderItems(sliderItems.filter(item => item.id !== selectedItemId));
      setIsDeleteModalOpen(false);
      setSelectedItemId(null);
      
      // Silinme sonrası yenile
      setTimeout(() => {
        fetchSliderItems();
      }, 500);
    } catch (err) {
      console.error('Silme hatası:', err);
    }
  };

  // Sürükle-bırak işlemleri
  const handleDragStart = (item: SliderItem) => {
    setDraggedItem(item);
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = sliderItems.findIndex(item => item.id === draggedItem.id);
    if (draggedIndex === dropIndex) return;

    // Öğeleri yeniden sırala
    const updatedItems = [...sliderItems];
    const [removed] = updatedItems.splice(draggedIndex, 1);
    updatedItems.splice(dropIndex, 0, removed);
    
    // Order değerlerini güncelle
    const itemsWithNewOrder = updatedItems.map((item, index) => ({
      ...item,
      order: index
    }));
    
    setSliderItems(itemsWithNewOrder);
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
    
    try {
      // API'ye sıralama güncellemesi gönder
      const orderData = itemsWithNewOrder.map((item, index) => ({
        id: item.id,
        order: index
      }));
      
      await reorderSliderItems(orderData);
      console.log('Sıralama güncellendi');
    } catch (err) {
      console.error('Sıralama güncellenirken hata:', err);
      // Hata durumunda orijinal sıralamaya dön
      fetchSliderItems();
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // Yukarı taşı butonu işleyicisi
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return; // Zaten en üstte

    const updatedItems = [...sliderItems];
    // Öğeleri değiştir
    [updatedItems[index], updatedItems[index - 1]] = [updatedItems[index - 1], updatedItems[index]];
    
    // Order değerlerini güncelle
    const itemsWithNewOrder = updatedItems.map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    setSliderItems(itemsWithNewOrder);
    
    try {
      // API'ye sıralama güncellemesi gönder
      const orderData = itemsWithNewOrder.map((item, idx) => ({
        id: item.id,
        order: idx
      }));
      
      await reorderSliderItems(orderData);
      console.log('Sıralama güncellendi');
    } catch (err) {
      console.error('Sıralama güncellenirken hata:', err);
      // Hata durumunda orijinal sıralamaya dön
      fetchSliderItems();
    }
  };

  // Aşağı taşı butonu işleyicisi
  const handleMoveDown = async (index: number) => {
    if (index >= sliderItems.length - 1) return; // Zaten en altta

    const updatedItems = [...sliderItems];
    // Öğeleri değiştir
    [updatedItems[index], updatedItems[index + 1]] = [updatedItems[index + 1], updatedItems[index]];
    
    // Order değerlerini güncelle
    const itemsWithNewOrder = updatedItems.map((item, idx) => ({
      ...item,
      order: idx
    }));
    
    setSliderItems(itemsWithNewOrder);
    
    try {
      // API'ye sıralama güncellemesi gönder
      const orderData = itemsWithNewOrder.map((item, idx) => ({
        id: item.id,
        order: idx
      }));
      
      await reorderSliderItems(orderData);
      console.log('Sıralama güncellendi');
    } catch (err) {
      console.error('Sıralama güncellenirken hata:', err);
      // Hata durumunda orijinal sıralamaya dön
      fetchSliderItems();
    }
  };

  // Aktif/pasif durumunun değiştirilmesi için bir fonksiyon eklenebilir
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader title="Hero Slider Yönetimi" />
      
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Slider Öğeleri</h2>
            
            <Link 
              href={`/${lang}/admin/hero-slider/add`}
              className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              <FaPlus className="mr-2" /> Yeni Ekle
            </Link>
          </div>
          
          {isLoading && initialLoad ? (
            <div className="flex justify-center items-center py-20">
              <BiLoader className="animate-spin text-3xl text-blue-600 mr-2" />
              <span>Slider öğeleri yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-md">
              <p>{error}</p>
              <button 
                onClick={fetchSliderItems}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Tekrar Dene
              </button>
            </div>
          ) : sliderItems.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">Henüz slider öğesi bulunmuyor.</p>
              <Link 
                href={`/${lang}/admin/hero-slider/add`}
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                <FaPlus className="mr-2" /> İlk Slider'ı Ekle
              </Link>
            </div>
          ) : (
            // DragDropContext ve Droppable yerine normal div kullanıyoruz
            <div className="space-y-4">
              {sliderItems.map((item, index) => {
                // Her item için drag durumu
                const isDraggedItem = draggedItem?.id === item.id;
                const isDragOver = dragOverIndex === index;
                
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`bg-white border rounded-lg overflow-hidden shadow-sm transition-shadow ${
                      isDraggedItem ? 'opacity-50' : ''
                    } ${isDragOver ? 'border-2 border-dashed border-blue-500' : ''}
                    ${!item.active ? 'opacity-60' : ''}`}
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Görsel */}
                      <div className="relative w-full md:w-1/4 h-48 bg-gray-100">
                        {/* Video varsa video önizlemesi göster */}
                        {item.videoUrl ? (
                          <div className="relative w-full h-full">
                            <video 
                              src={item.videoUrl}
                              className="w-full h-full object-cover"
                              preload="metadata"
                              muted
                              playsInline
                              onLoadedData={(e) => {
                                const video = e.currentTarget;
                                // İlk kareyi göstermek için videoyu 0.1 saniyeye sarıyoruz
                                video.currentTime = 0.1;
                              }}
                            />
                            <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                              <div className="bg-black/50 rounded-full p-3">
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-6 w-6 text-white" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
                                  />
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : item.image ? (
                          /* Video yoksa ve resim varsa resmi göster */
                          <img
                            src={item.image}
                            alt={item.titleTR}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          /* Ne video ne de resim yoksa boş çerçeve göster */
                          <div className="flex items-center justify-center w-full h-full bg-gray-200">
                            <span className="text-gray-400 text-sm">Görsel yok</span>
                          </div>
                        )}
                        
                        {/* Durum göstergesi */}
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${
                          item.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {item.active ? 'Aktif' : 'Pasif'}
                        </div>
                        
                        {/* Video olduğunu belirten etiket */}
                        {item.videoUrl && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full text-xs bg-blue-500 text-white">
                            Video
                          </div>
                        )}
                      </div>
                      
                      {/* İçerik */}
                      <div className="flex-1 p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">{item.titleTR}</h3>
                            <p className="text-sm text-gray-600">{item.titleEN}</p>
                            
                            <div className="mt-2 space-y-1">
                              <p className="text-sm">
                                <span className="font-medium">Alt Başlık (TR): </span>
                                {item.subtitleTR}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Alt Başlık (EN): </span>
                                {item.subtitleEN}
                              </p>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-xs text-gray-500">Açıklama (TR): {item.descriptionTR}</p>
                              <p className="text-xs text-gray-500">Açıklama (EN): {item.descriptionEN}</p>
                            </div>
                          </div>
                          
                          <div className="text-right text-sm text-gray-500">
                            <p>Sıra: {item.order + 1}</p>
                            <p>ID: {item.id.substring(0, 8)}</p>
                          </div>
                        </div>
                        
                        {/* Aksiyon butonları */}
                        <div className="flex justify-between items-center mt-4">
                          <div className="flex items-center">
                            <div
                              className="flex items-center text-gray-500 hover:text-gray-700 cursor-move select-none mr-4"
                            >
                              <FaGripVertical className="mr-1" />
                              <span className="text-xs">Sürükle</span>
                            </div>
                            
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                                className={`p-2 rounded ${index === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                title="Yukarı Taşı"
                              >
                                <FaArrowUp size={14} />
                              </button>
                              <button
                                onClick={() => handleMoveDown(index)}
                                disabled={index === sliderItems.length - 1}
                                className={`p-2 rounded ${index === sliderItems.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                                title="Aşağı Taşı"
                              >
                                <FaArrowDown size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Link 
                              href={`/${lang}`}
                              target="_blank"
                              className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                              title="Görüntüle"
                            >
                              <FaEye />
                            </Link>
                            
                            <Link 
                              href={`/${lang}/admin/hero-slider/edit/${item.id}`}
                              className="p-2 bg-amber-50 text-amber-600 rounded hover:bg-amber-100"
                              title="Düzenle"
                            >
                              <FaEdit />
                            </Link>
                            
                            <button
                              onClick={() => {
                                setSelectedItemId(item.id);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                              title="Sil"
                            >
                              <FaTrashAlt />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {!isLoading && !initialLoad && sliderItems.length > 0 && (
            <div className="mt-4 text-right">
              <button
                onClick={refreshData}
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center ml-auto"
              >
                <BiLoader className={refreshTrigger > 0 ? "animate-spin mr-1" : "mr-1"} />
                Yenile
              </button>
            </div>
          )}
        </div>
      </main>
      
      {/* Silme Onay Modalı */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Slider Öğesini Sil</h3>
            <p className="text-gray-600 mb-6">Bu slider öğesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p> {/* Replaced ' with ' */}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedItemId(null);
                }}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
