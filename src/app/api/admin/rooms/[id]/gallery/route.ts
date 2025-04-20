import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Dynamic API route
export const dynamic = 'force-dynamic';

// CORS ve cache ayarları
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const cacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

// PUT - Oda galerisini güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { image, gallery } = await request.json();

    // Önce odayı güncelle (ana görsel)
    const updatedRoom = await prisma.room.update({
      where: { id },
      data: {
        mainImageUrl: image,
        // Mevcut galeri öğelerini sil
        gallery: {
          deleteMany: {},
          // Yeni galeri öğelerini ekle
          createMany: {
            data: gallery.map((imageUrl: string, index: number) => ({
              imageUrl,
              orderNumber: index + 1
            }))
          }
        }
      },
      include: {
        gallery: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedRoom
    });
  } catch (error) {
    console.error('Galeri güncelleme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 