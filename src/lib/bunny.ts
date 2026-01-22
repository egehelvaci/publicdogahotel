import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import slugify from 'slugify';

// Bunny.net Storage için konfigürasyon
// Bunny.net S3-compatible API kullanır
// Edge Storage ile global CDN erişimi sağlar

// S3 protokolü için endpoint - storage.bunnycdn.com
const S3_ENDPOINT = "https://storage.bunnycdn.com";

// Storage Zone bilgileri - .env.local veya vercel.json'dan alınır
const STORAGE_ZONE_NAME = process.env.BUNNY_STORAGE_ZONE_NAME?.trim();
const STORAGE_ZONE_REGION = process.env.BUNNY_STORAGE_ZONE_REGION?.trim() || "de"; // Varsayılan: Almanya

// Kimlik bilgileri - çevre değişkenlerinden güvenli bir şekilde al
const BUNNY_ACCESS_KEY = process.env.BUNNY_ACCESS_KEY?.trim();
const BUNNY_PASSWORD = process.env.BUNNY_PASSWORD?.trim();

// Ortam değişkenlerini ayrıntılı olarak logla - sorun tespiti için
console.log('Bunny.net Konfigürasyon Detayları:', {
  endpoint: S3_ENDPOINT,
  storageZone: STORAGE_ZONE_NAME,
  region: STORAGE_ZONE_REGION,
  accessKeyProvided: !!BUNNY_ACCESS_KEY,
  passwordProvided: !!BUNNY_PASSWORD,
  accessKeyLength: BUNNY_ACCESS_KEY?.length,
  passwordLength: BUNNY_PASSWORD?.length,
});

// S3 istemcisi oluştur
const getS3Client = () => {
  // Kimlik bilgilerini kontrol et
  if (!BUNNY_ACCESS_KEY || !BUNNY_PASSWORD || !STORAGE_ZONE_NAME) {
    console.error("Bunny.net yapılandırma hatası: Eksik kimlik bilgileri");
    throw new Error("Bunny.net kimlik bilgileri eksik. Lütfen çevre değişkenlerini kontrol edin.");
  }
  
  // S3 istemcisi oluştur
  console.log("Bunny.net S3 bağlantısı hazırlanıyor");
  
  try {
    return new S3Client({
      region: STORAGE_ZONE_REGION,
      endpoint: `https://${STORAGE_ZONE_REGION}.storage.bunnycdn.com`,
      credentials: {
        accessKeyId: BUNNY_ACCESS_KEY,
        secretAccessKey: BUNNY_PASSWORD
      },
      forcePathStyle: false, // Bunny.net için false
      maxAttempts: 3 // Başarısızlık durumunda en fazla 3 deneme yap
    });
  } catch (error) {
    console.error("Bunny.net S3 istemcisi oluşturma hatası:", error);
    throw new Error("S3 istemcisi oluşturulamadı: " + 
      (error instanceof Error ? error.message : "Bilinmeyen hata"));
  }
};

