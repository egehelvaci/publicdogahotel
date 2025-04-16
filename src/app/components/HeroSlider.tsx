'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { getSliderData, SliderItem } from '../data/admin/sliderData';

type HeroSliderProps = {
  language: string;
};

const HeroSlider: React.FC<HeroSliderProps> = ({ language }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderItems, setSliderItems] = useState<SliderItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [direction, setDirection] = useState(0); // -1: sol, 0: başlangıç, 1: sağ
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Scroll animasyonu için
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const translateY = useTransform(scrollY, [0, 300], [0, 100]);
  
  // Paralaks efekti için
  const bgScale = useTransform(scrollY, [0, 500], [1.05, 1.2]);
  const bgTranslateY = useTransform(scrollY, [0, 500], [0, 50]);
  const textTranslateY = useTransform(scrollY, [0, 500], [0, -70]);
  const textScale = useTransform(scrollY, [0, 500], [1, 0.9]);
  const buttonsTranslateY = useTransform(scrollY, [0, 500], [0, 30]);
  
  const headingColor = useTransform(
    scrollY, 
    [0, 300], 
    ['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0.5)']
  );

  // Slider verilerini yükle
  useEffect(() => {
    const fetchSliderData = async () => {
      setIsLoading(true);
      try {
        console.log("HeroSlider: Slider verileri alınıyor");
        
        // getSliderData fonksiyonunu kullan (axios yerine)
        const data = await getSliderData();
        console.log("HeroSlider: Slider verileri başarıyla alındı:", data.length, "öğe");
        
        if (data && data.length > 0) {
          // Verileri alındığı gibi setSliderItems ile state'e ekle
          setSliderItems(data);
          
          // İlk görseli hemen yüklemeye başla
          if (data[0]?.image && typeof window !== 'undefined') {
            // Browser Image API kullan, next/image değil
            const imgElement = new window.Image();
            imgElement.src = data[0].image;
          }
        } else {
          console.warn("HeroSlider: Slider verisi bulunamadı, varsayılan veri kullanılacak");
          setSliderItems([{
            id: '1',
            image: '/images/hero-bg.jpg',
            titleTR: 'Doğa Tatil Evi',
            titleEN: 'Doğa Holiday House',
            subtitleTR: 'Doğa ile İç İçe',
            subtitleEN: 'In Harmony With Nature',
            descriptionTR: 'Huzur dolu bir tatil için ideal mekan',
            descriptionEN: 'Ideal place for a peaceful holiday',
            order: 0,
            active: true
          }]);
        }
      } catch (error) {
        console.error("HeroSlider: Slider verileri yüklenirken hata oluştu:", error);
        console.log("HeroSlider: Varsayılan veriler kullanılacak");
        setSliderItems([{
          id: '1',
          image: '/images/hero-bg.jpg',
          titleTR: 'Doğa Tatil Evi',
          titleEN: 'Doğa Holiday House',
          subtitleTR: 'Doğa ile İç İçe',
          subtitleEN: 'In Harmony With Nature',
          descriptionTR: 'Huzur dolu bir tatil için ideal mekan',
          descriptionEN: 'Ideal place for a peaceful holiday',
          order: 0,
          active: true
        }]);
      } finally {
        // Yükleme tamamlandı
        setIsLoading(false);
      }
    };

    fetchSliderData();
  }, []);

  // Otomatik slayt değiştirme için zamanlayıcı
  useEffect(() => {
    let slideTimer: NodeJS.Timeout;
    
    const rotateSlider = () => {
      if (isLoading || (sliderItems?.length || 0) <= 1 || isTransitioning) return;
      
      setIsTransitioning(true);
      setDirection(1);
      
      const nextSlideIndex = (currentIndex + 1) % (sliderItems?.length || 1);
      setCurrentIndex(nextSlideIndex);
      
      // Geçiş süresini daha kısa tutuyoruz
      slideTimer = setTimeout(() => {
        setIsTransitioning(false);
      }, 2000); // 3500ms yerine 2000ms - animasyon süreleri kısaldığı için
    };
    
    // Otomatik geçiş 20 saniye kalacak
    const autoSlideTimer = setInterval(rotateSlider, 20000);
    
    return () => {
      clearInterval(autoSlideTimer);
      clearTimeout(slideTimer);
    };
  }, [sliderItems, currentIndex, isLoading, isTransitioning]);
  
  // Manuel geçişlerin de süresini kısaltıyoruz
  const prevSlide = () => {
    if (isTransitioning || (sliderItems?.length || 0) <= 1) return;
    
    setIsTransitioning(true);
    setDirection(-1);
    
    const prevSlideIndex = (currentIndex - 1 + (sliderItems?.length || 1)) % (sliderItems?.length || 1);
    setCurrentIndex(prevSlideIndex);
    
    // Manuel geçişler için daha kısa bekleme süresi
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2000); // 3000ms yerine 2000ms
  };
  
  // Manuel geçişlerin süresini kısaltalım
  const nextSlide = () => {
    if (isTransitioning || (sliderItems?.length || 0) <= 1) return;
    
    setIsTransitioning(true);
    setDirection(1);
    
    const nextSlideIndex = (currentIndex + 1) % (sliderItems?.length || 1);
    setCurrentIndex(nextSlideIndex);
    
    // Manuel geçişler için daha kısa bekleme süresi
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2000); // 3000ms yerine 2000ms
  };
  
  // Manuel geçişlerin süresini kısaltalım
  const goToSlide = (index: number) => {
    if (isTransitioning || index === currentIndex) return;
    
    setIsTransitioning(true);
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    
    // Manuel geçişler için daha kısa bekleme süresi
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2000); // 3000ms yerine 2000ms
  };

  // Preload images - optimize edildi
  useEffect(() => {
    if (!sliderItems || sliderItems.length === 0) return;
    
    // Sıradaki resmi ön belleğe al (şu anki gösterilen ve bir sonraki)
    const preloadNextImage = () => {
      const nextIndex = (currentIndex + 1) % sliderItems.length;
      
      // Şu anki ve sonraki görselleri ön belleğe al
      [currentIndex, nextIndex].forEach(index => {
        const item = sliderItems[index];
        if (item?.image && typeof window !== 'undefined') {
          // Browser Image API kullan, next/image değil
          const imgElement = new window.Image();
          imgElement.src = item.image;
        }
      });
    };
    
    preloadNextImage();
  }, [sliderItems, currentIndex]);

  // Yükleme durumunda veya slider boşsa
  if (isLoading || sliderItems.length === 0) {
    return (
      <div className="relative h-screen w-full flex items-center justify-center bg-gray-800">
        <div className="text-white text-2xl font-semibold">
          {language === 'tr' ? 'Yükleniyor...' : 'Loading...'}
        </div>
      </div>
    );
  }

  // Mevcut görsel bilgisi
  const currentSlide = sliderItems[currentIndex];
  const title = language === 'tr' ? currentSlide.titleTR : currentSlide.titleEN;
  const subtitle = language === 'tr' ? currentSlide.subtitleTR : currentSlide.subtitleEN;
  const description = language === 'tr' ? currentSlide.descriptionTR : currentSlide.descriptionEN;

  // Slayt varyantları biraz daha hafif ve hızlı
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '25%' : '-25%', // %50 yerine %25 kullanarak daha hızlı görünüm
      opacity: 0.5, // Daha hızlı görünürlük için 0.2 yerine 0.5
      scale: 1.02, // Daha az ölçekleme
      filter: 'blur(3px)', // Daha az blur efekti
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { duration: 1.8, ease: [0.25, 0.1, 0.25, 1.0] }, // Daha kısa ve daha yumuşak
        opacity: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1.0] }, // Daha kısa
        scale: { duration: 1.8, ease: [0.25, 0.1, 0.25, 1.0] },
        filter: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1.0] }, // Daha kısa
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-25%' : '25%', // %50 yerine %25 kullanarak daha hızlı görünüm
      opacity: 0.5, // Daha hızlı görünürlük için 0.2 yerine 0.5
      scale: 0.98, // Daha az ölçekleme
      filter: 'blur(3px)', // Daha az blur efekti
      transition: {
        x: { duration: 1.8, ease: [0.25, 0.1, 0.25, 1.0] }, // Daha kısa ve daha yumuşak
        opacity: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1.0] }, // Daha kısa
        scale: { duration: 1.8, ease: [0.25, 0.1, 0.25, 1.0] },
        filter: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1.0] }, // Daha kısa
      },
    }),
  };
  
  // İçerik varyantları
  const contentVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        delay: 1.2, // İçerik animasyonu biraz daha geç başlasın
        ease: [0.16, 1, 0.3, 1],
      },
    },
    exit: { 
      opacity: 0, 
      y: -50,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };
  
  // Buton varyantları
  const buttonVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      scale: 0.9
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        duration: 0.5,
        delay: 0.8,
        ease: "easeOut" 
      } 
    },
    hover: {
      scale: 1.05,
      transition: { 
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    tap: { 
      scale: 0.95,
      transition: { 
        duration: 0.15,
        ease: "easeInOut",
      },
    },
  };

  return (
    <div className="relative h-screen w-full overflow-hidden" ref={containerRef} style={{margin: 0, padding: 0, top: 0, position: "absolute", left: 0, right: 0, bottom: 0}}>
      {/* Slider Görselleri - Paralaks Efekti */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentSlide.id}
          className="absolute inset-0 z-0"
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { 
              duration: 1.8,
              ease: "easeInOut"
            },
            scale: { 
              duration: 1.8,
              ease: "easeInOut"
            },
            opacity: { 
              duration: 1.5,
              ease: "easeInOut" 
            },
            filter: {
              duration: 1.5,
              ease: "easeInOut"
            }
          }}
          style={{
            scale: bgScale,
            y: bgTranslateY,
            willChange: "transform, opacity, filter"
          }}
        >
          {currentSlide.videoUrl ? (
            // Video var ise video göster
            <div className="absolute inset-0 bg-black">
              <video
                src={currentSlide.videoUrl}
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
              />
            </div>
          ) : (
            // Video yok ise resim göster
            <Image
              src={currentSlide.image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              quality={90}
              priority
              loading="eager"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZ3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzQ0NCIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiM2NjYiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmFkKSIgLz48L3N2Zz4="
              className="opacity-95 object-cover"
              style={{ transform: 'translateZ(0)' }} // GPU hızlandırma
            />
          )}
          {/* İyileştirilmiş Overlay - Degrade ve renk katmanı */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50"></div>
          <div className="absolute inset-0 bg-amber-900/10"></div>
          
          {/* Parlayan Noktalar */}
          <div className="absolute top-[20%] left-[10%] w-24 h-24 rounded-full bg-amber-500/10 blur-3xl"></div>
          <div className="absolute bottom-[30%] right-[15%] w-32 h-32 rounded-full bg-amber-500/10 blur-3xl"></div>
        </motion.div>
      </AnimatePresence>

      {/* İçerik - Geliştirilmiş Animasyonlar */}
      <motion.div 
        className="container mx-auto h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative z-10"
        style={{ 
          opacity, 
          y: textTranslateY,
          scale: textScale
        }}
      >
        <div className="max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`subtitle-${currentSlide.id}`}
              variants={contentVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative"
            >
              <p className="text-xl sm:text-3xl text-amber-300 font-medium mb-3 drop-shadow-lg text-center tracking-wider uppercase">
                {subtitle}
              </p>
              {/* Dekoratif çizgi */}
              <motion.span 
                className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-0.5 bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: "50%" }}
                transition={{ delay: 0.5, duration: 1 }}
              ></motion.span>
            </motion.div>
          </AnimatePresence>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${currentSlide.id}`}
              variants={contentVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ color: headingColor }}
            >
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight drop-shadow-lg text-center">
                {title.split(' ').map((word, i) => (
                  <motion.span 
                    key={i} 
                    className="inline-block mr-2"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        delay: 0.7 + (i * 0.1),
                        duration: 0.8,
                        ease: "easeOut"
                      }
                    }}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`description-${currentSlide.id}`}
              variants={contentVariants}
              custom={2}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <p className="text-xl md:text-2xl text-gray-200 mb-10 drop-shadow-md text-center">
                {description}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div
            className="flex flex-wrap gap-4 justify-center"
            style={{ y: buttonsTranslateY }}
          >
            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
            >
              <Link 
                href={`/${language}/rooms`}
                className="inline-flex items-center bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 rounded-md transition-all duration-300 shadow-lg overflow-hidden relative group"
              >
                <span className="relative z-10 flex items-center">
                  {language === 'tr' ? 'Odalarımız' : 'Our Rooms'}
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <span className="absolute bottom-0 left-0 w-full h-0 bg-amber-500 transition-all duration-300 group-hover:h-full -z-0"></span>
              </Link>
            </motion.div>
            
            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              whileTap="tap"
            >
              <Link 
                href={`/${language}/contact`}
                className="inline-flex items-center bg-transparent border-2 border-white text-white hover:bg-white/10 py-3 px-6 rounded-md transition-all duration-300 overflow-hidden relative group"
              >
                <span className="relative z-10">
                  {language === 'tr' ? 'İletişime Geçin' : 'Contact Us'}
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-full bg-white/20 transition-all duration-500 group-hover:w-full -z-0"></span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Slider Navigasyon Noktaları - Geliştirilmiş */}
      {sliderItems.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-10 flex justify-center space-x-3">
          {sliderItems.map((_, index) => (
            <motion.button
              key={index}
              className={`transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-12 h-2 bg-amber-500' 
                  : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              } rounded-full`}
              onClick={() => goToSlide(index)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slider Ok Butonları - Geliştirilmiş */}
      {sliderItems.length > 1 && (
        <>
          <motion.button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm hover:bg-amber-600/80 flex items-center justify-center text-white transition-all duration-300"
            whileHover={{ 
              scale: 1.1, 
              backgroundColor: 'rgba(217, 119, 6, 0.7)',
              boxShadow: '0 0 20px rgba(217, 119, 6, 0.5)'
            }}
            whileTap={{ scale: 0.95 }}
            aria-label="Previous slide"
          >
            <FaChevronLeft className="transition-transform duration-300 group-hover:-translate-x-1" />
          </motion.button>
          <motion.button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm hover:bg-amber-600/80 flex items-center justify-center text-white transition-all duration-300"
            whileHover={{ 
              scale: 1.1, 
              backgroundColor: 'rgba(217, 119, 6, 0.7)',
              boxShadow: '0 0 20px rgba(217, 119, 6, 0.5)'
            }}
            whileTap={{ scale: 0.95 }}
            aria-label="Next slide"
          >
            <FaChevronRight className="transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
        </>
      )}

      {/* Scroll Down Indicator - Geliştirilmiş */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
        animate={{ 
          y: [0, 10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "loop"
        }}
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.scrollTo({
              top: window.innerHeight,
              behavior: 'smooth'
            });
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <div className="text-white text-sm uppercase tracking-wider text-center mb-2 font-light">
          {language === 'tr' ? 'Aşağı Kaydır' : 'Scroll Down'}
        </div>
        <div className="w-8 h-12 rounded-full border-2 border-white/70 mx-auto flex justify-center group hover:border-amber-400 transition-colors duration-300">
          <motion.div 
            className="w-1.5 h-3 bg-white rounded-full mt-2 group-hover:bg-amber-400 transition-colors duration-300"
            animate={{ 
              y: [0, 7, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSlider; 