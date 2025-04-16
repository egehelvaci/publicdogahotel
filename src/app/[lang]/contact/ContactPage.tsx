'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaPaperPlane,
  FaWhatsapp
} from 'react-icons/fa';

type ContactPageProps = {
  lang: string;
};

export default function ContactPage({ lang }: ContactPageProps) {
  const language = lang;
  
  // İletişim bilgileri
  const contactInfo = {
    address: language === 'tr' 
      ? 'Ölüdeniz, Ovacık Cd. 85 Sokak No:71, 48300 Fethiye/Muğla'
      : 'Oludeniz, Ovacik St. 85 Street No:71, 48300 Fethiye/Mugla, Turkey',
    phone: '0252 616 61 80',
    email: 'info@dogahoteloludeniz.com',
    whatsapp: '+90 532 066 48 08'
  };

  // Google Harita koordinatları - Fethiye, Ölüdeniz koordinatları
  const mapLocation = {
    latitude: 36.57510817791861,
    longitude: 29.1534668103918,
    zoom: 17
  };

  // Google Maps URL - Belirli bir koordinatı işaretleyen harita
  const googleMapsUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d804.8824308656936!2d${mapLocation.longitude}!3d${mapLocation.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0xd1c67d86bf2fa3a0!2zMzbCsDM0JzMwLjQiTiAyOcKwMDknMTIuNSJF!5e0!3m2!1str!2str!4v1705235678901!5m2!1str!2str`;
  
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 py-32 overflow-hidden" style={{paddingTop: "7rem"}}>
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        
        {/* Dekoratif elemanlar */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200 opacity-5 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        
        {/* Animasyonlu background dekorları */}
        <motion.div 
          className="absolute left-10 top-10 w-20 h-20 bg-amber-300 rounded-full opacity-10 blur-xl"
          animate={{ 
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ 
            repeat: Infinity,
            duration: 15,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="absolute right-20 bottom-20 w-32 h-32 bg-amber-400 rounded-full opacity-10 blur-xl"
          animate={{ 
            x: [0, -70, 0],
            y: [0, -40, 0],
          }}
          transition={{ 
            repeat: Infinity,
            duration: 18,
            ease: "easeInOut"
          }}
        />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-lg"
          >
            {language === 'tr' ? 'İletişime Geçin' : 'Get in Touch'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-amber-50 max-w-3xl mx-auto mb-8 drop-shadow-md"
          >
            {language === 'tr' 
              ? 'Soru, görüş ve talepleriniz için bizimle iletişime geçin.' 
              : 'Contact us for your questions, comments, and requests.'}
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center"
          >
            <a 
              href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(language === 'tr' ? 'Merhaba, Rezarvasyon hakkında bilgi almak istiyorum' : 'Hello, I would like to get information about reservation')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button relative inline-flex items-center px-8 py-3 group hover:bg-green-600/30 transition-all duration-300 backdrop-blur-sm"
            >
              <span className="relative z-10 text-white group-hover:text-white transition-colors duration-300">
                {language === 'tr' ? 'WhatsApp ile Yazın' : 'Chat on WhatsApp'} <FaWhatsapp className="inline ml-2" />
              </span>
            </a>
          </motion.div>
        </div>
      </section>
      
      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl p-8 shadow-lg flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <FaMapMarkerAlt className="text-amber-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">{language === 'tr' ? 'Adres' : 'Address'}</h3>
              <p className="text-gray-600">{contactInfo.address}</p>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 mt-4 inline-flex items-center hover:text-amber-700"
              >
                {language === 'tr' ? 'Yol Tarifi Al' : 'Get Directions'} <FaPaperPlane className="ml-1 text-sm" />
              </a>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl p-8 shadow-lg flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <FaPhone className="text-amber-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">{language === 'tr' ? 'Telefon' : 'Phone'}</h3>
              <a 
                href={`tel:${contactInfo.phone}`}
                className="text-gray-600 hover:text-amber-600"
              >
                {contactInfo.phone}
              </a>
              <a 
                href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(language === 'tr' ? 'Merhaba, Rezarvasyon hakkında bilgi almak istiyorum' : 'Hello, I would like to get information about reservation')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-600 mt-4 inline-flex items-center hover:text-amber-700"
              >
                {language === 'tr' ? 'WhatsApp' : 'WhatsApp'} <FaWhatsapp className="ml-1" />
              </a>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl p-8 shadow-lg flex flex-col items-center text-center md:col-span-2 lg:col-span-1"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <FaEnvelope className="text-amber-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">{language === 'tr' ? 'E-posta' : 'E-mail'}</h3>
              <a 
                href={`mailto:${contactInfo.email}`}
                className="text-gray-600 hover:text-amber-600"
              >
                {contactInfo.email}
              </a>
              <p className="text-gray-500 text-sm mt-4">
                {language === 'tr' 
                  ? '7/24 hizmetinizdeyiz' 
                  : 'We are at your service 24/7'}
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
              {language === 'tr' ? 'Konum' : 'Location'}
            </h2>
            <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
              <iframe 
                src={googleMapsUrl}
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Doğa Hotel Konum"
              ></iframe>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
} 