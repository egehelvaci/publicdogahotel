import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// GET handler to fetch all gallery items
export async function GET() {
  try {
    const query = `
      SELECT * FROM gallery
      ORDER BY order_number ASC
    `;
    
    const result = await executeQuery(query);
    return NextResponse.json({ success: true, items: result.rows });
  } catch (error) {
    console.error('Failed to fetch gallery items:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch gallery items.' }, { status: 500 });
  }
}

// POST handler for adding, updating, deleting gallery items
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, item, items } = body;

    // Add a new gallery item
    if (action === 'add') {
      const insertQuery = `
        INSERT INTO gallery (
          title_tr, title_en, description_tr, description_en, image_url, order_number
        ) VALUES (
          $1, $2, $3, $4, $5, 
          (SELECT COALESCE(MAX(order_number), 0) + 1 FROM gallery)
        ) RETURNING *;
      `;
      
      const result = await executeQuery(insertQuery, [
        item.titleTR || '', 
        item.titleEN || '', 
        item.descriptionTR || '', 
        item.descriptionEN || '', 
        item.image
      ]);
      
      return NextResponse.json({ success: true, item: result.rows[0] });
    }
    
    // Update gallery item(s) order
    if (action === 'reorder') {
      // Başlangıçta tüm öğeleri transaction içinde güncelleyelim
      const client = await (await executeQuery('BEGIN')).client;
      
      try {
        for (let i = 0; i < items.length; i++) {
          const updateQuery = `
            UPDATE gallery 
            SET order_number = $1
            WHERE id = $2
          `;
          
          await client.query(updateQuery, [i + 1, items[i].id]);
        }
        
        await client.query('COMMIT');
        
        // Güncellenmiş galeri öğelerini getir
        const selectQuery = `
          SELECT * FROM gallery
          ORDER BY order_number ASC
        `;
        
        const result = await executeQuery(selectQuery);
        return NextResponse.json({ success: true, items: result.rows });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    
    return NextResponse.json({ success: false, message: 'Geçersiz işlem' }, { status: 400 });
  } catch (error) {
    console.error('Gallery operation failed:', error);
    return NextResponse.json({ success: false, message: 'Gallery operation failed.' }, { status: 500 });
  }
}

// Note: We will need POST, PUT, DELETE handlers here later
// to fully replace the fs logic from gallery.ts
