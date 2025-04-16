import { Server, Socket } from 'socket.io'; // Import Socket type
import http from 'http';

// WebSocket sunucusu (Use Server type)
let io: Server | null = null;

// WebSocket bağlantı işleyicisi (Remove unused req)
export function GET() {
  if (!io) {
    // Socket.io sunucusu oluşturulması
    const server = http.createServer();
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Bağlantı dinleyicisi (Use Socket type)
    io.on('connection', (socket: Socket) => {
      console.log('Yeni bir istemci bağlandı:', socket.id);

      // Bağlantı kesildi
      socket.on('disconnect', () => {
        console.log('İstemci bağlantısı kesildi:', socket.id);
      });
    });

    // Sunucuyu başlat
    server.listen(3001, () => {
      console.log('WebSocket sunucusu 3001 portunda başlatıldı');
    });
  }

  // HTTP yanıtı döndür
  return new Response('WebSocket API aktif', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// Odalar güncellendiğinde bildirim gönderen yardımcı fonksiyon
export function notifyRoomsUpdated() {
  if (io) {
    io.emit('rooms-updated', { timestamp: new Date().toISOString() });
  }
  console.log('Odalar güncellendi, WebSocket bildirimi gönderildi');
}

// Belirli bir oda güncellendiğinde bildirim gönderen yardımcı fonksiyon
export function notifyRoomUpdated(roomId: string) {
  if (io) {
    io.emit('room-updated', { roomId, timestamp: new Date().toISOString() });
  }
  console.log(`Oda güncellendi (${roomId}), WebSocket bildirimi gönderildi`);
}

// Galeri güncellendiğinde bildirim gönderen yardımcı fonksiyon
export function notifyGalleryUpdated() {
  if (io) {
    io.emit('gallery-updated', { timestamp: new Date().toISOString() });
  }
  console.log('Galeri güncellendi, WebSocket bildirimi gönderildi');
}
