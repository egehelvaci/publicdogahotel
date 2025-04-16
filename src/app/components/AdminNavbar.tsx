'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaHome, FaSignOutAlt } from 'react-icons/fa';

interface AdminNavbarProps {
  lang: string;
}

export default function AdminNavbar({ lang }: AdminNavbarProps) {
  const router = useRouter();
  
  // Çıkış işlemi
  async function handleLogout() {
    try {
      // Route path doğrulaması ve hata yakalamayı güçlendiriyoruz
      const response = await fetch('/api/admin/logout', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Tarayıcı önbelleğini devre dışı bırakarak her zaman sunucudan yanıt almayı sağla
        cache: 'no-store',
      }).catch(err => {
        console.error("Fetch hatası:", err);
        throw new Error("İstek gönderilemedi");
      });
      
      if (response && response.ok) {
        // Çıkış işlemi başarılı, yerel storage'dan verileri temizle
        localStorage.removeItem('adminUser');
        sessionStorage.clear();
        
        // Login sayfasına yönlendir
        router.push(`/${lang}/admin/login`);
      } else {
        // Çıkış başarısız olsa bile login sayfasına yönlendir
        console.error('Çıkış yapılamadı, yine de login sayfasına yönlendiriliyor');
        localStorage.removeItem('adminUser');
        sessionStorage.clear();
        router.push(`/${lang}/admin/login`);
      }
    } catch (error) {
      console.error('Çıkış hatası:', error);
      // Hata durumunda da login sayfasına yönlendir
      localStorage.removeItem('adminUser');
      sessionStorage.clear();
      router.push(`/${lang}/admin/login`);
    }
  }
  
  return (
    <nav className="bg-teal-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={`/${lang}/admin`} className="text-xl font-bold">
                {lang === 'tr' ? 'Yönetici Paneli' : 'Admin Panel'}
              </Link>
            </div>
            
            <div className="ml-6 flex items-center space-x-4">
              <Link 
                href={`/${lang}/admin`} 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-600"
              >
                <FaHome className="inline-block mr-1" />
                {lang === 'tr' ? 'Ana Sayfa' : 'Dashboard'}
              </Link>
              
              <Link 
                href={`/${lang}/admin/rooms`} 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-600"
              >
                {lang === 'tr' ? 'Odalar' : 'Rooms'}
              </Link>
              
              <Link 
                href={`/${lang}/admin/hero-slider`} 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-600"
              >
                {lang === 'tr' ? 'Slider' : 'Slider'}
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <Link href={`/${lang}`} className="px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-600 mr-3">
              {lang === 'tr' ? 'Siteyi Görüntüle' : 'View Site'}
            </Link>
            
            <button 
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 flex items-center"
            >
              <FaSignOutAlt className="mr-1" />
              {lang === 'tr' ? 'Çıkış Yap' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 