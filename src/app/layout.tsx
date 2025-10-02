// app/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Inter, Roboto_Mono } from 'next/font/google';
import { JunoProvider } from '../context/JunoContext';
import { AuthProvider } from '../context/AuthContext';
import { WaqfProvider } from '../providers/WaqfProvider';
import { Toaster } from 'react-hot-toast';
import { ScrollProgress } from '@/components/ScrollProgress';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DevModeSwitcher } from '@/components/DevModeSwitcher';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const robotoMono = Roboto_Mono({ subsets: ['latin'], variable: '--font-roboto-mono' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();
  
  // Hide header/footer in admin, waqf dashboards, and auth pages
  const hideHeaderFooter = pathname?.startsWith('/admin') || 
                           pathname?.startsWith('/waqf') || 
                           pathname?.startsWith('/auth');

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <JunoProvider>
          <AuthProvider>
            <WaqfProvider>
              <div className="min-h-screen flex flex-col">
                <ScrollProgress />
                {!hideHeaderFooter && <Header />}
                <main className="flex-1">
                  {isHydrated ? children : <div id="root-loading">{children}</div>}
                </main>
                {!hideHeaderFooter && <Footer />}
                <DevModeSwitcher />
              </div>
            </WaqfProvider>
          </AuthProvider>
        </JunoProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}