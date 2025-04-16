import { NextRequest, NextResponse } from 'next/server';
import { updateGalleryItemsOrder } from '@/app/data/gallery';

export const dynamic = 'force-dynamic';

// Define an interface for the expected item structure
interface ReorderItem {
  id: string;
  order: number;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.items || !Array.isArray(data.items)) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veri formatı. "items" dizisi gereklidir.' },
        { status: 400 }
      );
    }
    
    // Doğru formatta olduğundan emin ol (Use the defined interface)
    const isValidFormat = data.items.every(
      (item: ReorderItem) => typeof item.id === 'string' && typeof item.order === 'number'
    );
    
    if (!isValidFormat) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veri formatı. Her öğe "id" ve "order" içermelidir.' },
        { status: 400 }
      );
    }
    
    // Galeri öğelerinin sıralamasını güncelle
    await updateGalleryItemsOrder(data.items);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Galeri sıralaması başarıyla güncellendi' 
    });
  } catch (error) {
    console.error('Galeri sıralaması güncellenirken hata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Galeri sıralaması güncellenirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
}
