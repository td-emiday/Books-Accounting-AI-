export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-[#a1a1aa]">
      <h1 className="font-instrument-serif italic text-4xl text-white mb-8">Terms of Service</h1>
      <p className="text-sm text-[#71717a] mb-6">Last updated: March 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using Emiday (&quot;the Service&quot;), operated by Emiday AI Ltd, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
          <p>Emiday is an AI-powered accounting and tax compliance platform designed for businesses in Nigeria, Ghana, and South Africa. The Service provides bookkeeping automation, tax estimation, financial reporting, and AI-assisted financial insights.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Account Registration</h2>
          <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Acceptable Use</h2>
          <p>You agree not to misuse the Service, including but not limited to: attempting to gain unauthorized access, interfering with the Service&apos;s operation, uploading malicious content, or using the Service for illegal purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. AI-Generated Content Disclaimer</h2>
          <p>The Service uses artificial intelligence to categorise transactions, estimate taxes, and provide financial insights. These outputs are estimates only and do not constitute professional accounting or tax advice. You should consult a qualified accountant before making financial decisions based on AI-generated content.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Data &amp; Privacy</h2>
          <p>Your use of the Service is also governed by our <a href="/privacy" className="text-[#5B21B6] hover:underline">Privacy Policy</a>. We process your financial data solely to provide the Service and do not sell your data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Subscription &amp; Billing</h2>
          <p>Certain features require a paid subscription. Billing occurs on a monthly or annual basis as selected. You may cancel at any time; cancellation takes effect at the end of the current billing period.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Emiday AI Ltd shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to inaccurate tax estimates or financial losses.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Modifications</h2>
          <p>We reserve the right to modify these Terms at any time. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">10. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:hello@emiday.africa" className="text-[#5B21B6] hover:underline">hello@emiday.africa</a>.</p>
        </section>
      </div>
    </div>
  );
}
