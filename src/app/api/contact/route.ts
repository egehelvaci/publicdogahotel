import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Zorunlu alanların kontrolü
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email and message are required fields' },
        { status: 400 }
      );
    }

    // E-posta validasyonu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Mesaj alındı olarak kaydedildi - nodemailer yerine
    console.log('İletişim formu mesajı alındı:');
    console.log({
      name,
      email,
      subject: subject || 'Belirtilmemiş',
      message
    });

    // Normalde burada e-posta gönderimi yapılırdı
    // Şimdilik sadece başarılı yanıt dönüyoruz
    // NOT: Gerçek projede burada veritabanına kayıt yapılabilir veya başka bir e-posta servisi kullanılabilir

    return NextResponse.json({ 
      success: true, 
      message: 'Mesajınız alındı. En kısa sürede sizinle iletişime geçeceğiz.' 
    });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 