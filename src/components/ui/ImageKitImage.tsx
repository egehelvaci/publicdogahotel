'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { isImageKitUrl, transformImage } from '@/lib/imagekit';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ImageKitImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  quality?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  fallbackSrc?: string;
}

export default function ImageKitImage({
  src,
  alt,
  width = 800,
  height = 600,
  quality = 80,
  className = "",
  onLoad,
  onError,
  priority = false,
  sizes,
  fallbackSrc = "/images/fallback.jpg",
}: ImageKitImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>(src);

  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    setImgSrc(src);
    setLoading(true);
    setError(false);

    // ImageKit URL'i optimize et
    if (isImageKitUrl(src)) {
      const optimizedSrc = transformImage(src, {
        width: typeof width === "number" ? width : undefined,
        height: typeof height === "number" ? height : undefined,
        quality: quality,
        format: "auto"
      });
      setImgSrc(optimizedSrc);
    }
  }, [src, width, height, quality]);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
    if (onError) onError();
    if (fallbackSrc && imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <div className={`relative ${className}`} style={{ 
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      overflow: 'hidden'
    }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      {error && imgSrc === fallbackSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Resim yüklenemedi
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <Image
        src={imgSrc}
        alt={alt}
        width={typeof width === "number" ? width : 800}
        height={typeof height === "number" ? height : 600}
        className={`${loading ? "opacity-0" : "opacity-100"} transition-opacity object-cover`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        priority={priority}
        sizes={sizes}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
} 