// Dosyayı Bunny.net'e yükleme - sadece sunucu tarafında çalışır
export async function uploadToBunny(params: {
  file: File;
  maxSizeInBytes?: number;
  checkFileType?: boolean;
  allowedFileTypes?: string[];
  path: string;
}): Promise<{ success: boolean; fileUrl: string; message?: string }> {
  const { file, maxSizeInBytes, checkFileType, allowedFileTypes, path } = params;

  // Ortam değişkenlerini kontrol et
  const accessKey = process.env.BUNNY_ACCESS_KEY;
  const password = process.env.BUNNY_PASSWORD;
  const storageZone = process.env.BUNNY_STORAGE_ZONE_NAME;
  const region = process.env.BUNNY_STORAGE_ZONE_REGION || "de";

  console.log('Bunny Yükleme: Yapılandırma kontrol ediliyor', { 
    accessKeyExists: !!accessKey, 
    passwordExists: !!password,
    storageZone,
    region
  });

  if (!accessKey || !password || !storageZone) {
    console.error('Bunny Yükleme: Eksik ortam değişkenleri', { 
      accessKeyExists: !!accessKey, 
      passwordExists: !!password, 
      storageZoneExists: !!storageZone 
    });
    return {
      success: false,
      fileUrl: '',
      message: 'Depolama servisi yapılandırması eksik. Lütfen yöneticinize başvurun.'
    };
  }

  // Dosya boyutunu kontrol et
  if (maxSizeInBytes && file.size > maxSizeInBytes) {
    const maxSizeMB = Math.round(maxSizeInBytes / (1024 * 1024));
    return {
      success: false,
      fileUrl: '',
      message: `Dosya boyutu çok büyük. Maksimum dosya boyutu: ${maxSizeMB}MB`
    };
  }

  // Dosya türünü kontrol et
  if (checkFileType && allowedFileTypes && allowedFileTypes.length > 0) {
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedFileTypes.includes(fileType)) {
      return {
        success: false,
        fileUrl: '',
        message: `Desteklenmeyen dosya türü. İzin verilen dosya türleri: ${allowedFileTypes.join(', ')}`
      };
    }
  }

  // Dosya adını temizle
  const fileName = slugify(file.name, {
    replacement: '_',
    lower: true,
    strict: true,
    trim: true
  });

  try {
    // Dosyanın içerik türünü belirle
    let contentType = file.type;
    if (!contentType || contentType === 'application/octet-stream') {
      const extension = fileName.split('.').pop()?.toLowerCase();
      contentType = extension ? getMimeType(extension) : 'application/octet-stream';
    }

    console.log('Bunny Yükleme: Dosya bilgileri', { 
      fileName, 
      contentType, 
      fileSize: file.size, 
      uploadPath: path 
    });

    // S3 istemcisini yapılandır
    const s3Client = new S3Client({
      region: region,
      endpoint: `https://${region}.storage.bunnycdn.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: password
      },
      forcePathStyle: false
    });

    const fullPath = `${path}/${fileName}`;
    console.log(`Bunny Yükleme: Dosya yükleniyor... Tam yol: ${fullPath}`);

    // Dosyayı ArrayBuffer'a dönüştür
    const arrayBuffer = await file.arrayBuffer();
    const bodyBuffer = Buffer.from(arrayBuffer);

    // S3 komutunu oluştur
    const command = new PutObjectCommand({
      Bucket: storageZone,
      Key: fullPath,
      Body: bodyBuffer,
      ContentType: contentType
    });

    // Dosyayı yükle
    console.log('Bunny Yükleme: S3 komutu çalıştırılıyor...');
    console.log('Bunny Yükleme: Kullanılan Kimlik Bilgileri:', {
      storageZone: storageZone,
      region: region,
      accessKeyLength: accessKey.length,
      passwordLength: password.length,
      endpoint: `https://${region}.storage.bunnycdn.com`
    });
    
    const response = await s3Client.send(command);
    console.log('Bunny Yükleme: S3 yanıtı alındı', response);

    // CDN URL'i oluştur - Bunny.net CDN URL formatı
    const cdnHostname = process.env.BUNNY_CDN_HOSTNAME || `${storageZone}.b-cdn.net`;
    const fileUrl = `https://${cdnHostname}/${fullPath}`;
    console.log(`Bunny Yükleme: Başarılı! URL: ${fileUrl}`);

    return {
      success: true,
      fileUrl
    };
  } catch (error) {
    console.error('Bunny Yükleme: Hata oluştu', error);
    return {
      success: false,
      fileUrl: '',
      message: error instanceof Error ? error.message : 'Dosya yükleme sırasında beklenmeyen bir hata oluştu'
    };
  }
}

// Dosyayı Bunny.net'den silme
export const deleteFromBunny = async (fileId: string) => {
  try {
    // Kimlik bilgilerini yeniden kontrol et
    if (!BUNNY_ACCESS_KEY || !BUNNY_PASSWORD || !STORAGE_ZONE_NAME) {
      throw new Error('Bunny.net yapılandırması eksik. Lütfen çevre değişkenlerini kontrol edin.');
    }

    // FileId'yi güvenli hale getir
    const sanitizedFileId = fileId.replace(/[^a-zA-Z0-9-_/.]/g, '-');
    
    console.log('Bunny.net: Silme işlemi başlatılıyor', {
      dosyaYolu: sanitizedFileId
    });
    
    // S3 istemcisini oluştur
    const s3Client = getS3Client();
    
    // S3 silme komutu oluştur
    const command = new DeleteObjectCommand({
      Bucket: STORAGE_ZONE_NAME,
      Key: sanitizedFileId
    });
    
    // Silme işlemini gerçekleştir
    console.log('Bunny.net: S3 silme isteği gönderiliyor');
    const response = await s3Client.send(command);
    
    console.log('Bunny.net: Silme başarılı');
    
    // Başarılı dönüş
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Bunny.net Silme Hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata');
    
    // Hata dönüşü - hassas bilgiler olmadan
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// Dosya uzantısına göre MIME türü belirle
function getMimeType(extension: string): string {
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'ico': 'image/x-icon',
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}
