import type { Metadata } from "next";
import { Inter_Tight, Cormorant_Garamond } from 'next/font/google'
import { Providers } from "@/components/providers";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'
import { SuperuserBar } from '@/components/hm/superuser-bar'
import { CookieBanner } from '@/components/hm/cookie-banner'
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'https://hostmasters.es'),
  title: "HostMasters — Costa Tropical Property Management",
  description:
    "Professional short-term rental management on the Costa Tropical. Inspections, cleaning, maintenance, contracts, monthly returns.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'HostMasters — Costa Tropical Property Management',
    description: 'Professional short-term rental management on the Costa Tropical. AI pricing, voice feedback, fiscal compliance.',
    url: process.env.NEXTAUTH_URL || 'https://hostmasters.es',
    siteName: 'HostMasters',
    locale: 'en_GB',
    type: 'website',
    images: [{ url: '/icon.svg', width: 512, height: 512, alt: 'HostMasters' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HostMasters — Costa Tropical Property Management',
    description: 'Professional short-term rental management on the Costa Tropical.',
    images: ['/icon.svg'],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions)
  const isSuperUser = (session?.user as { isSuperUser?: boolean })?.isSuperUser === true

  let viewAs: { userId: string; name: string | null; role: string } | null = null
  if (isSuperUser) {
    const raw = cookies().get('hm_view_as')?.value
    if (raw) {
      try {
        viewAs = JSON.parse(raw)
      } catch {}
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.svg" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} />
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
              gtag('js',new Date());
              gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');
              gtag('config','G-61YMZ4P4MT');
              gtag('config','G-GE38PW30QQ');
            `}} />
          </>
        )}
        {!process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src="https://www.googletagmanager.com/gtag/js?id=G-61YMZ4P4MT" />
            <script dangerouslySetInnerHTML={{ __html: `
              window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
              gtag('js',new Date());
              gtag('config','G-61YMZ4P4MT');
              gtag('config','G-GE38PW30QQ');
            `}} />
          </>
        )}
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <script dangerouslySetInnerHTML={{ __html: `
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${process.env.NEXT_PUBLIC_META_PIXEL_ID}');fbq('track','PageView');
          `}} />
        )}
      </head>
      <body
        className={`${interTight.variable} ${cormorant.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        {isSuperUser && (
          <SuperuserBar
            realUser={{
              name: (session?.user as { name?: string | null })?.name ?? null,
              email: session?.user?.email ?? '',
            }}
            viewAs={viewAs}
          />
        )}
        <CookieBanner />
      </body>
    </html>
  );
}
