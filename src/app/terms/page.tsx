import Link from 'next/link'
import { HmLogo } from '@/components/hm/hm-logo'

export const metadata = { title: 'Terms of Use — HostMasters' }

export default function TermsPage() {
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
        <h1>Terms of Use</h1>
        <p className="lead">Last updated: April 2026</p>

        <h2>1. About HostMasters</h2>
        <p>
          HostMasters Costa Tropical S.L. operates a property management platform connecting property owners,
          managers, and operational crew for short-term rental management on the Costa Tropical, Spain.
        </p>

        <h2>2. Account Registration</h2>
        <ul>
          <li>You must provide accurate, complete information during registration.</li>
          <li>You are responsible for maintaining the confidentiality of your password.</li>
          <li>You must be at least 18 years old to create an account.</li>
          <li>One account per person. Shared accounts are not permitted.</li>
        </ul>

        <h2>3. Platform Roles</h2>
        <p>Users are assigned one of four roles, each with distinct rights and obligations:</p>
        <ul>
          <li><strong>Client (Property Owner):</strong> enrolls properties for rental management under a chosen subscription plan.</li>
          <li><strong>Manager:</strong> independent contractor who acquires and manages client relationships within an assigned territory.</li>
          <li><strong>Crew:</strong> independent contractor who executes operational tasks (cleaning, check-in/out, maintenance).</li>
          <li><strong>Admin:</strong> HostMasters staff with full platform access.</li>
        </ul>

        <h2>4. Subscription Plans &amp; Payments</h2>
        <ul>
          <li>Clients choose a plan (Starter, Basic, Mid, Premium) with different commission rates and monthly fees.</li>
          <li>Payments are processed via Stripe. HostMasters does not store payment card details.</li>
          <li>Subscription fees are non-refundable for the current billing period.</li>
          <li>Plan changes take effect on the next billing cycle.</li>
          <li>Cancellation requires 60 days written notice as per the Master Service Agreement.</li>
        </ul>

        <h2>5. Property Requirements</h2>
        <p>Property owners must ensure:</p>
        <ul>
          <li>Valid VUT tourist license (Vivienda de Uso Turístico)</li>
          <li>Valid energy certificate (Certificado de Eficiencia Energética)</li>
          <li>Compatible Smart Lock installed for secure guest/crew access</li>
          <li>Appropriate insurance coverage (civil liability minimum)</li>
          <li>Property maintained in safe, habitable condition</li>
        </ul>

        <h2>6. Independent Contractors</h2>
        <p>
          Managers and Crew members operate as independent contractors (autónomos) registered in Spain.
          HostMasters is not their employer and does not provide employment benefits, social security,
          or tax withholding. Each contractor is responsible for their own fiscal obligations.
        </p>

        <h2>7. Intellectual Property</h2>
        <p>
          The HostMasters platform, including its software, design, branding, and AI systems, is the
          intellectual property of HostMasters Costa Tropical S.L. Users may not copy, modify, or
          distribute any part of the platform without written permission.
        </p>

        <h2>8. Prohibited Conduct</h2>
        <ul>
          <li>Providing false or misleading information</li>
          <li>Circumventing platform processes (e.g., direct crew contact by managers)</li>
          <li>Sharing Smart Lock codes with unauthorized persons</li>
          <li>Using the platform for illegal activities</li>
          <li>Scraping, automated access, or reverse-engineering the platform</li>
        </ul>

        <h2>9. Limitation of Liability</h2>
        <p>
          HostMasters is not liable for: guest-caused property damage beyond platform guarantees (Airbnb AirCover,
          Booking.com Damage Policy), loss of revenue due to market conditions, or service interruptions caused
          by third-party providers (Stripe, Airbnb, Booking.com).
        </p>

        <h2>10. Termination</h2>
        <p>
          HostMasters may suspend or terminate accounts for: non-payment (after 30-day cure period), breach of
          these terms, fraud, or illegal activity. Users may delete their account by contacting
          support@hostmasters.es.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These terms are governed by Spanish law. Disputes shall be submitted to the courts of Granada, Spain.
        </p>

        <h2>12. Contact</h2>
        <p>
          Questions about these terms: <a href="mailto:legal@hostmasters.es">legal@hostmasters.es</a>
        </p>

        <hr />
        <p className="text-sm text-gray-500">
          See also: <Link href="/privacy">Privacy Policy</Link>
        </p>
      </main>
    </div>
  )
}
