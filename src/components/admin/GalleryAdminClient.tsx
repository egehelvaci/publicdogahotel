import Image from 'next/image';

const fetchGalleryItems = async () => {
  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      console.log(`Galeri öğeleri yükleniyor... (Deneme ${retryCount + 1}/${MAX_RETRIES})`);
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/gallery', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Hatası: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'API yanıtı başarısız');
      }

      if (!Array.isArray(data.items)) {
        throw new Error('Geçersiz veri formatı: items bir dizi değil');
      }

      // Verileri işle ve sırala
      const processedItems = data.items
        .filter(item => item && typeof item === 'object')
        .map(item => ({
          ...item,
          orderNumber: Number(item.orderNumber) || 0
        }))
        .sort((a, b) => a.orderNumber - b.orderNumber);

      setGalleryItems(processedItems);
      console.log('Galeri öğeleri başarıyla yüklendi:', processedItems.length);
      return; // Başarılı olduğunda fonksiyondan çık
    } catch (error) {
      console.error(`Galeri öğeleri yüklenirken hata (Deneme ${retryCount + 1}):`, error);
      
      if (retryCount === MAX_RETRIES - 1) {
        setError(error instanceof Error ? error.message : 'Galeri öğeleri yüklenirken bir hata oluştu');
      } else {
        // Yeniden denemeden önce bekle
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      }
    } finally {
      setLoading(false);
    }
    
    retryCount++;
  }
};

const ImagePreview = ({ src, alt }: { src: string; alt: string }) => (
  <div className="relative w-full h-48 overflow-hidden rounded-lg">
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority
    />
  </div>
); 