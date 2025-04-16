import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket bağlantısı için hook
export default function useSocketNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  
  // Socket bağlantısı kurma
  useEffect(() => {
    // Geliştirme veya üretim moduna göre socket URL'si
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:3001';
      
    console.log('Socket.io bağlantısı kuruluyor:', socketUrl);
    
    // Socket bağlantısını kur
    const socketConnection = io(socketUrl, {
      transports: ['websocket'],
      withCredentials: true
    });
    
    // Bağlantı olaylarını dinle
    socketConnection.on('connect', () => {
      console.log('Socket.io bağlantısı kuruldu:', socketConnection.id);
    });
    
    socketConnection.on('connect_error', (err) => {
      console.error('Socket.io bağlantı hatası:', err.message);
    });
    
    // Oda güncellemelerini dinle
    socketConnection.on('rooms-updated', (data) => {
      console.log('Odalar güncellendi:', data);
      setNeedsRefresh(true);
    });
    
    socketConnection.on('room-updated', (data) => {
      console.log('Oda güncellendi:', data.roomId);
      setNeedsRefresh(true);
    });
    
    socketConnection.on('gallery-updated', (data) => {
      console.log('Galeri güncellendi:', data.roomId);
      setNeedsRefresh(true);
    });
    
    // Socket bağlantısını state'e kaydet
    setSocket(socketConnection);
    
    // Temizleme fonksiyonu
    return () => {
      console.log('Socket.io bağlantısı kapatılıyor...');
      socketConnection.disconnect();
    };
  }, []);
  
  // Yenileme durumunu sıfırla
  const resetRefreshFlag = () => {
    setNeedsRefresh(false);
  };
  
  return { socket, needsRefresh, resetRefreshFlag };
} 