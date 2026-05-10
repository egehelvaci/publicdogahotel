'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FaBars, FaTimes, FaChevronDown, FaPhone } from 'react-icons/fa';

type HeaderProps = {
  lang?: string
}

const Header = ({ lang: initialLang = 'tr' }: HeaderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState(initialLang);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [currentPath, setCurrentPath] = useState('/');
  const [scrolled, setScrolled] = useState(false);
  const [isHomePage, setIsHomePage] = useState(false);

  // URL'yi kontrol edip ana sayfa mı değil mi belirle
  useEffect(() => {
    if (!pathname) return;
    setCurrentPath(pathname);
    
    // Daha doğrudan ana sayfa tespiti - sadece pathname'i kontrol et
    const isRootPath = pathname === '/tr' || pathname === '/en';
    console.log("Current pathname:", pathname, "isRootPath:", isRootPath);
    setIsHomePage(isRootPath);
    
    // Dil tespiti - ilk render'da props'tan gelen dili kullan, sonraki renderlarda URL'den belirle
    if (pathname.startsWith('/tr')) {
      setLanguage('tr');
    } else if (pathname.startsWith('/en')) {
      setLanguage('en');
    }
  }, [pathname]);

  // Scroll olduğunda header'ın görünümünü değiştir
  useEffect(() => {
    // Browser tarafında çalıştığına emin ol
    if (typeof window === 'undefined') return;
    
    // İlk yüklemede scroll durumunu kontrol et
    const initialPosition = window.scrollY;
    const initialScrolled = initialPosition > 10;
    setScrolled(initialScrolled);
    console.log("📌 Scroll başlangıç durumu:", initialPosition > 10 ? "Scrolled" : "Top");
    
    // Scroll durumunu kontrol eden fonksiyon
    const handleScroll = () => {
      const currentPosition = window.scrollY;
      const shouldBeScrolled = currentPosition > 10;
      
      if (scrolled !== shouldBeScrolled) {
        console.log("📜 Scroll değişimi:", shouldBeScrolled ? "Scrolled" : "Top", "Position:", currentPosition);
        setScrolled(shouldBeScrolled);
      }
    };
    
    // Scroll event listener ekle
    window.addEventListener('scroll', handleScroll);
    
    // Component unmount olduğunda listener'ı kaldır
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Dil menüsü dışına tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Header'ın saydam olup olmayacağını belirle
  const isTransparent = false;

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleLangMenu = () => {
    setIsLangMenuOpen(!isLangMenuOpen);
  };

  const changeLanguage = (lang: string) => {
    if (lang === language) {
      setIsLangMenuOpen(false);
      return;
    }

    setLanguage(lang);
    setIsLangMenuOpen(false);
    
    // Dil değiştiğinde, aynı sayfanın yeni dildeki versiyonuna yönlendir
    if (!pathname) return;
    
    const pathParts = pathname.split('/');
    if (pathParts.length > 1) {
      // İlk eleman boş string (çünkü / ile başlıyor), ikinci eleman dil kodu
      pathParts[1] = lang;
      window.location.href = pathParts.join('/');
    }
  };

  // Her dilin menü öğelerini URL'leri ile birlikte oluştur
  const menuItems = [
    { name: language === 'tr' ? 'Ana Sayfa' : 'Home', path: `/${language}` },
    { name: language === 'tr' ? 'Hakkımızda' : 'About Us', path: `/${language}/about` },
    { name: language === 'tr' ? 'Odalar' : 'Rooms', path: `/${language}/rooms` },
    { name: language === 'tr' ? 'Galeri' : 'Gallery', path: `/${language}/gallery` },
    { name: language === 'tr' ? 'Hizmetler' : 'Services', path: `/${language}/services` },
    { name: language === 'tr' ? 'İletişim' : 'Contact', path: `/${language}/contact` },
  ];

  // Dil seçenekleri
  const languageOptions = [
    { code: 'tr', name: 'Türkçe', flag: 'https://oludenizfethiye.b-cdn.net/uploads/tr.png' },
    { code: 'en', name: 'English', flag: 'https://oludenizfethiye.b-cdn.net/uploads/gb.png' },
  ];

  console.log("Header state:", { isHomePage, scrolled, isTransparent: false, path: pathname });

  return (
    <>
      {/* Header'ın yerini kaplayacak boş alan - içeriğin üst kısmında yeterli boşluk bırakarak kaymayı engeller */}
      <div className="h-24"></div>
      
      <header 
        className={`fixed w-full z-50 top-0 transition-all duration-350 bg-white shadow-md py-4`}
      >
        <div className="container mx-auto px-4 flex justify-between items-center relative z-10">
          <div className="flex items-center">
            <Link href={`/${language}`} className="flex items-center transition-all duration-500 mr-6">
              <div className="relative h-14 w-36 md:h-16 md:w-44 flex items-center justify-center">
                <Image 
                  src="https://oludenizfethiye.b-cdn.net/dogahotel.png"
                  alt="Doğa Hotel Logo"
                  width={176}
                  height={140}
                  className="relative z-10 object-contain"
                  priority
                />
              </div>
            </Link>

            <div className="hidden sm:flex items-center">
              <FaPhone className="text-[#169c71] mr-2" />
              <a 
                href="tel:02526166180" 
                className="text-sm font-medium text-gray-600 tracking-wider hover:text-[#169c71] transition-colors duration-300 flex items-center"
              >
                0252 616 61 80
              </a>
            </div>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-4 lg:space-x-8">
            {menuItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.path}
                className={`font-medium transition-colors hover:text-[#169c71] text-sm lg:text-base ${
                  currentPath === item.path 
                    ? 'text-[#169c71] font-semibold' 
                    : 'text-gray-600'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Dil Menüsü - Desktop */}
            <div className="relative" ref={langMenuRef}>
              <button 
                onClick={toggleLangMenu}
                className="flex items-center transition-colors text-gray-600 hover:text-[#169c71] text-sm lg:text-base"
                aria-label="Dil Seçimi"
              >
                <div className="relative w-5 h-5 lg:w-6 lg:h-6 mr-2 rounded-full overflow-hidden border border-gray-200">
                  <Image 
                    src={languageOptions.find(lang => lang.code === language)?.flag || ''}
                    alt={language}
                    layout="fill"
                    className="object-cover"
                  />
                </div>
                <span className="hidden lg:inline">{languageOptions.find(lang => lang.code === language)?.name}</span>
                <span className="lg:hidden">{language.toUpperCase()}</span>
                <FaChevronDown className="ml-1 w-3 h-3" />
              </button>
              
              {/* Dil Menü İçeriği */}
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-100">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => changeLanguage(option.code)}
                      className={`flex items-center w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                        language === option.code ? 'bg-gray-50 text-[#169c71] font-medium' : 'text-gray-600'
                      }`}
                    >
                      <div className="relative w-5 h-5 mr-2 rounded-full overflow-hidden">
                        <Image 
                          src={option.flag}
                          alt={option.code}
                          layout="fill"
                          className="object-cover"
                        />
                      </div>
                      <span>{option.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden focus:outline-none transition-colors text-gray-600 hover:text-[#169c71] p-2"
            onClick={toggleMenu}
            aria-label={isOpen ? "Menüyü Kapat" : "Menüyü Aç"}
            aria-expanded={isOpen}
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white shadow-lg relative z-10 max-h-[80vh] overflow-y-auto border-t border-gray-100">
            <div className="container mx-auto px-4 py-3 flex flex-col space-y-3">
              {menuItems.map((item, index) => (
                <Link 
                  key={index} 
                  href={item.path}
                  className={`font-medium py-4 px-3 transition-colors hover:text-[#169c71] flex items-center justify-between rounded-lg ${
                    currentPath === item.path 
                      ? 'text-[#169c71] font-semibold bg-gray-50' 
                      : 'text-gray-600'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <span>{item.name}</span>
                  {currentPath === item.path && (
                    <span className="bg-[#169c71] h-6 w-1 rounded-full"></span>
                  )}
                </Link>
              ))}
              
              {/* Dil Menüsü - Mobil */}
              <div className="py-4 border-t border-gray-100 mt-2">
                <p className="text-gray-600 text-sm mb-2 font-medium">
                  {language === 'tr' ? 'Dil Seçin' : 'Choose Language'}
                </p>
                <div className="flex flex-row gap-2">
                  {languageOptions.map((option) => (
                    <button
                      key={option.code}
                      onClick={() => changeLanguage(option.code)}
                      className={`flex items-center p-3 rounded-lg ${
                        language === option.code 
                          ? 'bg-[#169c71] text-white' 
                          : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                      } transition-all`}
                    >
                      <div className="relative w-5 h-5 mr-2 rounded-full overflow-hidden">
                        <Image 
                          src={option.flag}
                          alt={option.code}
                          layout="fill"
                          className="object-cover"
                        />
                      </div>
                      <span>{option.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Telefon bilgisi - Mobil */}
              <a 
                href="tel:02526166180" 
                className="flex items-center justify-center gap-2 bg-[#169c71] hover:bg-[#117a59] text-white p-3 rounded-lg transition-all mt-2 mb-1"
              >
                <FaPhone className="text-white" />
                <span className="font-medium">0252 616 61 80</span>
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header; 