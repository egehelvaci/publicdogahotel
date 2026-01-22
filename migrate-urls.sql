-- Tebi URL'lerini Bunny.net URL'leriyle değiştirme SQL Script'i
-- Bu script'i pgAdmin, psql veya Neon.tech SQL Editor'de çalıştırabilirsiniz

-- ÖNCE KONTROL: Kaç adet Tebi URL'si var?
SELECT 'about' as table_name, 'image_url' as column_name, COUNT(*) as count FROM about WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'about_sections', 'image_url', COUNT(*) FROM about_sections WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'slider', 'image_url', COUNT(*) FROM slider WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'slider', 'video_url', COUNT(*) FROM slider WHERE video_url LIKE '%tebi.io%'
UNION ALL
SELECT 'gallery', 'image_url', COUNT(*) FROM gallery WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'gallery', 'video_url', COUNT(*) FROM gallery WHERE video_url LIKE '%tebi.io%'
UNION ALL
SELECT 'services', 'main_image_url', COUNT(*) FROM services WHERE main_image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'service_gallery', 'image_url', COUNT(*) FROM service_gallery WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'rooms', 'main_image_url', COUNT(*) FROM rooms WHERE main_image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'room_gallery', 'image_url', COUNT(*) FROM room_gallery WHERE image_url LIKE '%tebi.io%';

-- GÜNCELLEME İŞLEMLERİ
-- Her tablo için URL'leri güncelleyin

-- 1. about tablosu
UPDATE about
SET image_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(image_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE image_url LIKE '%tebi.io%';

-- 2. about_sections tablosu
UPDATE about_sections
SET image_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(image_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE image_url LIKE '%tebi.io%';

-- 3. slider tablosu - image_url
UPDATE slider
SET image_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(image_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE image_url LIKE '%tebi.io%';

-- 4. slider tablosu - video_url
UPDATE slider
SET video_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(video_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE video_url LIKE '%tebi.io%';

-- 5. gallery tablosu - image_url
UPDATE gallery
SET image_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(image_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE image_url LIKE '%tebi.io%';

-- 6. gallery tablosu - video_url
UPDATE gallery
SET video_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(video_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE video_url LIKE '%tebi.io%';

-- 7. services tablosu
UPDATE services
SET main_image_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(main_image_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE main_image_url LIKE '%tebi.io%';

-- 8. service_gallery tablosu
UPDATE service_gallery
SET image_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(image_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE image_url LIKE '%tebi.io%';

-- 9. rooms tablosu
UPDATE rooms
SET main_image_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(main_image_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE main_image_url LIKE '%tebi.io%';

-- 10. room_gallery tablosu
UPDATE room_gallery
SET image_url = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(image_url, 'https://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'),
      'http://dogahotelfethiye.s3.tebi.io', 'https://oludenizdogahotel.b-cdn.net'
    ),
    'https://s3.tebi.io/dogahotelfethiye', 'https://oludenizdogahotel.b-cdn.net'
  ),
  'dogahotelfethiye.s3.tebi.io', 'oludenizdogahotel.b-cdn.net'
)
WHERE image_url LIKE '%tebi.io%';

-- FİNAL KONTROL: Güncelleme sonrası kontrol
SELECT 'about' as table_name, 'image_url' as column_name, COUNT(*) as remaining_tebi_urls FROM about WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'about_sections', 'image_url', COUNT(*) FROM about_sections WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'slider', 'image_url', COUNT(*) FROM slider WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'slider', 'video_url', COUNT(*) FROM slider WHERE video_url LIKE '%tebi.io%'
UNION ALL
SELECT 'gallery', 'image_url', COUNT(*) FROM gallery WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'gallery', 'video_url', COUNT(*) FROM gallery WHERE video_url LIKE '%tebi.io%'
UNION ALL
SELECT 'services', 'main_image_url', COUNT(*) FROM services WHERE main_image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'service_gallery', 'image_url', COUNT(*) FROM service_gallery WHERE image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'rooms', 'main_image_url', COUNT(*) FROM rooms WHERE main_image_url LIKE '%tebi.io%'
UNION ALL
SELECT 'room_gallery', 'image_url', COUNT(*) FROM room_gallery WHERE image_url LIKE '%tebi.io%';

-- ÖRNEK URL'LERİ KONTROL ET (Bunny formatında olmalı)
SELECT 'gallery - image_url' as source, image_url FROM gallery WHERE image_url IS NOT NULL LIMIT 3;
SELECT 'slider - image_url' as source, image_url FROM slider WHERE image_url IS NOT NULL LIMIT 3;
