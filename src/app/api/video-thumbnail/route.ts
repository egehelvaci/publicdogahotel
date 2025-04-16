import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import fs from 'fs';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // URL'den video parametresini al
    const { searchParams } = new URL(request.url);
    const videoUrl = searchParams.get('video');

    if (!videoUrl) {
      return new NextResponse('Video URL parametresi gerekli', { status: 400 });
    }

    // Video dosya yolunu temizle ve güvenli hale getir (path traversal önlemi)
    const cleanVideoPath = videoUrl.replace(/^\//, '');
    const absoluteVideoPath = join(process.cwd(), 'public', cleanVideoPath);

    // Dosyanın var olup olmadığını kontrol et
    if (!existsSync(absoluteVideoPath)) {
      console.error(`Video dosyası bulunamadı: ${absoluteVideoPath}`);
      return new NextResponse('Video dosyası bulunamadı', { status: 404 });
    }

    // Thumbnail yoksa varsayılan bir görsel dön
    const defaultThumbnailPath = join(process.cwd(), 'public', 'images', 'video-placeholder.jpg');
    if (existsSync(defaultThumbnailPath)) {
      const thumbnailData = fs.readFileSync(defaultThumbnailPath);
      return new NextResponse(thumbnailData, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      });
    }

    // Varsayılan thumbnail da bulunamadıysa hata mesajı dön
    return new NextResponse('Thumbnail oluşturulamadı', { status: 500 });
  } catch (error) {
    console.error('Thumbnail alma hatası:', error);
    return new NextResponse('Thumbnail alınırken bir hata oluştu', { status: 500 });
  }
} 