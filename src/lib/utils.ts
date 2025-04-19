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
export const isServer = !isClient;

/**
 * Doğru base URL'yi ortama göre belirleyen merkezi fonksiyon
 */
export function getBaseUrl(): string {
  // Vercel ortamı kontrolü - VERCEL değişkeni
  if (process.env.VERCEL === '1') {
    // VERCEL_URL'i kullan - Vercel tarafından otomatik sağlanır
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Deploy edilmiş production domain
    if (process.env.NEXT_PUBLIC_DOMAIN) {
      return `https://${process.env.NEXT_PUBLIC_DOMAIN}`;
    }
  }
  
  // Tarayıcı ortamında
  if (isClient) {
    return window.location.origin;
  }
  
  // Geliştirme ortamında
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // Fallback olarak NEXT_PUBLIC_DOMAIN veya localhost
  return process.env.NEXT_PUBLIC_DOMAIN 
    ? `https://${process.env.NEXT_PUBLIC_DOMAIN}`
    : 'http://localhost:3000';
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