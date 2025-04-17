'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';
import { getRoomsForLanguage } from '../data/rooms';
import CookieConsent from './CookieConsent';
import Image from 'next/image';

interface LinkItem {
  title: string;
  path: string;
}

interface FooterProps {
  lang?: string;
}

export default function Footer({ lang: propLang }: FooterProps) {
  const pathname = usePathname();
  const language = propLang || (pathname?.startsWith('/en') ? 'en' : 'tr');
  
  const [roomLinks, setRoomLinks] = useState<LinkItem[]>([]);
  
  // Oda verilerini yükle
  useEffect(() => {
    const loadRoomData = async () => {
      try {
        const rooms = await getRoomsForLanguage(language);
        
        // Oda linklerini oluştur
        const links = rooms.map(room => ({
          title: room.name,
          path: `/${language}/rooms/${room.id}`
        }));
        
        setRoomLinks(links);
      } catch (error) {
        console.error('Footer oda linkleri yüklenirken hata:', error);
        setRoomLinks([]);
      }
    };
    
    loadRoomData();
  }, [language]);
  
  // Diğer linkler
  const quickLinks: LinkItem[] = [
    { title: language === 'tr' ? 'Ana Sayfa' : 'Home', path: `/${language}` },
    { title: language === 'tr' ? 'Hakkımızda' : 'About Us', path: `/${language}/about` },
    { title: language === 'tr' ? 'Odalar' : 'Rooms', path: `/${language}/rooms` },
    { title: language === 'tr' ? 'Galeri' : 'Gallery', path: `/${language}/gallery` },
    { title: language === 'tr' ? 'İletişim' : 'Contact', path: `/${language}/contact` }
  ];

  return (
    <footer className="bg-[#003558] text-white px-5 md:px-10 pt-10 pb-5">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          {/* Logo ve Açıklama */}
          <div>
            <div className="flex items-center mb-4 justify-center md:justify-start">
              <div className="w-36 h-36 bg-white rounded-lg flex items-center justify-center p-2 shadow-md">
                <Image 
                  src="/images/logo/dogahotellogo.jpg" 
                  alt="Doğa Hotel Logo" 
                  width={130} 
                  height={130}
                  className="object-contain" 
                  priority
                />
              </div>
            </div>
            <p className="text-gray-100 mb-4">
              {language === 'tr' 
                ? 'Ölüdeniz\'in eşsiz manzarası eşliğinde konforlu ve güvenli bir konaklama deneyimi sunuyoruz.'
                : 'We offer a comfortable and safe accommodation experience with the unique view of Oludeniz.'}
            </p>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <a 
                href="https://facebook.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#002540] rounded-full flex items-center justify-center hover:bg-blue-600 transition duration-300"
                aria-label="Facebook"
              >
                <FaFacebookF className="text-white" />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#002540] rounded-full flex items-center justify-center hover:bg-blue-400 transition duration-300"
                aria-label="Twitter"
              >
                <FaTwitter className="text-white" />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#002540] rounded-full flex items-center justify-center hover:bg-pink-600 transition duration-300"
                aria-label="Instagram"
              >
                <FaInstagram className="text-white" />
              </a>
            </div>
          </div>

          {/* Hızlı Linkler */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">
              {language === 'tr' ? 'Hızlı Linkler' : 'Quick Links'}
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.path} className="text-gray-100 hover:text-blue-300 transition duration-300">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Odalarımız */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">
              {language === 'tr' ? 'Odalarımız' : 'Our Rooms'}
            </h3>
            <ul className="space-y-2">
              {roomLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.path} className="text-gray-100 hover:text-blue-300 transition duration-300">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* İletişim Bilgileri */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">
              {language === 'tr' ? 'İletişim' : 'Contact'}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="pt-1 text-blue-300">
                  <FaMapMarkerAlt />
                </div>
                <p className="text-gray-100">
                  {language === 'tr' 
                    ? 'Ölüdeniz, Ovacık Cd. 85 Sokak No:71, 48300 Fethiye/Muğla'
                    : 'Oludeniz, Ovacik St. 85 Street No:71, 48300 Fethiye/Mugla, Turkey'}
                </p>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-blue-300">
                  <FaPhone />
                </div>
                <a href="tel:02526166180" className="text-gray-100 hover:text-blue-300 transition duration-300">
                  0252 616 61 80
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="text-blue-300">
                  <FaEnvelope />
                </div>
                <a href="mailto:info@dogahoteloludeniz.com" className="text-gray-100 hover:text-blue-300 transition duration-300">
                  info@dogahoteloludeniz.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="pt-6 mt-6 border-t border-[#002540] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-200 text-sm">
            &copy; {new Date().getFullYear()} Doğa Hotel.{' '}
            {language === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-200">
            <Link href={`/${language}/privacy`} className="hover:text-blue-300 transition duration-300">
              {language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}
            </Link>
            <Link href={`/${language}/terms`} className="hover:text-blue-300 transition duration-300">
              {language === 'tr' ? 'Kullanım Koşulları' : 'Terms of Use'}
            </Link>
            <Link href={`/${language}/cookies`} className="hover:text-blue-300 transition duration-300">
              {language === 'tr' ? 'Çerez Politikası' : 'Cookie Policy'}
            </Link>
          </div>
        </div>
      </div>
      <CookieConsent language={language} />
    </footer>
  );
} 