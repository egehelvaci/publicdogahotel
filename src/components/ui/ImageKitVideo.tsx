'use client';

import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { isImageKitUrl, transformVideo } from '@/lib/imagekit';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface VideoProps {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string; // Video poster/thumbnail
}

// Video bileşeni - Tebi.io servisine uygun
const TebiVideo: React.FC<VideoProps> = ({ 
  src, 
  alt = "Video",
  width, 
  height, 
  className = "", 
  controls = false,
  autoPlay = false,
  loop = false,
  muted = false,
  poster
}) => {
  return (
    <video
      src={src}
      poster={poster}
      width={width}
      height={height}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      className={className}
    >
      <source src={src} type="video/mp4" />
      {alt && <p>{alt}</p>}
    </video>
  );
};

export default TebiVideo;

export interface ImageKitVideoProps {
  src: string;
  poster?: string;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  quality?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

export function ImageKitVideo({
  src,
  poster,
  width = '100%',
  height = 'auto',
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
  quality = 80,
  className = '',
  onLoad,
  onError,
  fallbackSrc,
}: ImageKitVideoProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>(src);
  const [posterSrc, setPosterSrc] = useState<string | undefined>(poster);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (!src) {
      setError(true);
      setLoading(false);
      return;
    }

    setVideoSrc(src);
    setPosterSrc(poster);
    setLoading(true);
    setError(false);

    // ImageKit URL'i optimize et
    if (isImageKitUrl(src)) {
      try {
        const optimizedSrc = transformVideo(src, {
          quality: quality,
        });
        setVideoSrc(optimizedSrc);
      } catch (err) {
        console.error("Video URL dönüştürme hatası:", err);
      }
    }

    // Poster URL'i varsa ve ImageKit ise, optimize et
    if (poster && isImageKitUrl(poster)) {
      try {
        const optimizedPoster = transformVideo(poster, {
          quality: quality,
        });
        setPosterSrc(optimizedPoster);
      } catch (err) {
        console.error("Poster URL dönüştürme hatası:", err);
      }
    }
  }, [src, poster, quality]);

  const handleVideoLoad = () => {
    setLoading(false);
    setError(false);
    if (onLoad) onLoad();
  };

  const handleVideoError = () => {
    setLoading(false);
    setError(true);
    if (onError) onError();

    // Yedek video kaynağı varsa ve hata oluşmuşsa, onu kullan
    if (fallbackSrc && videoSrc !== fallbackSrc) {
      setVideoSrc(fallbackSrc);
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
      
      {error && (!fallbackSrc || videoSrc === fallbackSrc) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Video yüklenemedi
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        width={width === "100%" ? "100%" : width}
        height={height}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        controls={controls}
        className={`${loading ? "opacity-0" : "opacity-100"} transition-opacity object-cover`}
        onLoadedData={handleVideoLoad}
        onError={handleVideoError}
        playsInline
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
} 