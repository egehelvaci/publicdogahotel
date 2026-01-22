import slugify from 'slugify';

// Dosyayı Bunny.net'e yükleme (HTTP API)
export async function uploadToBunny(params: {
  file: File;
  maxSizeInBytes?: number;
  checkFileType?: boolean;
  allowedFileTypes?: string[];
  path: string;
}): Promise<{ success: boolean; fileUrl: string; message?: string }> {
  const { file, maxSizeInBytes, checkFileType, allowedFileTypes, path } = params;

  const storageZone = process.env.BUNNY_STORAGE_ZONE;
  const password = process.env.BUNNY_STORAGE_PASSWORD;
  const cdnHostname = process.env.BUNNY_CDN_HOSTNAME;

  if (!storageZone || !password) {
    console.error('Bunny: Eksik ortam degiskenleri');
    return {
      success: false,
      fileUrl: '',
      message: 'Depolama servisi yapilandirmasi eksik.'
    };
  }

  // Dosya boyutunu kontrol et
  if (maxSizeInBytes && file.size > maxSizeInBytes) {
    const maxSizeMB = Math.round(maxSizeInBytes / (1024 * 1024));
    return {
      success: false,
      fileUrl: '',
      message: `Dosya boyutu cok buyuk. Maksimum: ${maxSizeMB}MB`
    };
  }

  // Dosya türünü kontrol et
  if (checkFileType && allowedFileTypes && allowedFileTypes.length > 0) {
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedFileTypes.includes(fileType)) {
      return {
        success: false,
        fileUrl: '',
        message: `Desteklenmeyen dosya turu. Izin verilenler: ${allowedFileTypes.join(', ')}`
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
    let contentType = file.type;
    if (!contentType || contentType === 'application/octet-stream') {
      const extension = fileName.split('.').pop()?.toLowerCase();
      contentType = extension ? getMimeType(extension) : 'application/octet-stream';
    }

    const fullPath = `${path}/${fileName}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Bunny HTTP API ile yükle
    const uploadUrl = `https://storage.bunnycdn.com/${storageZone}/${fullPath}`;
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'AccessKey': password,
        'Content-Type': contentType,
      },
      body: buffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bunny upload error:', response.status, errorText);
      return {
        success: false,
        fileUrl: '',
        message: `Yukleme hatasi: ${response.status}`
      };
    }

    const fileUrl = `https://${cdnHostname || `${storageZone}.b-cdn.net`}/${fullPath}`;
    
    return {
      success: true,
      fileUrl
    };
  } catch (error) {
    console.error('Bunny Yukleme Hatasi:', error);
    return {
      success: false,
      fileUrl: '',
      message: error instanceof Error ? error.message : 'Dosya yukleme hatasi'
    };
  }
}

// Dosyayı Bunny.net'den silme
export const deleteFromBunny = async (fileId: string) => {
  try {
    const storageZone = process.env.BUNNY_STORAGE_ZONE;
    const password = process.env.BUNNY_STORAGE_PASSWORD;

    if (!storageZone || !password) {
      throw new Error('Bunny yapilandirmasi eksik.');
    }

    const sanitizedFileId = fileId.replace(/[^a-zA-Z0-9-_/.]/g, '-');
    const deleteUrl = `https://storage.bunnycdn.com/${storageZone}/${sanitizedFileId}`;
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'AccessKey': password
      }
    });

    if (!response.ok) {
      throw new Error(`Silme hatasi: ${response.status}`);
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Bunny Silme Hatasi:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// MIME türü belirle
function getMimeType(extension: string): string {
  const types: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'pdf': 'application/pdf',
  };
  return types[extension] || 'application/octet-stream';
}
