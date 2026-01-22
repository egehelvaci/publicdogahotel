import { NextRequest, NextResponse } from 'next/server';
import { uploadToBunny } from '../../../../lib/bunny';

export const dynamic = 'force-dynamic';

// Maksimum dosya boyutu (görseller için 30MB, videolar için 100MB)
const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    console.log('Test API: Dosya alınıyor...');
    
    // Form verisini al
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'test';
    
    // Dosya kontrolü
    if (!file) {
      console.error('Test API: Dosya bulunamadı');
      return NextResponse.json(
        { success: false, message: 'Dosya yüklenemedi' },
        { status: 400 }
      );
    }
    
    console.log(`Test API: Dosya bilgileri - İsim: ${file.name}, Boyut: ${file.size}, Tür: ${file.type}`);
    
    // Dosya tipini kontrol et
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    
    // Dosya boyutu kontrolü
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      console.error(`Test API: Dosya boyutu çok büyük: ${file.size} bytes (max: ${maxSize} bytes)`);
      return NextResponse.json(
        { 
          success: false, 
          message: `Dosya boyutu çok büyük. ${isVideo ? 'Videolar için maksimum 100MB' : 'Görseller için maksimum 30MB'} desteklenir.` 
        },
        { status: 400 }
      );
    }
    
    // Dosyayı ArrayBuffer'a dönüştür
    const buffer = await file.arrayBuffer();
    const fileName = file.name.replace(/\s+/g, '-').toLowerCase();
    
    console.log(`Test API: ${fileName} yükleniyor...`);
    
    // Bunny.net yapılandırmasını kontrol et
    const accessKey = process.env.BUNNY_ACCESS_KEY;
    const password = process.env.BUNNY_PASSWORD;
    const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
    
    // Detaylı yapılandırma bilgilerini logla (hata ayıklama için)
    console.log('Test API: Bunny.net yapılandırması (DETAYLI):', { 
      accessKey: accessKey ? accessKey.substring(0, 5) + '...' : 'tanımlanmamış',
      accessKeyLength: accessKey?.length,
      password: password ? password.substring(0, 5) + '...' : 'tanımlanmamış',
      passwordLength: password?.length,
      storageZone: storageZone || 'tanımlanmamış',
    });
    
    // Ortam değişkenleri ayarlı değilse hata ver
    if (!accessKey || !password || !storageZone) {
      console.error('Test API: Bunny.net yapılandırması eksik');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Dosya yükleme servisi yapılandırması eksik',
          error: 'CONFIGURATION_MISSING'
        },
        { status: 500 }
      );
    }
    
    console.log('Test API: Etkin yapılandırma:', {
      accessKey: accessKey.substring(0, 5) + '...',
      password: password.substring(0, 5) + '...',  
      storageZone
    });
    
    try {
      // Bunny.net'e yükle
      console.log('Test API: Bunny.net yükleme işlemi başlatılıyor...');
      
      // File nesnesini oluşturmadan önce detaylı log
      console.log('Test API: Dosya bilgileri (yükleme öncesi):', {
        fileName,
        fileType: file.type,
        fileSize: file.size,
        bufferSize: buffer.byteLength
      });

      const fileObj = new File([Buffer.from(buffer)], fileName, { type: file.type });
      console.log('Test API: File nesnesi oluşturuldu:', {
        name: fileObj.name,
        type: fileObj.type,
        size: fileObj.size
      });
      
      const result = await uploadToBunny({
        file: fileObj,
        path: folder
      });
      
      // Yanıtın tüm detaylarını inceleme
      console.log('Test API: uploadToBunny yanıtı (ham):', JSON.stringify(result));
      
      // URL kontrolü
      if (!result.fileUrl) {
        console.error('Test API: URL eksik!');
        return NextResponse.json(
          {
            success: false,
            message: 'Dosya yüklendi ancak URL bilgisi alınamadı',
            debug: result,
            error: 'URL_MISSING'
          },
          { status: 500 }
        );
      }
      
      console.log('Test API: Yükleme başarılı!', {
        url: result.fileUrl
      });
      
      // Başarılı yanıt döndür
      return NextResponse.json({
        success: true,
        message: 'Dosya başarıyla yüklendi',
        url: result.fileUrl
      });
    } catch (uploadError) {
      console.error('Test API: Bunny.net yükleme hatası:', uploadError);
      
      let errorMessage = 'Dosya yüklenirken bir hata oluştu';
      
      if (uploadError instanceof Error) {
        errorMessage = `Dosya yüklenirken bir hata oluştu: ${uploadError.message}`;
        console.error('Test API: Hata detayları:', {
          name: uploadError.name,
          message: uploadError.message,
          stack: uploadError.stack
        });
      } else if (typeof uploadError === 'object' && uploadError !== null) {
        // Obje tipindeki hatalar
        console.error('Test API: Hata obje içeriği:', JSON.stringify(uploadError));
        if ('error' in uploadError) {
          errorMessage = `Dosya yüklenirken bir hata oluştu: ${uploadError.error}`;
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          error: 'UPLOAD_FAILED',
          debug: typeof uploadError === 'object' ? uploadError : { message: String(uploadError) }
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test API: Genel hata:', error);
    
    let errorMessage = 'Dosya yüklenirken bilinmeyen bir hata oluştu';
    let errorDetails = {};
    
    // Hata detaylarını kaydet
    if (error instanceof Error) {
      errorMessage = `Dosya yüklenirken bir hata oluştu: ${error.message}`;
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      };
      console.error('Test API: Detaylı hata bilgisi:', errorDetails);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: errorMessage,
        error: 'GENERAL_ERROR',
        debug: errorDetails
      },
      { status: 500 }
    );
  }
} 