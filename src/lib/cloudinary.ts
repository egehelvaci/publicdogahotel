import { v2 as cloudinary } from 'cloudinary';

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cloudinary'ye dosya yükle
export async function uploadToCloudinary(file: Buffer, folder: string = 'dogahotel'): Promise<string> {
  return new Promise((resolve, reject) => {
    // Base64 formatına dönüştür
    const base64Data = file.toString('base64');
    const dataURI = `data:image/jpeg;base64,${base64Data}`;
    
    // Cloudinary'ye yükle
    cloudinary.uploader.upload(
      dataURI,
      {
        folder: folder,
        resource_type: 'auto',
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary yükleme hatası:', error);
          reject(error);
        } else {
          resolve(result?.secure_url || '');
        }
      }
    );
  });
}

export default cloudinary; 