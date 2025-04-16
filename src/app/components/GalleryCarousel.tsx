'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { GalleryItem } from '../data/gallery';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Video from 'yet-another-react-lightbox/plugins/video';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { FaExpand, FaArrowLeft, FaArrowRight, FaImage, FaTimes, FaYoutube, FaChevronLeft, FaChevronRight, FaPlay } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

// Gallery item için tipler
interface GalleryItemData {
  id: string;
  image: string;
  videoUrl?: string;  // Video URL'i (isteğe bağlı)
  title?: string;
  description?: string;
  order: number;
  type: 'image' | 'video'; // Öğe türü
  youtubeId?: string;
}

interface GalleryCarouselProps {
  items: GalleryItemData[];
  lang: string;
  autoPlay?: boolean;
  interval?: number;
  dictionary: {
    gallerySubtitle: string;
    galleryTitle: string;
    viewImage: string;
    previous: string;
    next: string;
    close: string;
    // Yeni çeviriler
    watchVideo: string;
    loadingVideo: string;
  };
}

// Video önizleme görüntüsü oluşturmak için yardımcı bileşen
const VideoProcessor = ({ videoUrl, onThumbnailGenerated, itemId }: { videoUrl: string; onThumbnailGenerated: (thumbnailUrl: string, itemId: string, index: number) => void; itemId: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [timePoints, setTimePoints] = useState<number[]>([]);
  const [currentTimePointIndex, setCurrentTimePointIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        try {
          const duration = video.duration;
          if (duration && isFinite(duration) && duration > 0) {
            // Videonun farklı noktalarından daha fazla kare alalım
            const points = [
              0.1,             // Başlangıç (siyah ekran olmasın diye 0.1)
              duration * 0.15, 
              duration * 0.25,
              duration * 0.35,
              duration * 0.5,
              duration * 0.65,
              duration * 0.8,
            ];
            setTimePoints(points);
            
            // İlk noktaya git
            if (points.length > 0) {
              video.currentTime = points[0];
            }
          } else {
            // Süre alınamadıysa fallback
            video.currentTime = 0.5; // 0.5 saniye daha iyi bir kare yakalayabilir
          }
        } catch (error) {
          console.error("Video zaman ayarı yapılırken hata:", error);
          try {
            video.currentTime = 0.5;
          } catch (e) {
            console.error("Fallback time setting failed:", e);
          }
        }
      };

      const handleTimeUpdate = () => {
        try {
          // Video boyutları yoksa birkaç kez deneyelim
          if (!video.videoWidth || !video.videoHeight) {
            if (retryCount < 5) { // Daha fazla deneme yapılsın
              setRetryCount(prev => prev + 1);
              setTimeout(() => {
                if (timePoints.length > 0) {
                  video.currentTime = timePoints[currentTimePointIndex];
                } else {
                  video.currentTime = 0.5;
                }
              }, 300); // Daha kısa süre
            }
            return;
          }

          // Video boyutları geldiğinde, daha yüksek kaliteli bir thumbnail oluştur
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Daha canlı bir görüntü için kontrast ve parlaklık ayarlaması yapabiliriz
            ctx.filter = 'contrast(1.1) brightness(1.05)';
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Daha yüksek kaliteli JPEG (0.95 kalite)
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.95);
            onThumbnailGenerated(thumbnailUrl, itemId, currentTimePointIndex);
            
            // Sonraki noktaya geç
            const nextTimePointIndex = currentTimePointIndex + 1;
            if (nextTimePointIndex < timePoints.length) {
              setCurrentTimePointIndex(nextTimePointIndex);
              video.currentTime = timePoints[nextTimePointIndex];
              setRetryCount(0);
            } else {
              // Tüm noktalar işlendi
              video.removeEventListener('loadedmetadata', handleLoadedMetadata);
              video.removeEventListener('timeupdate', handleTimeUpdate);
            }
          }
        } catch (error) {
          console.error("Thumbnail oluşturulurken hata:", error);
        }
      };

      // Video hatalarını yakala
      const handleError = (e: Event) => {
        console.error("Video işlenirken hata:", e);
        // Hata durumunda işlemeyi tamamlandı olarak işaretle
        onThumbnailGenerated("", itemId, -1);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('error', handleError);
      };
    }
  }, [videoUrl, timePoints, currentTimePointIndex, onThumbnailGenerated, itemId, retryCount]);

  return (
    <video 
      ref={videoRef} 
      src={videoUrl} 
      style={{ display: 'none' }} 
      preload="metadata"
      muted
      playsInline
      crossOrigin="anonymous"
    />
  );
};

