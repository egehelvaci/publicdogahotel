/**
 * Galeri görsellerini yüklemek için yardımcı fonksiyonlar
 */

// Kategori yapılandırması
export const galleryCategories = [
  { id: 'all', nameTR: 'Tümü', nameEN: 'All' },
  { id: 'garden', nameTR: 'Bahçe', nameEN: 'Garden' },
  { id: 'pool', nameTR: 'Havuz', nameEN: 'Pool' },
  { id: 'reception', nameTR: 'Resepsiyon', nameEN: 'Reception' },
];

// Sabit görsel listesi - client tarafında kullanılmak üzere
export const staticGalleryImages = [
  // Bahçe görseleri
  { path: '/images/gallery/garden.jpg', category: 'garden' },
  { path: '/images/gallery/garden2.jpg', category: 'garden' },
  { path: '/images/gallery/garden4.jpg', category: 'garden' },
  { path: '/images/gallery/garden6.jpg', category: 'garden' },
  { path: '/images/gallery/garden7.jpg', category: 'garden' },
  { path: '/images/gallery/garden9.jpg', category: 'garden' },
  { path: '/images/gallery/garden10.jpg', category: 'garden' },
  { path: '/images/gallery/garden11.jpg', category: 'garden' },
  { path: '/images/gallery/garden12.jpg', category: 'garden' },
  { path: '/images/gallery/garden13.jpg', category: 'garden' },
  { path: '/images/gallery/garden15.jpg', category: 'garden' },
  { path: '/images/gallery/garden18.jpg', category: 'garden' },
  { path: '/images/gallery/garden20.jpg', category: 'garden' },
  { path: '/images/gallery/garden21.jpg', category: 'garden' },
  
  // Havuz görseleri
  { path: '/images/gallery/pool.jpg', category: 'pool' },
  { path: '/images/gallery/pool2.jpg', category: 'pool' },
  { path: '/images/gallery/pool3.jpg', category: 'pool' },
  { path: '/images/gallery/pool4.jpg', category: 'pool' },
  { path: '/images/gallery/pool5.jpg', category: 'pool' },
  { path: '/images/gallery/pool6.jpg', category: 'pool' },
  { path: '/images/gallery/pool7.jpg', category: 'pool' },
  { path: '/images/gallery/pool8.jpg', category: 'pool' },
  { path: '/images/gallery/pool9.jpg', category: 'pool' },
  
  // Resepsiyon görseleri
  { path: '/images/gallery/resepsiyon.jpg', category: 'reception' },
];

// Define interface for the static image structure
interface StaticGalleryImage {
  path: string;
  category: string;
}

/**
 * Görsel yollarını içeren bir dizi döndürür
 */
export function getImagePaths(): string[] {
  return staticGalleryImages.map(img => img.path);
}

/**
 * Tüm görselleri kategorilerine göre filtreleme (Use StaticGalleryImage type)
 */
export function filterImagesByCategory(images: StaticGalleryImage[], category: string): StaticGalleryImage[] {
  if (category === 'all') return images;
  // Add type for image in filter callback
  return images.filter((image: StaticGalleryImage) => image.category === category);
}

/**
 * İleride server-side olarak dosya sisteminden görselleri yüklemek için
 * bu fonksiyonu fs modülü ile genişletebilirsiniz. (Use StaticGalleryImage type)
 */
export async function loadGalleryImages(): Promise<StaticGalleryImage[]> {
  return staticGalleryImages;
}
