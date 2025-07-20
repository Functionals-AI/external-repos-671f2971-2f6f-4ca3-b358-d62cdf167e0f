import 'styles/globals.css';
import { Atkinson_Hyperlegible } from 'next/font/google';
import I18nProvider from './i18n-provider';

const atkinsonFont = Atkinson_Hyperlegible({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-atkinson',
});

import { Metadata } from 'next';
import Script from 'next/script';
import { ModalManager, ModalProvider } from '@/modules/modal';
import { Toaster } from 'react-hot-toast';
import { DrawerManager, DrawerProvider } from '@/modules/drawer';
import { cn } from '@/utils';
import TempAppStateWrapper from './temp-app-state-wrapper';
import { UseFetchCacheProvider } from 'hooks/useFetch/context';
import LanguageHandler from './language-provider';
import { FeatureFlagsProvider } from '@/modules/feature-flag';
import { TimezoneProvider } from '@/modules/dates/context';
import { PiiManagerProvider } from '@/modules/pii-manager/context';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID; // Google Analytics Measurement ID

export const metadata: Metadata = {
  title: 'Foodsmart Scheduling App',
  description: 'Foodsmart Scheduling App',
  other: {
    'google-site-verification': 'kaSV19Kwk8vr2w8-fdoHZClx4medsJRnk5vq0cs8Mww',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn('h-full bg-white', atkinsonFont.className)}>
      {/* <!-- Google Analytics Tags -->  */}
      <Script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} />
      <Script id="google-analytics-v4" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { 'send_page_view': false });
          `}
      </Script>
      {/* <!-- End Google Analytics Tags --> */}

      <meta name="app-version" content={process.env.NEXT_PUBLIC_VERSION || 'unknown'}></meta>

      {/* Todo remove TempAppStateWrapper when possible */}
      <I18nProvider>
        <TimezoneProvider>
          <UseFetchCacheProvider>
            <FeatureFlagsProvider>
              <ModalProvider>
                <TempAppStateWrapper>
                  <LanguageHandler>
                    <PiiManagerProvider>
                      <DrawerProvider>
                        <body className="h-full">
                          <ModalManager />
                          <DrawerManager />
                          <Toaster position="top-right" />
                          {children}
                        </body>
                      </DrawerProvider>
                    </PiiManagerProvider>
                  </LanguageHandler>
                </TempAppStateWrapper>
              </ModalProvider>
            </FeatureFlagsProvider>
          </UseFetchCacheProvider>
        </TimezoneProvider>
      </I18nProvider>
    </html>
  );
}
