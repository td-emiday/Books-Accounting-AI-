export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-[#a1a1aa]">
      <h1 className="font-instrument-serif italic text-4xl text-white mb-8">Privacy Policy</h1>
      <p className="text-sm text-[#71717a] mb-6">Last updated: March 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
          <p><strong className="text-white">Account information:</strong> Name, email address, company name, and role when you register.</p>
          <p className="mt-2"><strong className="text-white">Financial data:</strong> Bank statements, transaction records, and tax-related data you upload or enter into the Service.</p>
          <p className="mt-2"><strong className="text-white">Usage data:</strong> Pages visited, features used, device type, and browser information collected automatically.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Provide and improve the Service (bookkeeping, tax calculations, reports)</li>
            <li>Process your financial data through AI models for categorisation and insights</li>
            <li>Send you important notifications (tax deadlines, account updates)</li>
            <li>Respond to your support requests</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. AI Data Processing</h2>
          <p>When processing your financial data through AI models, we strip personally identifiable information (PII) including account numbers, BVN, and card numbers before sending data to AI providers. We log AI predictions for quality improvement but do not use your data to train third-party models.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Data Storage &amp; Security</h2>
          <p>Your data is stored securely on Supabase infrastructure with AES-256 encryption at rest and TLS in transit. We implement row-level security (RLS) to ensure you can only access your own data. We do not store your bank login credentials.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Data Sharing</h2>
          <p>We do not sell your personal or financial data. We share data only with:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong className="text-white">AI providers:</strong> Sanitised transaction data for categorisation (PII stripped)</li>
            <li><strong className="text-white">Payment processors:</strong> Billing information for subscription payments</li>
            <li><strong className="text-white">Email services:</strong> Your email for transactional notifications</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Access and export your data at any time</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for non-essential data processing</li>
          </ul>
          <p className="mt-2">These rights are provided in compliance with the Nigeria Data Protection Commission (NDPC) regulations.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Data Retention</h2>
          <p>We retain your financial data for as long as your account is active. Upon account deletion, we permanently remove your data within 30 days, except where retention is required by law.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Contact</h2>
          <p>For privacy-related inquiries, contact our data protection officer at <a href="mailto:hello@emiday.africa" className="text-[#5B21B6] hover:underline">hello@emiday.africa</a>.</p>
        </section>
      </div>
    </div>
  );
}
