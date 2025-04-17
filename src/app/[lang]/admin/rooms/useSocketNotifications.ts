'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export default function useSocketNotifications() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  useEffect(() => {
    // WebSocket bağlantısını kur
    const socketConnection = io('http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    // Bağlantı durumu
    socketConnection.on('connect', () => {
      console.log('WebSocket bağlantısı kuruldu:', socketConnection.id);
    });

    socketConnection.on('connect_error', (error) => {
      console.warn('WebSocket bağlantı hatası:', error.message);
    });

    // Odalar güncellendiğinde
    socketConnection.on('rooms-updated', (data) => {
      console.log('Odalar güncellendi bildirimi alındı:', data);
      setNeedsRefresh(true);
    });

    // Belirli bir oda güncellendiğinde
    socketConnection.on('room-updated', (data) => {
      console.log('Oda güncellendi bildirimi alındı:', data);
      setNeedsRefresh(true);
    });

    // Bileşen unmount olduğunda bağlantıyı kapat
    setSocket(socketConnection);
    
    return () => {
      console.log('WebSocket bağlantısı kapatılıyor...');
      socketConnection.disconnect();
    };
  }, []);

  // Yenileme bayrağını sıfırla
  const resetRefreshFlag = () => {
    setNeedsRefresh(false);
  };

  return { needsRefresh, resetRefreshFlag, socket };
} 