'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaPlus, FaPencilAlt, FaTrash, FaEye, FaEyeSlash, FaArrowUp, FaArrowDown, FaImage } from 'react-icons/fa';
import { ServiceItem, getAllServicesData, toggleServiceVisibility, deleteServiceItem, reorderServiceItems } from '../../../data/admin/servicesData';
import AdminNavbar from '../../../components/AdminNavbar';

type PageProps = {
  params: {
    lang: string;
  };
};

export default function ServicesAdminPage({ params }: PageProps) {
  // Next.js 15'te params artık Promise olduğu için React.use() ile unwrap ediyoruz
  const resolvedParams = React.use(params);
  const lang = resolvedParams.lang;
  
  const router = useRouter();

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sayfa yüklendiğinde servisleri getir
  const fetchServices = async () => {
    try {
      setLoading(true);
      
      // Önbelleği tamamen atlamak için API'yi doğrudan çağır
      const baseUrl = window.location.origin;
      const timestamp = Date.now(); // Cache'i atlamak için rastgele zaman damgası
      
      const response = await fetch(`${baseUrl}/api/admin/services?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Servisler getirilemedi');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Servis sırasına göre sırala
        const sortedServices = data.items.sort((a: ServiceItem, b: ServiceItem) => a.order - b.order);
        setServices(sortedServices);
      } else {
        throw new Error(data.message || 'Servisler getirilemedi');
      }
    } catch (error) {
      console.error('Servis getirme hatası:', error);
      setMessage({
        text: 'Servisler yüklenirken bir hata oluştu.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    
    // Sayfa görünür olduğunda verileri yenile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServices();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Periyodik olarak taze veri al - localStorage kullanımı yerine düzenli olarak API çağrısı yap
    const intervalId = setInterval(fetchServices, 15000); // 15 saniyede bir
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, []);

  // Servis görünürlüğünü değiştir
  const handleToggleVisibility = async (id: string) => {
    try {
      const success = await toggleServiceVisibility(id);
      
      if (success) {
        // Durumu güncelle
        setServices(prevServices => prevServices.map(service => 
          service.id === id 
            ? { ...service, active: !service.active }
            : service
        ));
      } else {
        setError('Görünürlük değiştirilirken bir hata oluştu');
      }
    } catch (err: any) {
      setError(`Görünürlük değiştirilirken hata: ${err.message}`);
      console.error('Görünürlük değiştirme hatası:', err);
    }
  };

  // Silme işlemi
  const handleDelete = async (id: string) => {
    try {
      const success = await deleteServiceItem(id);
      
      if (success) {
        // Servisi listeden kaldır
        setServices(prevServices => prevServices.filter(service => service.id !== id));
        setConfirmDelete(null);
      } else {
        setError('Servis silinirken bir hata oluştu');
      }
    } catch (err: any) {
      setError(`Servis silinirken hata: ${err.message}`);
      console.error('Servis silme hatası:', err);
    }
  };

  // Servisleri sırala (yukarı/aşağı)
  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const serviceIndex = services.findIndex(s => s.id === id);
    if (serviceIndex === -1) return;
    
    // İlk eleman yukarı çıkamaz, son eleman aşağı inemez
    if (
      (direction === 'up' && serviceIndex === 0) || 
      (direction === 'down' && serviceIndex === services.length - 1)
    ) {
      return;
    }
    
    const newServices = [...services];
    const targetIndex = direction === 'up' ? serviceIndex - 1 : serviceIndex + 1;
    
    // Sıraları değiştir
    const temp = newServices[serviceIndex].order;
    newServices[serviceIndex].order = newServices[targetIndex].order;
    newServices[targetIndex].order = temp;
    
    // Yer değiştir
    [newServices[serviceIndex], newServices[targetIndex]] = [newServices[targetIndex], newServices[serviceIndex]];
    
    // State'i güncelle
    setServices(newServices);
    
    // API'ye gönder
    const orderUpdates = newServices.map(service => ({
      id: service.id,
      order: service.order
    }));
    
    try {
      await reorderServiceItems(orderUpdates);
    } catch (err: any) {
      setError(`Sıralama güncellenirken hata: ${err.message}`);
      console.error('Sıralama güncelleme hatası:', err);
    }
  };

  // Yeni servis ekleme sayfasına git
  const handleAddService = () => {
    router.push(`/${lang}/admin/services/add`);
  };

  // Servis düzenleme sayfasına git
  const handleEditService = (id: string) => {
    router.push(`/${lang}/admin/services/edit/${id}`);
  };

  // Servis galeri sayfasına git
  const handleManageGallery = (id: string) => {
    router.push(`/${lang}/admin/services/gallery/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNavbar lang={lang} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {lang === 'tr' ? 'Hizmet Yönetimi' : 'Services Management'}
            </h1>
            
            <button
              onClick={handleAddService}
              className="px-4 py-2 bg-teal-600 text-white rounded-md shadow-sm hover:bg-teal-700 flex items-center gap-2"
            >
              <FaPlus />
              {lang === 'tr' ? 'Yeni Hizmet Ekle' : 'Add New Service'}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {lang === 'tr' ? 'Sıra' : 'Order'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {lang === 'tr' ? 'Görsel' : 'Image'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {lang === 'tr' ? 'Başlık' : 'Title'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {lang === 'tr' ? 'Durum' : 'Status'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {lang === 'tr' ? 'İşlemler' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{service.order}</span>
                          <div className="ml-2 flex flex-col">
                            <button 
                              onClick={() => handleReorder(service.id, 'up')}
                              className="text-gray-500 hover:text-gray-700"
                              disabled={services.indexOf(service) === 0}
                            >
                              <FaArrowUp className={services.indexOf(service) === 0 ? "text-gray-300" : ""} />
                            </button>
                            <button 
                              onClick={() => handleReorder(service.id, 'down')}
                              className="text-gray-500 hover:text-gray-700 mt-1"
                              disabled={services.indexOf(service) === services.length - 1}
                            >
                              <FaArrowDown className={services.indexOf(service) === services.length - 1 ? "text-gray-300" : ""} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                          {service.image ? (
                            <img 
                              src={service.image} 
                              alt={service.titleTR} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <span className="text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {service.titleTR}
                        </div>
                        <div className="text-sm text-gray-500">
                          {service.titleEN}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          service.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {service.active 
                            ? (lang === 'tr' ? 'Aktif' : 'Active') 
                            : (lang === 'tr' ? 'Pasif' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleManageGallery(service.id)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-2 rounded-md"
                          title={lang === 'tr' ? 'Görselleri Yönet' : 'Manage Images'}
                        >
                          <FaImage />
                        </button>
                        <button
                          onClick={() => handleToggleVisibility(service.id)}
                          className={`${
                            service.active 
                              ? 'text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100' 
                              : 'text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100'
                          } p-2 rounded-md`}
                          title={service.active 
                            ? (lang === 'tr' ? 'Devre Dışı Bırak' : 'Disable') 
                            : (lang === 'tr' ? 'Etkinleştir' : 'Enable')}
                        >
                          {service.active ? <FaEyeSlash /> : <FaEye />}
                        </button>
                        <button
                          onClick={() => handleEditService(service.id)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 p-2 rounded-md"
                          title={lang === 'tr' ? 'Düzenle' : 'Edit'}
                        >
                          <FaPencilAlt />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(service.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-2 rounded-md"
                          title={lang === 'tr' ? 'Sil' : 'Delete'}
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {services.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        {lang === 'tr' ? 'Henüz hizmet bulunmuyor.' : 'No services found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      
      {/* Silme Onay Modalı */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {lang === 'tr' ? 'Hizmeti Sil' : 'Delete Service'}
            </h3>
            <p className="text-gray-500 mb-4">
              {lang === 'tr' 
                ? 'Bu hizmeti silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.' 
                : 'Are you sure you want to delete this service? This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                {lang === 'tr' ? 'İptal' : 'Cancel'}
              </button>
              <button
                onClick={() => confirmDelete && handleDelete(confirmDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {lang === 'tr' ? 'Evet, Sil' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 