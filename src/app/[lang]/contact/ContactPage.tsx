'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope, 
  FaPaperPlane,
  FaWhatsapp,
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaClock
} from 'react-icons/fa';
import { LANGUAGES, getTexts } from '@/app/[lang]/dictionaries';
import Link from 'next/link';

type ContactPageProps = {
  lang: (typeof LANGUAGES)[number];
};

export default function ContactPage({ lang }: ContactPageProps) {
  const { contact } = getTexts(lang);
  
  // İletişim bilgileri
  const contactInfo = {
    address: lang === 'tr' 
      ? 'Ölüdeniz, Ovacık Cd. 85 Sokak No:71, 48300 Fethiye/Muğla'
      : 'Oludeniz, Ovacik St. 85 Street No:71, 48300 Fethiye/Mugla, Turkey',
    phone: '0252 616 61 80',
    email: 'info@dogahoteloludeniz.com',
    whatsapp: '+90 532 066 48 08'
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState({
    submitting: false,
    success: false,
    error: ''
  });
  
  // Form event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        submitting: false,
        success: false,
        error: lang === 'tr' ? 'Lütfen tüm zorunlu alanları doldurun' : 'Please fill in all required fields'
      });
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus({
        submitting: false,
        success: false,
        error: lang === 'tr' ? 'Lütfen geçerli bir e-posta adresi girin' : 'Please enter a valid email address'
      });
      return;
    }
    
    // Form submission
    setFormStatus({ submitting: true, success: false, error: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Form gönderilirken bir hata oluştu');
      }

      // Form submission successful
      setFormStatus({
        submitting: false,
        success: true,
        error: ''
      });

      // Reset form after success
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Form submit error:', error);
      setFormStatus({
        submitting: false,
        success: false,
        error: error instanceof Error ? error.message : 'Bir hata oluştu'
      });
    }
  };

  // Google Harita koordinatları - Fethiye, Ölüdeniz koordinatları
  const mapLocation = {
    latitude: 36.5744812,
    longitude: 29.1481249,
    zoom: 18.75
  };

  // Google Maps URL - Belirli bir koordinatı işaretleyen harita
  const googleMapsUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d804.8824308656936!2d${mapLocation.longitude}!3d${mapLocation.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0xd1c67d86bf2fa3a0!2zMzbCsDM0JzMwLjQiTiAyOcKwMDknMTIuNSJF!5e0!3m2!1str!2str!4v1705235678901!5m2!1str!2str`;
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-r from-blue-800 to-teal-700 h-[30vh] sm:h-[40vh] md:h-[50vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{ backgroundImage: 'url("/images/pattern-dots.png")', backgroundSize: '30px' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {contact.title}
          </motion.h1>
          <motion.div 
            className="w-16 sm:w-24 h-1 bg-white mx-auto mb-6"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          ></motion.div>
          <motion.p 
            className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {contact.description}
          </motion.p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  {contact.contactInfo}
                </h2>
                <div className="h-1 w-20 bg-teal-600 mb-6"></div>
                <p className="text-gray-600 mb-8">
                  {contact.contactInfoDescription}
                </p>

                <div className="space-y-6">
                  <div className="flex items-start group relative">
                    <div className="bg-teal-100 rounded-full p-3 text-teal-600 mr-4">
                      <FaMapMarkerAlt size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">
                        {contact.address}
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        {contactInfo.address || 
                          (lang === 'tr' 
                            ? 'Kemerağzı Mah. Lara Cad. No:213 Muratpaşa/Antalya' 
                            : 'Kemerağzı District, Lara Street No:213 Muratpaşa/Antalya')}
                      </p>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-teal-600 hover:text-teal-700 text-sm font-medium transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {lang === 'tr' ? 'Yol Tarifi Al' : 'Get Directions'} 
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-teal-100 rounded-full p-3 text-teal-600 mr-4">
                      <FaPhone size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">
                        {contact.phone}
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        {contactInfo.phone || '+90 252 616 61 80'}
                      </p>
                      <a 
                        href={`https://wa.me/${contactInfo.whatsapp.replace(/\s+/g, '')}?text=${encodeURIComponent(lang === 'tr' ? 'Merhaba, bilgi almak istiyorum.' : 'Hello, I would like to get information.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
                      >
                        <FaWhatsapp className="mr-1" size={16} />
                        {lang === 'tr' ? 'WhatsApp ile İletişim' : 'Contact via WhatsApp'}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-teal-100 rounded-full p-3 text-teal-600 mr-4">
                      <FaEnvelope size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">
                        {contact.email}
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        {contactInfo.email || 'info@dogahotel.com'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="bg-teal-100 rounded-full p-3 text-teal-600 mr-4">
                      <FaClock size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">
                        {lang === 'tr' ? 'Çalışma Saatleri' : 'Working Hours'}
                      </h3>
                      <p className="text-gray-600 text-sm md:text-base">
                        {lang === 'tr' ? 'Haftanın her günü 24 saat' : '24/7, all days of the week'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="font-medium text-gray-800 mb-3">
                    {lang === 'tr' ? 'Bizi Takip Edin' : 'Follow Us'}
                  </h3>
                  <div className="flex space-x-4">
                    <a 
                      href="https://www.facebook.com/share/1AotxqFG16/?mibextid=wwXIfr" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-600 p-3 rounded-full transition-all"
                    >
                      <FaFacebookF size={18} />
                    </a>
                    <a 
                      href="https://www.instagram.com/dogahotel_oludeniz?igsh=bGNlbm5kazEyanB4" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-gray-100 hover:bg-teal-100 text-gray-600 hover:text-teal-600 p-3 rounded-full transition-all"
                    >
                      <FaInstagram size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[400px] md:h-auto">
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
          </div>
          
          {/* Contact Form */}
          <div className="mt-16">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                {contact.contactForm}
              </h2>
              <div className="h-1 w-20 bg-teal-600 mb-6"></div>
              <p className="text-gray-600 mb-8">
                {contact.contactFormDescription}
              </p>
              
              {formStatus.success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800">
                    {lang === 'tr' ? 'Mesajınız başarıyla gönderildi!' : 'Your message has been sent successfully!'}
                  </p>
                </div>
              )}
              
              {formStatus.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">
                    {formStatus.error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {contact.name} *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder={lang === 'tr' ? 'Adınız Soyadınız' : 'Your Name'}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {contact.emailLabel} *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                      placeholder={lang === 'tr' ? 'ornekmail@gmail.com' : 'example@gmail.com'}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    {contact.subject}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    placeholder={lang === 'tr' ? 'Konu' : 'Subject'}
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    {contact.message} *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
                    placeholder={lang === 'tr' ? 'Mesajınız...' : 'Your message...'}
                  ></textarea>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={formStatus.submitting}
                    className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors ${
                      formStatus.submitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {formStatus.submitting ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <FaPaperPlane className="mr-2" size={16} />
                    )}
                    {formStatus.submitting
                      ? lang === 'tr'
                        ? 'Gönderiliyor...'
                        : 'Sending...'
                      : contact.send}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 