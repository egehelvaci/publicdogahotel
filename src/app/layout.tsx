import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Hydration hatalarını önlemek için
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: "Doğa Hotel - Huzurun ve Konforun Yeni Adresi",
  description: "Doğa Hotel, doğanın kalbinde konforlu konaklama imkanı sunan, lüks odaları ve şık restoranları ile unutulmaz bir tatil deneyimi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" style={{margin: 0, padding: 0}}>
      <body style={{margin: 0, padding: 0}} className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        <main className="pt-0">
          {children}
        </main>
        <Toaster position="top-center" reverseOrder={false} />
        {/* Footer artık [lang] layout'ında tanımlanıyor, dil bilgisi ile birlikte */}
      </body>
    </html>
  );
}
