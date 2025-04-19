import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * İstemci tarafında çalışıp çalışmadığını kontrol eden yardımcı fonksiyon
 */
export const isClient = typeof window !== 'undefined';

/**
 * Sunucu tarafında çalışıp çalışmadığını kontrol eden yardımcı fonksiyon
 */
export const isServer = typeof window === 'undefined';

/**
 * Tüm ortamlarda (Vercel, geliştirme vb.) çalışacak şekilde temel URL'yi döndürür
 */
export function getBaseUrl(): string {
  // İstemci tarafında
  if (!isServer) {
    return window.location.origin;
  }
  
  // Vercel ortamında
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Özel alan adı
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  
  // Geliştirme ortamı
  return 'http://localhost:3000';
}

/**
 * Verilen yola tam URL döndürür
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * API URL'lerini oluşturur (hem sunucu hem istemci tarafında çalışır)
 */
export function getApiUrl(endpoint: string, params?: Record<string, string>): string {
  const baseUrl = getBaseUrl();
  let url = `${baseUrl}/api/${endpoint}`;
  
  // Query parametrelerini ekle
  if (params && Object.keys(params).length > 0) {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    // Cache'i önlemek için timestamp ekle
    queryParams.append('t', Date.now().toString());
    
    url = `${url}?${queryParams.toString()}`;
  } else {
    // Sadece timestamp ekle
    url = `${url}?t=${Date.now()}`;
  }
  
  return url;
}

/**
 * Sadece istemci tarafında çalışmasını sağlamak için wrapper fonksiyon
 * @param callback İstemci tarafında çalıştırılacak fonksiyon
 */
export function runOnClient<T>(callback: () => T, fallback: T): T {
  if (isClient) {
    return callback();
  }
  return fallback;
}

/**
 * LocalStorage'e güvenli erişim için yardımcı fonksiyon
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    return runOnClient(() => localStorage.getItem(key), null);
  },
  setItem: (key: string, value: string): void => {
    runOnClient(() => localStorage.setItem(key, value), undefined);
  },
  removeItem: (key: string): void => {
    runOnClient(() => localStorage.removeItem(key), undefined);
  },
  clear: (): void => {
    runOnClient(() => localStorage.clear(), undefined);
  }
};

/**
 * SessionStorage'e güvenli erişim için yardımcı fonksiyon
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    return runOnClient(() => sessionStorage.getItem(key), null);
  },
  setItem: (key: string, value: string): void => {
    runOnClient(() => sessionStorage.setItem(key, value), undefined);
  },
  removeItem: (key: string): void => {
    runOnClient(() => sessionStorage.removeItem(key), undefined);
  },
  clear: (): void => {
    runOnClient(() => sessionStorage.clear(), undefined);
  }
};

/**
 * Document API'ye güvenli erişim için yardımcı fonksiyon
 */
export const safeDocument = {
  querySelector: <T extends Element>(selector: string): T | null => {
    return runOnClient(() => document.querySelector<T>(selector), null);
  },
  getElementById: (id: string): HTMLElement | null => {
    return runOnClient(() => document.getElementById(id), null);
  },
  createElement: <K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K] | null => {
    return runOnClient(() => document.createElement(tagName), null);
  }
};

/**
 * Window API'ye güvenli erişim için yardımcı fonksiyon
 */
export const safeWindow = {
  getLocation: (): Location | null => {
    return runOnClient(() => window.location, null);
  },
  getNavigator: (): Navigator | null => {
    return runOnClient(() => window.navigator, null);
  },
  getHistory: (): History | null => {
    return runOnClient(() => window.history, null);
  },
  getOrigin: (): string => {
    return runOnClient(() => window.location.origin, getBaseUrl());
  },
  addEventListener: <K extends keyof WindowEventMap>(
    type: K, 
    listener: (ev: WindowEventMap[K]) => any
  ): void => {
    runOnClient(() => window.addEventListener(type, listener), undefined);
  },
  removeEventListener: <K extends keyof WindowEventMap>(
    type: K, 
    listener: (ev: WindowEventMap[K]) => any
  ): void => {
    runOnClient(() => window.removeEventListener(type, listener), undefined);
  }
}; 