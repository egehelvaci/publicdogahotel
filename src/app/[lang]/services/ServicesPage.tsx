'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaUtensils, FaSwimmingPool, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import ScrollAnimationWrapper from '../../components/ScrollAnimationWrapper';
import { motion } from 'framer-motion';

type ServicesPageProps = {
  lang: string;
};

type ServiceItemWithIcon = {
  id: string;
  title: string;
  description: string;
  details: string[];
  image: string;
  images: string[];
  icon: string;
  order: number;
};

export default function ServicesPage({ lang }: ServicesPageProps) {
  const language = lang;
  const [services, setServices] = useState<ServiceItemWithIcon[]>([]);
  const [loading, setLoading] = useState(true);

  // Verileri yükle
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        console.log('Hizmetler verisi yükleniyor...');
        
        // Doğrudan API'den taze veri çekme
        const timestamp = Date.now();
        const baseUrl = window.location.origin;
        
        console.log(`API isteği yapılıyor: ${baseUrl}/api/services?t=${timestamp}`);
        
        // Public API'yi kullan
        const response = await fetch(`${baseUrl}/api/services?t=${timestamp}`, {
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
          const errorText = await response.text();
          console.error('API yanıt hatası:', response.status, errorText.substring(0, 200));
          throw new Error(`Servis verileri alınamadı: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('API yanıtı alındı:', data);
        
        if (data.success) {
          // Sadece aktif hizmetleri filtrele - artık API zaten filtreliyor
          const activeServices = data.items;
          
          console.log(`${activeServices.length} aktif servis bulundu`);
          
          // Dil bazlı dönüşüm yap
          const formattedServices = activeServices.map((item: any) => ({
            id: item.id,
            title: language === 'tr' ? item.titleTR : item.titleEN,
            description: language === 'tr' ? item.descriptionTR : item.descriptionEN,
            details: language === 'tr' ? item.detailsTR : item.detailsEN,
            image: item.image,
            images: item.images || [item.image], // Eğer images yoksa, image'ı kullan
            icon: item.icon,
            order: item.order
          })).sort((a: ServiceItemWithIcon, b: ServiceItemWithIcon) => a.order - b.order);
          
          setServices(formattedServices);
          console.log('Servis verileri yüklendi ve işlendi');
        } else {
          console.error('API başarısız yanıt:', data);
          throw new Error(data.message || 'API hatası');
        }
      } catch (error) {
        console.error('Hizmet verileri yüklenirken hata:', error);
        // Hata durumunda varsayılan verileri kullan
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    
    // Sayfa görünür olduğunda verileri otomatik yenile
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServices();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Belirli aralıklarla verileri yenile
    const intervalId = setInterval(fetchServices, 30000); // 30 saniyede bir yenile
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [lang, language]);

  // İkon bileşenini al
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'utensils':
        return <FaUtensils className="text-5xl text-amber-600" />;
      case 'swimming-pool':
        return <FaSwimmingPool className="text-5xl text-amber-600" />;
      default:
        return <FaUtensils className="text-5xl text-amber-600" />;
    }
  };

  // Slider için state ve fonksiyonlar
  const [currentSlides, setCurrentSlides] = useState<{ [key: string]: number }>({});

  // Component yüklendiğinde state'i hazırla
  useEffect(() => {
    const initialSlideState: { [key: string]: number } = {};
    services.forEach(service => {
      initialSlideState[service.id] = 0;
    });
    setCurrentSlides(initialSlideState);
  }, [services]);

  // Sonraki slayt
  const nextSlide = (serviceId: string, imagesLength: number) => {
    setCurrentSlides(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] + 1) % imagesLength
    }));
  };

  // Önceki slayt
  const prevSlide = (serviceId: string, imagesLength: number) => {
    setCurrentSlides(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] - 1 + imagesLength) % imagesLength
    }));
  };

  // Otomatik slayt değişimi
  useEffect(() => {
    if (services.length === 0) return;
    
    const timers: NodeJS.Timeout[] = [];
    
    services.forEach(service => {
      if (service.images.length > 1) {
        const timer = setInterval(() => {
          nextSlide(service.id, service.images.length);
        }, 5000);
        
        timers.push(timer);
      }
    });
    
    return () => {
      timers.forEach(timer => clearInterval(timer));
    };
  }, [services]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-amber-800 py-24" style={{paddingTop: "7rem"}}>
        <div className="absolute inset-0 overflow-hidden z-0">
          <Image 
            src="/images/gallery/pool3.jpg"
            alt={language === 'tr' ? "Hizmetler" : "Services"}
            fill
            className="object-cover opacity-40"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/70 to-amber-800/70"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-md"
          >
            {language === 'tr' ? 'Öne Çıkan Hizmetlerimiz' : 'Our Featured Services'}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-200 max-w-3xl mx-auto drop-shadow-sm"
          >
            {language === 'tr' 
              ? 'Konforunuz ve memnuniyetiniz için sunduğumuz özel hizmetlerimiz.' 
              : 'Our special services for your comfort and satisfaction.'}
          </motion.p>
        </div>
      </section>

      {/* Ana Hizmetler Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-24">
            {services.map((service, index) => (
              <ScrollAnimationWrapper 
                key={service.id} 
                animation={index % 2 === 0 ? "fadeInLeft" : "fadeInRight"} 
                delay={0.2} 
                once={true}
              >
                <div className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 items-center`}>
                  <div className="lg:w-1/2">
                    <div className="relative h-96 lg:h-[500px] rounded-xl overflow-hidden shadow-2xl">
                      {/* Slider */}
                      <div className="relative w-full h-full">
                        {service.images.length > 0 && currentSlides[service.id] !== undefined && (
                          <Image 
                            src={service.images[currentSlides[service.id]]}
                            alt={service.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover object-center transition-opacity duration-500"
                            priority
                          />
                        )}
                        
                        {/* Navigasyon Butonları (birden fazla görsel varsa) */}
                        {service.images.length > 1 && (
                          <>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                prevSlide(service.id, service.images.length);
                              }} 
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-amber-600/90 hover:bg-amber-700 p-3 md:p-4 rounded-full text-white z-10 transition-all shadow-lg"
                              aria-label="Önceki"
                            >
                              <FaArrowLeft className="text-lg md:text-xl" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                nextSlide(service.id, service.images.length);
                              }} 
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-600/90 hover:bg-amber-700 p-3 md:p-4 rounded-full text-white z-10 transition-all shadow-lg"
                              aria-label="Sonraki"
                            >
                              <FaArrowRight className="text-lg md:text-xl" />
                            </button>
                            
                            {/* Slider Göstergeleri */}
                            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 z-10">
                              {service.images.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCurrentSlides(prev => ({
                                      ...prev,
                                      [service.id]: i
                                    }));
                                  }}
                                  className={`h-3 rounded-full transition-all ${
                                    currentSlides[service.id] === i 
                                      ? 'bg-amber-600 w-8' 
                                      : 'bg-white/80 w-3 hover:bg-white'
                                  }`}
                                  aria-label={`Slayt ${i + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="lg:w-1/2">
                    <div className="mb-6">{getIconComponent(service.icon)}</div>
                    <h2 className="text-3xl font-bold mb-4 text-gray-800">{service.title}</h2>
                    <p className="text-gray-700 mb-6">{service.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      {service.details.map((detail, i) => (
                        <div key={i} className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                          <span className="text-gray-700">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollAnimationWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Sayfa Alt Bilgisi */}
      <section className="py-12 bg-amber-50">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold text-amber-800 mb-3">
            {language === 'tr' ? 'Doğa Hotel' : 'Doga Hotel'}
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {language === 'tr' 
              ? 'Konforlu ve keyifli bir tatil deneyimi için tüm hizmetlerimizle yanınızdayız.' 
              : 'We are with you with all our services for a comfortable and enjoyable holiday experience.'}
          </p>
        </div>
      </section>
    </>
  );
} 