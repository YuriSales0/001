import type { Metadata } from "next";
import { Inter_Tight, Cormorant_Garamond } from 'next/font/google'
import { Providers } from "@/components/providers";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'
import { SuperuserBar } from '@/components/hm/superuser-bar'
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
  title: "Hostmaster — Costa Tropical Property Management",
  description:
    "Professional short-term rental management on the Costa Tropical. Mastering your coastal stay — bookings, finances, maintenance and 24/7 care for international owners.",
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
      </body>
    </html>
  );
}