export default function GalleryCarousel({ items, lang, autoPlay = true, interval = 5000, dictionary }: GalleryCarouselProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [columns, setColumns] = useState(3);
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'video'>('all');
  const [isMobile, setIsMobile] = useState(false);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);
  const router = useRouter();
  
  // Mobil cihaz kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);
  
  // Filtrelenmiş öğeleri hesapla - 'all' seçildiğinde tüm öğeleri göster, değilse seçilen tipe göre filtrele
  const filteredItems = items.filter(item => {
    if (activeFilter === 'all') return true; // Tüm öğeleri göster
    return item.type === activeFilter;
  });
  
  // Ekran genişliğine göre kolon sayısını ayarla
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setColumns(1);
      } else if (window.innerWidth < 1024) {
        setColumns(2);
      } else if (window.innerWidth < 1280) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Rastgele yükseklik oluştur - masonry grid için
  const getRandomHeight = () => {
    const heights = ['300px', '300px', '300px', '300px', '300px'];
    return heights[Math.floor(Math.random() * heights.length)];
  };

  // Lightbox için slaytları hazırla
  const slidesForLightbox = filteredItems.map(item => {
    return {
      src: item.image,
      alt: item.title || "Galeri görüntüsü",
      width: 1280,
      height: 960
    }
  });

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    setIsLightboxOpen(true);
  };
  
  // Filtre düğmeleri için stil belirleme
  const getFilterButtonClass = (filterType: 'all' | 'image' | 'video') => {
    return `px-4 py-2 rounded-lg transition-all duration-300 ${
      activeFilter === filterType 
        ? 'bg-teal-600 text-white font-medium shadow-md' 
        : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
    }`;
  };

  // Görüntülenecek görsellerin URL'lerine timestamp parametresi ekle (önbelleği önle)
  useEffect(() => {
    // Önbelleği kırmak için görsellere timestamp ekle
    const timestamp = Date.now();
    const imagesWithTimestamp = items.map(item => item.image).map(img => `${img}?t=${timestamp}`);
    setLoadedImages(imagesWithTimestamp);
  }, [items]);

  // Sayfa görünür olduğunda carousel'i yeniden başlat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Görünür olduğunda görüntüleri yeniden yükle
        const timestamp = Date.now();
        const refreshedImages = items.map(item => item.image).map(img => `${img}?t=${timestamp}`);
        setLoadedImages(refreshedImages);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [items]);

  // Otomatik oynatma için timer
  useEffect(() => {
    if (!autoPlay || loadedImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % loadedImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, loadedImages.length]);

  // Görsellerin yüklenmesine göre işlem yap
  useEffect(() => {
    if (items.length > 0 && loadedImages.length === 0) {
      // Yüklenmemiş görseller varsa
      const timestamp = Date.now();
      const imagesWithTimestamp = items.map(item => item.image).map(img => `${img}?t=${timestamp}`);
      setLoadedImages(imagesWithTimestamp);
    }
  }, [items, loadedImages]);

  // YouTube video modalı için state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);

  const openViewer = (index: number) => {
    const item = filteredItems[index];
    
    console.log("Tıklanan öğe:", item); // Debug için
    console.log("Öğe tipi:", item.type);
    console.log("Youtube ID:", item.youtubeId);
    
    // Eğer video ise video modalını aç
    if (item.type === 'video' && item.youtubeId) {
      setCurrentVideoId(item.youtubeId);
      setVideoLoading(true);
      setVideoModalOpen(true);
    } else {
      // Resim ise normal görüntüleyici aç
      setCurrentIndex(index);
      setIsLightboxOpen(true);
    }
  };

  const closeViewer = () => {
    setIsLightboxOpen(false);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setCurrentVideoId(null);
  };

  const navigateGallery = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
    } else {
      setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
    }
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
  };

  if (loadedImages.length === 0) {
    return (
      <div className="w-full h-[500px] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse flex items-center justify-center rounded-lg">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">{lang === 'tr' ? 'Resimler yükleniyor...' : 'Loading images...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container pb-8">
      {/* Hero Alanı */}
      <div className="hero-area relative overflow-hidden mb-8 rounded-lg shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-teal-800/60 to-blue-900/70 z-10"></div>
        <div className="absolute inset-0 overflow-hidden">
          <Image 
            src={items[0]?.image || "/images/hero-bg.jpg"} 
            alt="Galeri Hero" 
            fill 
            priority 
            className="object-cover" 
            style={{objectPosition: 'center 30%'}}
          />
        </div>
        <div className="relative z-20 container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-lg">
            {lang === 'en' ? 'Our Gallery' : 'Galerimiz'}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-8 drop-shadow-md">
            {lang === 'en' 
              ? 'Explore our beautiful spaces and surroundings through our image gallery'
              : 'Görsel galerimiz aracılığıyla güzel mekanlarımızı ve çevremizi keşfedin'}
          </p>
          <div className="filters-container flex items-center justify-center gap-3 flex-wrap">
            <button 
              className={`${getFilterButtonClass('all')}`}
              onClick={() => setActiveFilter('all')}
            >
              {lang === 'tr' ? 'Tümü' : 'All'}
            </button>
            <button 
              className={`${getFilterButtonClass('image')}`}
              onClick={() => setActiveFilter('image')}
            >
              {lang === 'tr' ? 'Fotoğraflar' : 'Photos'}
            </button>
            <button 
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeFilter === 'video' 
                  ? 'bg-red-600 text-white font-medium shadow-md' 
                  : 'bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white'
              }`}
              onClick={() => setActiveFilter('video')}
            >
              {lang === 'tr' ? 'Videolar' : 'Videos'}
            </button>
          </div>
        </div>
      </div>

      {/* Galeri Grid */}
      <div className="container mx-auto px-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">{lang === 'tr' ? 'Bu kategoride görsel bulunamadı' : 'No images found in this category'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <div 
                key={item.id}
                className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => openViewer(index)}
              >
                <div className="aspect-square">
                  <img 
                    src={item.image} 
                    alt={item.title || "Galeri görüntüsü"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Video ise play ikonunu göster */}
                  {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="bg-red-600 rounded-full p-4 text-white">
                        <FaPlay size={24} />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Büyütme ikonu */}
                <div className="absolute top-2 right-2 bg-white/30 backdrop-blur-sm p-2 rounded-full text-white opacity-0 hover:opacity-100 transition-opacity duration-300">
                  {item.type === 'video' ? <FaYoutube size={16} /> : <FaExpand size={16} />}
                </div>
                
                {/* Öğe başlığı */}
                {item.title && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full hover:translate-y-0 transition-transform duration-300">
                    <p className="font-medium">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-white/80">{item.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox
        open={isLightboxOpen}
        close={closeViewer}
        slides={slidesForLightbox}
        index={currentIndex}
        plugins={[Fullscreen, Slideshow, Thumbnails, Zoom, Counter]}
        carousel={{
          finite: false,
          preload: 3,
          padding: { top: 20, bottom: 20, left: 0, right: 0 },
          spacing: 30,
          imageFit: "cover"
        }}
        thumbnails={{
          position: "bottom",
          width: 120,
          height: 80,
          border: 1,
          borderRadius: 4,
          padding: 4,
          gap: 16,
        }}
        counter={{ container: { style: { top: '20px', right: '20px', backdropFilter: 'blur(4px)' } } }}
        controller={{ closeOnBackdropClick: true }}
        slideshow={{ autoplay: autoPlay, delay: interval }}
      />

      {/* Video Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <button 
            onClick={closeVideoModal}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            aria-label={dictionary?.close || "Kapat"}
          >
            <FaTimes size={24} />
          </button>
          
          <div className="relative w-full max-w-4xl aspect-video">
            {videoLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                <div className="flex flex-col items-center">
                  <div className="animate-spin mb-2">
                    <FaYoutube size={40} className="text-red-600" />
                  </div>
                  <p className="text-white">{dictionary?.loadingVideo || "Video Yükleniyor..."}</p>
                </div>
              </div>
            )}
            
            <iframe
              className="w-full h-full rounded-lg shadow-2xl"
              src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleVideoLoad}
            ></iframe>
          </div>
        </div>
      )}

      {/* Gerekli CSS stillerini ekle */}
      <style jsx global>{`
        .gallery-container {
          max-width: 1920px;
          margin: 0 auto;
        }
        
        .hero-area {
          height: 350px;
          margin-top: 0;
        }

        @media (min-width: 768px) {
          .hero-area {
            height: 400px;
          }
        }
        
        .yarl__button {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: all 0.3s ease;
        }
        
        .yarl__button:hover {
          background: rgba(255, 255, 255, 0.4);
          transform: scale(1.1);
        }
        
        .yarl__thumbnails_thumbnail {
          position: relative;
          overflow: hidden;
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        
        .yarl__thumbnails_thumbnail:hover {
          transform: translateY(-2px);
        }
        
        .yarl__thumbnails_thumbnail.yarl__thumbnails_thumbnail_active {
          box-shadow: 0 0 0 2px #3b82f6;
        }
      `}</style>
    </div>
  );
} 