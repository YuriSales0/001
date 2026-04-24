import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/careers', '/privacy', '/terms', '/beta'],
        disallow: [
          '/api/',
          '/admin/',
          '/(admin)/',
          '/client/',
          '/manager/',
          '/(manager)/',
          '/crew/',
          '/dashboard/',
          '/me',
          '/onboarding/',
          '/setup/',
          '/stay/',
          '/feedback/',
          '/partner/',
          '/profile',
          '/superuser/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
