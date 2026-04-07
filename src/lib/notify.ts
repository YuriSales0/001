import { prisma } from './prisma'
import { sendEmail } from './email'

/**
 * Notify all ADMIN users about a system event.
 * Creates an in-app notification record AND sends an email if Resend is configured.
 */
export async function notifyAdmin({ subject, message }: { subject: string; message: string }) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true, email: true },
    })

    // Persist in Notification table if it exists (best-effort)
    try {
      // @ts-expect-error — notification model may not exist yet
      if (prisma.notification) {
        // @ts-expect-error dynamic access
        await prisma.notification.createMany({
          data: admins.map(a => ({ userId: a.id, title: subject, body: message })),
        })
      }
    } catch {
      /* ignore */
    }

    // Email (best-effort; failures are logged but don't throw)
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'placeholder') {
      for (const a of admins) {
        try {
          await sendEmail({
            to: a.email,
            subject: `[Hostmaster] ${subject}`,
            html: `<pre style="font-family:sans-serif;white-space:pre-wrap">${message}</pre>`,
          })
        } catch (e) {
          console.error('notifyAdmin email failed:', e)
        }
      }
    } else {
      console.log(`[notify] ${subject}\n${message}`)
    }
  } catch (e) {
    console.error('notifyAdmin error:', e)
  }
}
