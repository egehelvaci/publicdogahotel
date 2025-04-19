import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

    // Burada SMTP bilgilerinizi girin
    // Not: Gerçek bir uygulamada bu bilgileri .env dosyasında saklamanız önerilir
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true' ? true : false,
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password',
      },
    });

    // Mesaj içeriği
    const emailContent = `
      <h2>Yeni İletişim Formu Mesajı</h2>
      <p><strong>Ad:</strong> ${name}</p>
      <p><strong>E-posta:</strong> ${email}</p>
      <p><strong>Konu:</strong> ${subject || 'Belirtilmemiş'}</p>
      <p><strong>Mesaj:</strong> ${message}</p>
      <hr />
      <p>Bu e-posta, Doğa Hotel Ölüdeniz web sitesindeki iletişim formundan gönderilmiştir.</p>
    `;

    // E-posta ayarları
    const mailOptions = {
      from: process.env.EMAIL_FROM || `"Doğa Hotel İletişim Formu" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
      to: process.env.EMAIL_TO || 'info@dogahoteloludeniz.com',
      subject: `İletişim Formu: ${subject || 'Yeni Mesaj'}`,
      html: emailContent,
      replyTo: email,
    };

    // E-postayı gönder
    const info = await transporter.sendMail(mailOptions);

    console.log('Message sent: %s', info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 