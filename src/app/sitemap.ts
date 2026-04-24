import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: APP_URL,             lastModified: now, changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${APP_URL}/careers`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${APP_URL}/privacy`, lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/terms`,   lastModified: now, changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${APP_URL}/login`,    lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
    { url: `${APP_URL}/register`, lastModified: now, changeFrequency: 'yearly',  priority: 0.2 },
  ]
}
