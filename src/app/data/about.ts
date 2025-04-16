import fs from 'fs';
import path from 'path';

// Veri dosyasının yolu
const dataFilePath = path.join(process.cwd(), 'src', 'app', 'data', 'json', 'aboutData.json');

// Alternatif dosya yolu - kökten başlayarak
const altDataFilePath = path.join(process.cwd(), 'src/app/data/json/aboutData.json');

// About veri tipi
export interface AboutData {
  heroImage: string;
  mainImage: string;
  titleTR: string;
  titleEN: string;
  subtitleTR: string;
  subtitleEN: string;
  contentTR: string[];
  contentEN: string[];
  features: {
    id: string;
    iconName: string;
    titleTR: string;
    titleEN: string;
    descriptionTR: string;
    descriptionEN: string;
  }[];
  badgesTR: string[];
  badgesEN: string[];
}

// JSON dosyasını oku
export function readAboutData(): AboutData {
  try {
    let fileContent;
    
    try {
      fileContent = fs.readFileSync(dataFilePath, 'utf8');
    } catch (err) {
      console.log('İlk dosya yolu başarısız, alternatif deneniyor:', err);
      fileContent = fs.readFileSync(altDataFilePath, 'utf8');
    }
    
    console.log('About verisi okundu');
    return JSON.parse(fileContent) as AboutData;
  } catch (error) {
    console.error('Hakkımızda verisi okunamadı:', error);
    throw new Error('Hakkımızda verisi okunamadı');
  }
}

// JSON dosyasına yaz
export function writeAboutData(data: AboutData): void {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(dataFilePath, jsonData, 'utf8');
  } catch (error) {
    console.error('Hakkımızda verisi yazılamadı:', error);
    throw new Error('Hakkımızda verisi yazılamadı');
  }
}

// Hakkımızda verisini güncelle
export function updateAboutData(updatedData: Partial<AboutData>): AboutData {
  try {
    const currentData = readAboutData();
    const newData = { ...currentData, ...updatedData };
    writeAboutData(newData);
    return newData;
  } catch (error) {
    console.error('Hakkımızda verisi güncellenemedi:', error);
    throw new Error('Hakkımızda verisi güncellenemedi');
  }
}

// Resim yükleme fonksiyonu
export function saveUploadedImage(base64Image: string, fileName: string): string {
  try {
    // Base64 formatını işle
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // images/aboutus klasörünü kontrol et, yoksa oluştur
    const uploadsDir = path.join(process.cwd(), 'public', 'images', 'aboutus');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Dosya adını oluştur ve kaydet
    const uniqueFileName = `${Date.now()}-${fileName}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    
    fs.writeFileSync(filePath, buffer);
    
    // Web'den erişilebilir yolu döndür
    return `/images/aboutus/${uniqueFileName}`;
  } catch (error) {
    console.error('Resim kaydedilemedi:', error);
    throw new Error('Resim kaydedilemedi');
  }
} 