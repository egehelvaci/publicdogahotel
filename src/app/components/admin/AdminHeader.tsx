'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaChevronLeft, FaHome } from 'react-icons/fa';

interface AdminHeaderProps {
  title: string;
  backUrl?: string;
}

export default function AdminHeader({ title, backUrl = '/tr/admin' }: AdminHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-gradient-to-r from-blue-900 to-teal-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Geri Dön"
            >
              <FaChevronLeft />
            </button>
            
            <Link 
              href="/tr/admin" 
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Admin Ana Sayfa"
            >
              <FaHome />
            </Link>
            
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              href="/tr"
              className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-sm transition-colors"
            >
              Siteye Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 