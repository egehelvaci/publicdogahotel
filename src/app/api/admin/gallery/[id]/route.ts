import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Galeri öğesi silme
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Veritabanından galeri öğesini sil
    const deleteQuery = `
      DELETE FROM gallery
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await executeQuery(deleteQuery, [id]);
    
    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Silinecek galeri öğesi bulunamadı' },
        { status: 404 }
      );
    }
    
    // Kalan öğelerin sırasını güncelle
    const reorderQuery = `
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_number) as new_order
        FROM gallery
      )
      UPDATE gallery
      SET order_number = ranked.new_order
      FROM ranked
      WHERE gallery.id = ranked.id
    `;
    
    await executeQuery(reorderQuery);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Galeri öğesi başarıyla silindi',
      deletedItem: result.rows[0]
    });
  } catch (error) {
    console.error('Galeri öğesi silme hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Galeri öğesi silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
} 