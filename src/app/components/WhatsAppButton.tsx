'use client';

import React, { useState, useEffect } from 'react';
import { FaWhatsapp, FaTimes } from 'react-icons/fa';

type WhatsAppButtonProps = {
  language: string;
};

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ language }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Sayfada belirli bir mesafe kaydırıldığında butonu göster
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
        setIsOpen(false); // Yukarı çıkıldığında açık mesaj kutusunu kapat
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // WhatsApp numarası ve varsayılan mesaj
  const phoneNumber = '+905320664808';
  const defaultMessage = language === 'tr' 
    ? 'Merhaba, bilgi almak istiyorum.' 
    : 'Hello, I would like to get information.';

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(defaultMessage);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    setIsOpen(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed-bottom safe-bottom z-50">
      <div className={`fixed flex flex-col items-end mb-4 mr-4 transition-all duration-300 ease-in-out ${isOpen ? 'space-y-3' : 'space-y-0'}`} style={{ bottom: 'env(safe-area-inset-bottom, 16px)', right: '16px' }}>
        {/* Mesaj Balonu */}
        {isOpen && (
          <div className="bg-white shadow-xl rounded-lg p-4 max-w-[280px] animate-fade-in transform transition-all mb-2 border border-green-100">
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setIsOpen(false)}
              aria-label="Kapat"
            >
              <FaTimes size={14} />
            </button>
            <p className="text-gray-700 text-sm mb-3">
              {language === 'tr' ? 'Bize WhatsApp üzerinden ulaşın!' : 'Contact us via WhatsApp!'}
            </p>
            <button
              onClick={handleWhatsAppClick}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 w-full rounded-md transition-all duration-300 flex items-center justify-center text-sm"
            >
              <FaWhatsapp className="mr-2" />
              {language === 'tr' ? 'Sohbet Başlat' : 'Start Chat'}
            </button>
          </div>
        )}
        
        {/* Ana WhatsApp Butonu */}
        <button
          onClick={toggleOpen}
          className="bg-green-500 hover:bg-green-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 focus:outline-none"
          aria-label="WhatsApp ile İletişim"
        >
          <FaWhatsapp className="text-white" size={28} />
          {/* Animasyonlu Pulse Efekti */}
          <span className="absolute animate-ping w-5 h-5 rounded-full bg-green-400 opacity-75"></span>
        </button>
      </div>
    </div>
  );
};

export default WhatsAppButton; 