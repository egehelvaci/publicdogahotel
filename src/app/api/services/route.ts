import { NextResponse } from "next/server";
import { executeQuery } from "@/lib/db";

export const revalidate = 0; // Her istekte yeniden oluştur

// Tüm servisleri getir - PUBLIC API
export async function GET() {
  try {
    // Veritabanından hizmetleri al
    const query = `
      SELECT * FROM services 
      ORDER BY order_number ASC
    `;
    
    const result = await executeQuery(query);
    const services = result.rows;
    
    // Cache önleme başlıkları ile hizmetleri döndür
    return NextResponse.json(
      { success: true, items: services },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Public servis verileri getirilirken hata:', error);
    return NextResponse.json(
      { success: false, message: 'Servis verileri getirilirken bir hata oluştu' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 