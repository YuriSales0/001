import Link from 'next/link'
import { HmLogo } from '@/components/hm/hm-logo'

export const metadata = { title: 'Privacy Policy — HostMasters' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--hm-ivory, #FAF8F4)' }}>
      <header className="border-b bg-white px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <HmLogo size={28} />
            <span className="font-semibold text-sm">Host<span style={{ color: '#B08A3E' }}>Masters</span></span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-800">Back to home</Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12 prose prose-gray prose-headings:font-serif">
        <h1>Privacy Policy</h1>
        <p className="lead">Last updated: April 2026</p>

        <h2>1. Data Controller</h2>
        <p>
          HostMasters Costa Tropical S.L. (&quot;HostMasters&quot;), Almuñécar, Granada, Spain.
          Contact: <a href="mailto:privacy@hostmasters.es">privacy@hostmasters.es</a>
        </p>

        <h2>2. Data We Collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, email, phone, language preference</li>
          <li><strong>Property data:</strong> address, photos, house rules, Smart Lock codes</li>
          <li><strong>Financial data:</strong> Stripe customer ID, payout history (we never store card numbers)</li>
          <li><strong>Guest data:</strong> name, nationality, ID number, check-in/out dates (required by Spanish law — SES/Registro de Viajeros)</li>
          <li><strong>Usage data:</strong> pages visited, feature usage, AI assistant conversations</li>
          <li><strong>Crew data:</strong> task completion records, photos, scores, payout history</li>
        </ul>

        <h2>3. Legal Basis (GDPR Art. 6)</h2>
        <ul>
          <li><strong>Contract performance:</strong> account management, payout processing, property management</li>
          <li><strong>Legal obligation:</strong> guest registration (SES), tax reporting (Modelo 179, IRNR)</li>
          <li><strong>Legitimate interest:</strong> platform security, fraud prevention, service improvement</li>
          <li><strong>Consent:</strong> marketing communications, AI-powered features, cookies</li>
        </ul>

        <h2>4. Data Processors</h2>
        <table>
          <thead><tr><th>Processor</th><th>Purpose</th><th>Location</th></tr></thead>
          <tbody>
            <tr><td>Stripe</td><td>Payments + Connect payouts</td><td>EU (Ireland)</td></tr>
            <tr><td>Vercel</td><td>Hosting + CDN</td><td>EU (Frankfurt)</td></tr>
            <tr><td>Neon</td><td>PostgreSQL database</td><td>EU</td></tr>
            <tr><td>Resend</td><td>Transactional email</td><td>EU</td></tr>
            <tr><td>Anthropic</td><td>AI features (Claude)</td><td>US (DPA in place)</td></tr>
            <tr><td>Sentry</td><td>Error tracking</td><td>EU</td></tr>
          </tbody>
        </table>

        <h2>5. Data Retention</h2>
        <ul>
          <li>Account data: until account deletion + 30 days</li>
          <li>Financial records: 6 years (Spanish fiscal obligation)</li>
          <li>Guest registration data: as required by SES regulations</li>
          <li>AI conversation logs: 90 days</li>
          <li>Notifications: 90 days (read) / 180 days (unread)</li>
        </ul>

        <h2>6. Your Rights</h2>
        <p>Under GDPR, you have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Rectify inaccurate data</li>
          <li>Erase your data (&quot;right to be forgotten&quot;)</li>
          <li>Restrict or object to processing</li>
          <li>Data portability</li>
          <li>Withdraw consent at any time</li>
        </ul>
        <p>
          To exercise these rights, email <a href="mailto:privacy@hostmasters.es">privacy@hostmasters.es</a>.
          You may also file a complaint with the Spanish Data Protection Authority (AEPD).
        </p>

        <h2>7. Cookies</h2>
        <p>
          We use essential cookies for authentication and language preference. Analytics cookies (Google Analytics)
          are only set with your consent. See our <Link href="/cookies">Cookie Policy</Link> for details.
        </p>

        <h2>8. International Transfers</h2>
        <p>
          Some processors (Anthropic) are based outside the EU. Transfers are covered by Standard Contractual
          Clauses (SCCs) and/or adequacy decisions where available.
        </p>

        <h2>9. Security</h2>
        <p>
          We implement TLS encryption, bcrypt password hashing, CSRF protection, rate limiting, and
          Content Security Policy headers. Access to personal data is restricted by role-based access control.
        </p>

        <h2>10. Changes</h2>
        <p>We may update this policy. Material changes will be communicated via email and in-app notification.</p>
      </main>
    </div>
  )
}
