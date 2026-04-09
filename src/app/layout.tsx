import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/components/providers";
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cookies } from 'next/headers'
import { SuperuserBar } from '@/components/hm/superuser-bar'
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
