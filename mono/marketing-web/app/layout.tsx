import './globals.css'
import Script from 'next/script'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const interTypefaceLoader = Inter({ subsets: ['latin'] })
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID; // Google Analytics Measurement ID

const title = 'Foodsmart | Personalized Telehealth Nutrition Solution'
const description = `With the largest national network of registered dietitians, we've helped over 1.5 million members improve their health with personalized nutrition guidance from the comfort of their own home.`

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL('https://foodsmart.com'),
  openGraph: {
    title,
    description,
    images: ['https://img.plasmic.app/img-optimizer/v1/img/ccb128a5e2bc70b4467424866fd82c99.jpg']
  }
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive"/>
        <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', { 'send_page_view': false });
        `}
        </Script>
      </head>
      <body className={interTypefaceLoader.className}>{children}</body>
    </html>
  )
}
