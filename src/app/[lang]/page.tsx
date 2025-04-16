import React from 'react';
import HomePage from './HomePage';

export const runtime = 'nodejs';

// Revalidate etiketi - her istekte yeni veri al
export const revalidate = 0;

type PageProps = {
  params: {
    lang: string;
  };
};

// Next.js 15'te, params'a erişim için önce params nesnesini await etmeliyiz
export default async function Page({ params }: PageProps) {
  // Önce tüm params nesnesini await et
  const resolvedParams = await params;
  const lang = resolvedParams.lang || 'tr';
  
  return <HomePage lang={lang} />;
} 