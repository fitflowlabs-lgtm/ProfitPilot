export default function TermsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      color: '#e8eaf0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      padding: '48px 24px',
    }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
            <rect width="30" height="30" rx="7" fill="#3b82f6"/>
            <path d="M7 22l5-9 5 6 3-4 3 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#e8eaf0', letterSpacing: '-0.02em', lineHeight: 1 }}>Margin Pilot</div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#6b7a99', letterSpacing: '0.12em', marginTop: 3 }}>PROFITABILITY ENGINE</div>
          </div>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8, color: '#e8eaf0' }}>Terms of Service</h1>
        <p style={{ color: '#6b7a99', fontSize: '0.875rem', marginBottom: 40 }}>Last updated: April 2026</p>

        {[
          {
            title: 'Welcome to Margin Pilot',
            body: 'By accessing or using Margin Pilot ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.',
          },
          {
            title: 'About the Service',
            body: 'Margin Pilot is a profitability analytics tool for Shopify merchants. It connects to your Shopify store to analyze product margins, pricing, and inventory, and provides AI-powered recommendations to help you make better business decisions.\n\nMargin Pilot is an independent service and is not affiliated with, endorsed by, or sponsored by Shopify Inc. or any of its affiliates.',
          },
          {
            title: 'License to Use',
            body: 'Margin Pilot grants you a limited, non-exclusive, non-transferable, revocable license to use the Service for your business purposes, subject to these Terms. This license does not include the right to:',
            list: [
              'Modify, copy, or distribute the Service or its content',
              'Reverse engineer or disassemble any part of the Service',
              'Resell or sublicense access to the Service',
              'Remove any copyright or proprietary notices',
            ],
          },
          {
            title: 'Shopify Connection',
            body: 'To use Margin Pilot, you will connect your Shopify store via Shopify\'s official OAuth process. By doing so, you authorize Margin Pilot to access certain store data including products, variants, orders, and inventory. You acknowledge that:',
            list: [
              'You must have the legal right to connect the Shopify store you authorize',
              'You are responsible for maintaining the security of your Shopify account',
              'You can revoke Margin Pilot\'s access at any time through your Shopify admin',
              'Margin Pilot will only access data necessary to provide the Service',
            ],
          },
          {
            title: 'AI-Powered Recommendations',
            body: 'Margin Pilot uses artificial intelligence to generate pricing recommendations, margin analysis, and inventory insights. You acknowledge and agree that:',
            list: [
              'All recommendations are suggestions only and do not constitute financial or business advice',
              'You are solely responsible for any pricing or business decisions you make based on the Service',
              'AI-generated analysis may contain errors or inaccuracies',
              'Past sales data does not guarantee future performance',
              'Margin Pilot is not liable for any financial outcomes resulting from actions taken based on its recommendations',
            ],
          },
          {
            title: 'Subscriptions and Payments',
            body: 'Margin Pilot offers a paid subscription plan. By subscribing, you agree to pay the applicable fees. Payments are processed securely through Stripe. You agree that:',
            list: [
              'Subscription fees are billed on a recurring monthly basis',
              'You may cancel your subscription at any time through your account settings',
              'Refunds are not provided for partial billing periods unless required by applicable law',
              'We reserve the right to change pricing with reasonable notice',
              'Failed payments may result in suspension of your account',
            ],
          },
          {
            title: 'Accuracy of Data',
            body: 'Margin Pilot syncs data from your Shopify store and presents analysis based on that data. However:',
            list: [
              'Analysis is only as accurate as the data in your Shopify store',
              'Cost of goods data you enter manually is your responsibility to verify',
              'We cannot guarantee uninterrupted sync with Shopify\'s API',
              'You should independently verify important business decisions',
            ],
          },
          {
            title: 'User Conduct',
            body: 'You agree to use Margin Pilot only for lawful purposes. You agree not to:',
            list: [
              'Use the Service in any way that violates applicable laws or regulations',
              'Attempt to gain unauthorized access to any part of the Service or other users\' accounts',
              'Use the Service to process or store data you are not authorized to access',
              'Interfere with or disrupt the Service\'s infrastructure',
              'Use automated tools to scrape or extract data from the Service',
            ],
          },
          {
            title: 'Intellectual Property',
            body: 'The Service, including its design, features, and functionality, is owned by Margin Pilot and protected by applicable intellectual property laws. Shopify and all related trademarks are the property of Shopify Inc.',
          },
          {
            title: 'Termination',
            body: 'We reserve the right to suspend or terminate your access to the Service at any time for conduct that violates these Terms or is harmful to the Service or other users. You may cancel your account at any time. Upon termination, your data will be retained for 30 days before deletion.',
          },
          {
            title: 'Disclaimer of Warranties',
            body: 'The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability or fitness for a particular purpose. We do not warrant that the Service will be uninterrupted or error-free.',
          },
          {
            title: 'Limitation of Liability',
            body: 'To the fullest extent permitted by law, Margin Pilot shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of profits, loss of data, or business interruption, even if advised of the possibility of such damages.',
          },
          {
            title: 'Indemnification',
            body: 'You agree to indemnify and hold harmless Margin Pilot and its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.',
          },
          {
            title: 'Governing Law',
            body: 'These Terms shall be governed by the laws of the State of Nevada, United States, without regard to its conflict of law provisions.',
          },
          {
            title: 'Dispute Resolution',
            body: 'Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You waive any right to a jury trial or participation in a class action.',
          },
          {
            title: 'Changes to These Terms',
            body: 'We may update these Terms from time to time. Changes are effective upon posting. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.',
          },
          {
            title: 'Contact Us',
            body: 'Email: support@marginpilot.co\nWebsite: marginpilot.co',
          },
        ].map(({ title, body, list }) => (
          <div key={title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e8eaf0', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.8rem' }}>
              {title}
            </h2>
            {body && body.split('\n\n').map((para, i) => (
              <p key={i} style={{ color: '#9aa3b8', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: 8 }}>{para}</p>
            ))}
            {list && (
              <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
                {list.map((item) => (
                  <li key={item} style={{ color: '#9aa3b8', fontSize: '0.9rem', lineHeight: 1.75, marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <a href="/privacy" style={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/" style={{ color: '#6b7a99', fontSize: '0.85rem', textDecoration: 'none' }}>Back to Margin Pilot</a>
        </div>
      </div>
    </div>
  )
}
