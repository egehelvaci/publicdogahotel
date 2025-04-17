import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

// Dynamic API
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('Upload API: İstek alındı');
  
  try {
    // Form verisini al
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('Upload API: Dosya bulunamadı');
      return NextResponse.json(
        { success: false, message: 'Dosya yüklenmedi' },
        { status: 400 }
      );
    }
    
    // Dosya bilgilerini logla
    console.log(`Upload API: Dosya alındı - İsim: ${file.name}, Tür: ${file.type}, Boyut: ${file.size} bytes`);
    
    // Tebi.io yapılandırmasını kontrol et
    const bucket = process.env.TEBI_BUCKET;
    const accessKey = process.env.TEBI_API_KEY;
    const secretKey = process.env.TEBI_MASTER_KEY;
    
    console.log('Upload API: Ortam değişkenleri:', {
      TEBI_BUCKET_EXISTS: !!bucket,
      TEBI_API_KEY_EXISTS: !!accessKey,
      TEBI_MASTER_KEY_EXISTS: !!secretKey,
      BUCKET: bucket
    });
    
    if (!bucket || !accessKey || !secretKey) {
      console.error('Upload API: Tebi.io yapılandırması eksik');
      return NextResponse.json(
        { success: false, message: 'Depolama servisi yapılandırması eksik' },
        { status: 500 }
      );
    }

    // Dosya adını güvenli hale getir ve benzersiz yap
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    const uniqueFileName = `${Date.now()}-${safeFileName}`;
    console.log(`Upload API: Dosya adı güvenli hale getirildi: ${uniqueFileName}`);
    
    // Dosyanın klasör yolunu belirle
    const folder = 'uploads'; // Varsayılan klasör
    const filePath = folder ? `${folder}/${uniqueFileName}` : uniqueFileName;
    
    // Dosyayı buffer'a dönüştür
    console.log('Upload API: Dosya buffer\'a dönüştürülüyor...');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log(`Upload API: Buffer oluşturuldu, boyut: ${fileBuffer.length} bytes`);
    
    const region = 's3.tebi.io';
    
    // S3 Signature v4 için gerekli değerler
    const method = 'PUT';
    const service = 's3';
    const host = `${bucket}.${region}`;
    const endpoint = `https://${host}/${filePath}`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    
    console.log('Upload API: İmzalama değerleri hazırlandı', {
      filePath,
      endpoint
    });
    
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    const payloadHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Canonical request
    const canonicalRequest = [
      method,
      `/${filePath}`,
      '',
      `host:${host}`,
      `x-amz-content-sha256:${payloadHash}`,
      `x-amz-date:${amzDate}`,
      '',
      signedHeaders,
      payloadHash,
    ].join('\n');
    
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    
    // String to sign
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');
    
    // Signing key
    const kDate = crypto.createHmac('sha256', 'AWS4' + secretKey).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');
    
    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    console.log('Upload API: S3 imzalama tamamlandı, istek gönderiliyor...');
    
    try {
      // Dosyayı yükle
      const response = await axios.put(endpoint, fileBuffer, {
        headers: {
          'x-amz-content-sha256': payloadHash,
          'x-amz-date': amzDate,
          'Authorization': authorizationHeader,
          'Content-Type': file.type || 'application/octet-stream',
        },
      });
      
      console.log('Upload API: S3 yanıtı alındı:', {
        statusCode: response.status,
        statusText: response.statusText
      });
      
      // Dosya URL'si
      const fileUrl = endpoint;
      
      // Dönen yanıtta fileType'ı MIME tipine göre temizleyelim
      const detectFileType = (mimeType: string): 'image' | 'video' | 'unknown' => {
        if (mimeType.startsWith('image/')) {
          return 'image';
        } else if (mimeType.startsWith('video/')) {
          return 'video';
        } else {
          return 'unknown';
        }
      };
      
      return NextResponse.json({
        success: true,
        message: 'Dosya başarıyla yüklendi',
        url: fileUrl,
        fileName: uniqueFileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: detectFileType(file.type)
      });
    } catch (axiosError: any) {
      console.error('Upload API: Axios hatası:', {
        message: axiosError.message,
        code: axiosError.code,
        responseStatus: axiosError.response?.status,
        responseData: axiosError.response?.data
      });
      
      throw new Error(`S3 yükleme hatası: ${axiosError.message}`);
    }
  } catch (error: any) {
    console.error('Upload API: Hata oluştu:', error);
    
    let errorMessage = 'Dosya yüklenirken bir hata oluştu';
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;
      console.error('Hata detayları:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}
