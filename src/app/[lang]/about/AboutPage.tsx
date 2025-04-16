'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaArrowRight, FaStar, FaSwimmingPool, FaUtensils, FaBed, FaHotel } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { AboutData } from '@/app/data/about';

interface AboutPageProps {
  lang: string;
  staticData: AboutData; // Statik veri prop'u ekliyoruz
}

// Icon mapping
const iconComponents = {
  FaBed: FaBed,
  FaSwimmingPool: FaSwimmingPool,
  FaUtensils: FaUtensils,
  FaHotel: FaHotel
};

export default function AboutPage({ lang, staticData }: AboutPageProps) {
  const language = lang;
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // API'den veri çekmek yerine statik veriyi direkt olarak kullan
    setAboutData(staticData);
    setLoading(false);
  }, [staticData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-gray-600">Hata oluştu:</h2>
          <p className="text-red-500 mt-2">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  if (!aboutData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl text-gray-600">Veriler yüklenemedi. Lütfen daha sonra tekrar deneyin.</h2>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
          >
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  // İçerik verisini dil seçimine göre al
  const title = language === 'tr' ? aboutData.titleTR : aboutData.titleEN;
  const subtitle = language === 'tr' ? aboutData.subtitleTR : aboutData.subtitleEN;
  const content = language === 'tr' ? aboutData.contentTR : aboutData.contentEN;
  const badges = language === 'tr' ? aboutData.badgesTR : aboutData.badgesEN;

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gray-800 py-24" style={{paddingTop: "7rem"}}>
        <div className="absolute inset-0 overflow-hidden z-0">
          <Image 
            src={aboutData.heroImage}
            alt={title}
            fill
            style={{ objectFit: 'cover' }}
            className="opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/50 to-slate-900/70"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-md">
            {language === 'tr' ? 'Hakkımızda' : 'About Us'}
          </h1>
          <p className="text-xl text-gray-200 max-w-3xl mx-auto drop-shadow-sm">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Hotel Story */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold mb-6 text-amber-700">
                  {title}
                </h2>
                {content.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 mb-4">
                    {paragraph}
                  </p>
                ))}
                <div className="mt-8 flex flex-wrap gap-2">
                  {badges.map((badge, index) => (
                    <span key={index} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                      <FaStar className="mr-1 text-amber-600" /> {badge}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>
            <div className="lg:w-1/2 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                viewport={{ once: true }}
                className="relative h-[500px] overflow-hidden rounded-lg shadow-xl"
              >
                <Image 
                  src={aboutData.mainImage}
                  alt={title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="rounded-lg hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <h3 className="text-white text-xl font-bold">
                    {language === 'tr' ? 'Yeşil & Mavi\'nin Buluşma Noktası' : 'Where Green & Blue Meet'}
                  </h3>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Hotel Features */}
      <section className="py-20 bg-amber-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-3xl font-bold mb-4 relative inline-block"
            >
              {language === 'tr' ? 'Otel Özelliklerimiz' : 'Our Hotel Features'}
              <span className="absolute bottom-0 left-0 w-full h-1 bg-amber-500"></span>
            </motion.h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {language === 'tr' 
                ? 'Doğa Hotel\'de konforunuz ve keyfiniz için sunduğumuz olanaklar'
                : 'Amenities we offer for your comfort and enjoyment at Doga Hotel'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aboutData.features.map((feature, index) => {
              // İcon bileşenini dinamik olarak seç
              const IconComponent = iconComponents[feature.iconName as keyof typeof iconComponents];
              return (
                <motion.div 
                  key={feature.id} 
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="flex justify-center mb-4 text-amber-600">
                    {IconComponent && <IconComponent className="text-4xl text-amber-600" />}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-center">
                    {language === 'tr' ? feature.titleTR : feature.titleEN}
                  </h3>
                  <p className="text-gray-700 text-center">
                    {language === 'tr' ? feature.descriptionTR : feature.descriptionEN}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Photo Gallery Teaser */}
      <section className="py-16 bg-gradient-to-r from-amber-600 to-amber-700 relative overflow-hidden">
        <div className="absolute inset-0 mix-blend-overlay opacity-10">
          <div className="absolute inset-0 bg-pattern"></div>
        </div>
        
        {/* Dekoratif Şekiller */}
        <motion.div 
          className="absolute top-0 right-0 w-64 h-64 bg-amber-400/20 rounded-full"
          animate={{ 
            x: [0, 10, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        <motion.div 
          className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full"
          animate={{ 
            x: [0, -10, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        ></motion.div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white drop-shadow-lg">
            {language === 'tr' ? `${title}\'i Keşfedin` : `Explore ${title}`}
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8 drop-shadow-md">
            {language === 'tr'
              ? 'Ölüdeniz\'in muhteşem doğasında konforlu bir konaklama için odalarımızı ve hizmetlerimizi inceleyebilirsiniz.' 
              : 'You can explore our rooms and services for a comfortable stay in the magnificent nature of Ölüdeniz.'}
          </p>
          <div className="flex justify-center flex-wrap gap-4">
            <Link 
              href={`/${language}/rooms`}
              className="inline-flex items-center bg-white text-amber-600 font-medium py-3 px-8 rounded-md hover:bg-amber-50 transition-all duration-300 shadow-md relative overflow-hidden group"
            >
              <span className="relative z-10">
                {language === 'tr' ? 'Odalarımızı Keşfedin' : 'Explore Our Rooms'} <FaArrowRight className="ml-2 inline group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Link>
            <Link 
              href={`/${language}/contact`}
              className="inline-flex items-center bg-transparent border-2 border-white text-white py-3 px-8 rounded-md hover:bg-white/10 transition-all duration-300"
            >
              <span className="relative z-10">
                {language === 'tr' ? 'İletişime Geçin' : 'Contact Us'}
              </span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
} 